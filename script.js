// --- Utilities ---
  function normalizeForCompare(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')               // remove punctuation
      .replace(/\s+/g, ' ')                            // collapse spaces
      .trim();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const v0 = new Array(n + 1);
    const v1 = new Array(n + 1);
    for (let i = 0; i <= n; i++) v0[i] = i;
    for (let i = 0; i < m; i++) {
      v1[0] = i + 1;
      const ai = a.charCodeAt(i);
      for (let j = 0; j < n; j++) {
        const cost = ai === b.charCodeAt(j) ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let j = 0; j <= n; j++) v0[j] = v1[j];
    }
    return v0[n];
  }

  function similarityPercent(a, b) {
    const A = normalizeForCompare(a);
    const B = normalizeForCompare(b);
    if (!A && !B) return 100;
    const dist = levenshtein(A, B);
    const base = Math.max(A.length, B.length);
    const pct = Math.max(0, Math.round((1 - dist / base) * 100));
    return pct;
  }

  function pickRandomIndex(len) {
    return len > 0 ? Math.floor(Math.random() * len) : -1;
  }

  function applyShowVisibility() {
    for (const k of langs) {
      const show = els.show[k].checked;
      document.querySelector(`.phrase-line[data-lang="${k}"]`).style.display = show ? 'grid' : 'none';
    }
  }

  // Single-language replay (row scope only)
  function replayLanguage(k) {
    if (currentIndex < 0 || !parsedRows[currentIndex]) return;
    const sessionToken = ++phraseSessionId;
    try { speechSynthesis.cancel(); } catch {}
    const row = parsedRows[currentIndex];
    const text = row[k] || '';
    const vmap = getVoicesMap();
    const voices = speechSynthesis.getVoices();
    const v = voices.find(v => v.name === vmap[k]) || voices.find(v => v.lang && v.lang.startsWith(langMeta[k].localeGuess[0].slice(0,2)));
    const u = new SpeechSynthesisUtterance(text);
    if (v) u.voice = v;
    u.lang = (v && v.lang) ? v.lang : langMeta[k].localeGuess[0];
    const { rate, pitch } = getRatePitch();
    u.rate = rate; u.pitch = pitch;
    speechSynthesis.speak(u);
  }

  // --- Selection & Display ---
  function ensureParsed() {
    parsedRows = parseCSV(els.csvBox.value);
  }

  function selectAndShowRandomRow({ speak = true } = {}) {
    ensureParsed();
    if (!parsedRows.length) return Promise.resolve();
    currentIndex = pickRandomIndex(parsedRows.length);
    const row = parsedRows[currentIndex];
    setPhraseTexts(row);
    applyShowVisibility();
    const sessionToken = ++phraseSessionId;
    if (speak) {
      return speakCurrentRowSequence(sessionToken, row);
    }
    return Promise.resolve();
  }

  
  // --- Speaking Practice Flow ---
  function createRecognition(lang) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = pickRecLang(lang);
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    return rec;
  }

  async function safeAdvanceSpeakingPractice(prevToken) {
    // Cancel all previous activities, increment session, then proceed
    try { speechSynthesis.cancel(); } catch {}
    if (speakingPractice.rec) {
      try { speakingPractice.rec.abort(); } catch {}
      speakingPractice.rec = null;
    }
    const newToken = ++phraseSessionId;
    if (!speakingPractice.active) return;
    // Move to next phrase: select + speak once, await speak, then listen again
    await selectAndShowRandomRow({ speak: true });
    if (!speakingPractice.active) return;
    // Restart recognition for the new target
    await startSpeakingPracticeCycleOnly();
  }

  async function startSpeakingPracticeCycleOnly() {
    // Start listening for current phrase without triggering TTS again
    const target = (parsedRows[currentIndex] || {})[speakingPractice.lang] || '';
    const myToken = phraseSessionId;

    if (speakingPractice.rec) {
      try { speakingPractice.rec.abort(); } catch {}
      speakingPractice.rec = null;
    }
    const rec = createRecognition(speakingPractice.lang);
    speakingPractice.rec = rec;
    if (!rec) {
      speakingPractice.statusEl.textContent = 'Speech recognition not supported in this browser.';
      speakingPractice.active = false;
      return;
    }

    speakingPractice.liveTextEl.textContent = '';
    speakingPractice.progressEl.value = 0;
    speakingPractice.scoreEl.textContent = '0%';
    speakingPractice.statusEl.textContent = 'Listening…';

    rec.onresult = (e) => {
      if (!speakingPractice.active) return;
      if (myToken !== phraseSessionId) return;
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      const live = (finalText || interim || '').trim();
      speakingPractice.liveTextEl.textContent = live;

      const pct = similarityPercent(live, target);
      speakingPractice.progressEl.value = pct;
      speakingPractice.scoreEl.textContent = pct + '%';

      if (pct >= speakingPractice.min && finalText) {
        speakingPractice.statusEl.textContent = 'Great! ✅';
        try { rec.abort(); } catch {}
        safeAdvanceSpeakingPractice(myToken);
      }
    };
    rec.onerror = () => {
      if (!speakingPractice.active) return;
      if (myToken !== phraseSessionId) return;
      speakingPractice.statusEl.textContent = 'Listening…';
    };
    rec.onend = () => {
      if (speakingPractice.active && myToken === phraseSessionId) {
        try { rec.start(); } catch {}
      }
    };
    try { rec.start(); } catch {}
  }

  function stopSpeakingPractice() {
    speakingPractice.active = false;
    if (speakingPractice.rec) {
      try { speakingPractice.rec.abort(); } catch {}
      speakingPractice.rec = null;
    }
    try { speechSynthesis.cancel(); } catch {}
    if (speakingPractice.statusEl) speakingPractice.statusEl.textContent = 'Stopped';
  }

   function stopWritingPractice() {
    writingPractice.active = false;
    if (writingPractice.inputEl) {
      writingPractice.inputEl.oninput = null;
      writingPractice.inputEl.disabled = true;
    }
    try { speechSynthesis.cancel(); } catch {}
    if (writingPractice.statusEl) writingPractice.statusEl.textContent = 'Stopped';
  }

  function updateCurrentWriteTarget() {
    const row = parsedRows[currentIndex] || {};
    const k = writingPractice.lang;
    writingPractice.currentWriteTarget = row[k] || '';
  }

  // --- Voices population ---
  function populateVoices() {
    const voices = speechSynthesis.getVoices();
    for (const k of langs) {
      const sel = els.voices[k];
      const prev = sel.value;
      sel.innerHTML = '';
      const group = voices
        .filter(v => v.lang && v.lang.toLowerCase().startsWith(k))
        .concat(voices.filter(v => !(v.lang && v.lang.toLowerCase().startsWith(k)))); // fallback at end
      for (const v of group) {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang || '??'})`;
        sel.appendChild(opt);
      }
      // Try auto-select a sensible default
      const guess = voices.find(v => v.lang && langMeta[k].localeGuess.some(gl => v.lang.startsWith(gl)));
      if (guess) sel.value = guess.name;
      if (!sel.value && sel.options.length) sel.selectedIndex = 0;
      if (prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
    }
  }

  // --- Predefined sets discovery & loading ---
  async function populatePredefinedList() {
  const sel = els.predefinedSelect;
  sel.innerHTML = ''; // Limpiar opciones previas

  try {
    // Intento local
    const res = await fetch('./predefined_phrases/');
    const text = await res.text();
    const tmp = document.createElement('div');
    tmp.innerHTML = text;
    const links = [...tmp.querySelectorAll('a[href$=".csv"], a[href$=".txt"]')];
    const names = links.map(a => (a.textContent || '').trim()).filter(Boolean);
    if (names.length === 0) throw new Error('No se encontraron archivos válidos en el servidor local.');
    for (const n of names) {
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      sel.appendChild(opt);
    }
  } catch (error) {
    console.warn('Fallo la carga local:', error.message || error.toString());
    await fallbackToGithub();
  }


