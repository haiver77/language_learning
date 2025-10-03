// TO REPLACE:
// -en --> -fr
// en: --> fr:
// .en. --> .fr.
// 'en' --> 'fr'
// en: { localeGuess: ['en-US','en-GB','en-AU'], label: 'EN' } --> fr: { localeGuess: ['fr-FR','fr-CA','fr-BE','fr-CH'], label: 'FR' }
(() => {
  // --- State ---
  const els = {
    text: {
      es: document.getElementById('text-es'),
      en: document.getElementById('text-en'),
    },
    replay: {
      es: document.getElementById('replay-es'),
      en: document.getElementById('replay-en'),
    },
    read: {
      es: document.getElementById('read-es'),
      en: document.getElementById('read-en'),
    },
    show: {
      es: document.getElementById('show-es'),
      en: document.getElementById('show-en'),
    },
    modeSelect: document.getElementById('modeSelect'),
    btnRandom: document.getElementById('btnRandom'),
    modeContent: document.getElementById('modeContent'),
    csvBox: document.getElementById('csvBox'),
    predefinedSelect: document.getElementById('predefinedSelect'),
    btnLoadPredefined: document.getElementById('btnLoadPredefined'),
    fileInput: document.getElementById('fileInput'),
    fontRange: document.getElementById('fontRange'),
    fontValue: document.getElementById('fontValue'),
    themeToggle: document.getElementById('themeToggle'),
    voices: {
      es: document.getElementById('voice-es'),
      en: document.getElementById('voice-en'),
    },
    rate: document.getElementById('rate'),
    pitch: document.getElementById('pitch'),
  };

  const langs = ['es','en'];
  const langMeta = {
    es: { localeGuess: ['es-ES','es-419','es-MX','es-AR','es-PE'], label: 'ES' },
    en: { localeGuess: ['en-US','en-GB','en-AU'], label: 'EN' },
  };
	//fr: { localeGuess: ['fr-FR','fr-CA','fr-BE','fr-CH'], label: 'FR' },
	//de: { localeGuess: ['de-DE','de-AT','de-CH'], label: 'DE' }
  

  let parsedRows = [];               // Array of {es,en}
  let currentIndex = -1;             // Index in parsedRows
  let phraseSessionId = 0;           // Monotonic token
  let autoTimer = null;              // Auto mode interval
  let speakingPractice = {
    active: false,
    rec: null,
    lang: 'en',
    min: 90,
    liveTextEl: null,
    scoreEl: null,
    progressEl: null,
    statusEl: null,
  };
  let writingPractice = {
    active: false,
    lang: 'en',
    inputEl: null,
    statusEl: null,
    writingBusy: false,
    currentWriteTarget: '',
  };

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

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const rows = [];
    for (const line of lines) {
      const cols = parseCSVLine(line);
      if (cols.length >= 2) {
        rows.push({ es: cols[0], en: cols[1] });
      }
    }
    return rows;
  }

  // Basic CSV line parser supporting double-quoted fields and escaped quotes "".
  function parseCSVLine(line) {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            cur += '"'; i++;
          } else {
            inQ = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === ';') {
          out.push(cur); cur = '';
        } else if (ch === '"') {
          inQ = true;
        } else {
          cur += ch;
        }
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
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

  function setPhraseTexts(row) {
    els.text.es.textContent = row?.es || '';
    els.text.en.textContent = row?.en || '';
  }

  function getReadOrder() {
    return ['es','en']; // fixed order
  }

  function getVoicesMap() {
    return {
      es: els.voices.es.value || '',
      en: els.voices.en.value || '',
    };
  }

  function getRatePitch() {
    return {
      rate: Math.max(0.5, Math.min(2, parseFloat(els.rate.value || '1') || 1)),
      pitch: Math.max(0, Math.min(2, parseFloat(els.pitch.value || '1') || 1)),
    };
  }

  // --- Speech Synthesis: robust sequence with session token and timeouts ---
  async function speakCurrentRowSequence(sessionToken, row) {
    // Gather settings
    const readLangs = {
      es: els.read.es.checked,
      en: els.read.en.checked,
    };
    const any = Object.values(readLangs).some(Boolean);
    if (!any) return; // resolve immediately

    // Wait for voices to be ready (up to 1000ms)
    await new Promise(res => {
      const start = performance.now();
      const done = () => res();
      const tryNow = () => {
        if (speechSynthesis.getVoices().length > 0 || performance.now() - start > 1000) {
          done();
        } else {
          setTimeout(tryNow, 100);
        }
      };
      if ('onvoiceschanged' in speechSynthesis) {
        let fired = false;
        const handler = () => { if (!fired) { fired = true; speechSynthesis.onvoiceschanged = null; done(); } };
        speechSynthesis.onvoiceschanged = handler;
        setTimeout(() => { if (!fired) { speechSynthesis.onvoiceschanged = null; done(); } }, 1000);
      } else {
        tryNow();
      }
    });

    // Cancel anything pending, then enqueue sequence
    try { speechSynthesis.cancel(); } catch {}

    const voices = speechSynthesis.getVoices();
    const voiceIds = getVoicesMap();
    const { rate, pitch } = getRatePitch();
    const order = getReadOrder().filter(k => readLangs[k]);

    let totalChars = 0;
    const utters = [];
    for (const k of order) {
      const text = (row && row[k]) ? String(row[k]) : '';
      totalChars += text.length;
      const u = new SpeechSynthesisUtterance(text);
      const v = voices.find(v => (v.name === voiceIds[k]) || (v.lang && langMeta[k].localeGuess.some(gl => v.lang.startsWith(gl.slice(0,2)))));
      if (v) u.voice = v;
      u.lang = (v && v.lang) ? v.lang : langMeta[k].localeGuess[0];
      u.rate = rate;
      u.pitch = pitch;
      utters.push({ k, u });
    }

    let endedCount = 0;
    let resolved = false;

    const finishResolve = () => {
      if (resolved) return;
      resolved = true;
      // no return (Promise resolved by outer async)
    };

    const hardTimeoutMs = Math.max(12000, 12000 + Math.ceil(totalChars / 100) * 2000);
    const hardTimer = setTimeout(() => {
      if (document.hidden) {
        try { speechSynthesis.cancel(); } catch {}
        finishResolve();
      } else {
        try { speechSynthesis.cancel(); } catch {}
        finishResolve();
      }
    }, hardTimeoutMs);

    // Poll speaking becomes false for >=300ms before resolve
    let lastSpeakingFalse = null;
    const poll = setInterval(() => {
      if (resolved) { clearInterval(poll); return; }
      if (!speechSynthesis.speaking) {
        if (lastSpeakingFalse == null) lastSpeakingFalse = performance.now();
        if (performance.now() - lastSpeakingFalse >= 300) {
          clearInterval(poll);
          clearTimeout(hardTimer);
          finishResolve();
        }
      } else {
        lastSpeakingFalse = null;
      }
    }, 100);

    await new Promise(resolve => {
      // Attach handlers and speak sequentially (enqueue lets them play in order)
      for (const { u } of utters) {
        u.onend = () => {
          if (resolved) return;
          if (sessionToken !== phraseSessionId) return;
          endedCount++;
          if (endedCount === utters.length) {
            // Let poll/300ms rule finalize; if nothing fires, poll will resolve
          }
        };
        u.onerror = () => {
          if (resolved) return;
          if (sessionToken !== phraseSessionId) return;
          endedCount++;
          // keep going; if all error/end, poll/timeout will settle
        };
        speechSynthesis.speak(u);
      }
      // The resolution is managed by polling + hard timeout; to "await" until resolve:
      const watcher = setInterval(() => {
        if (resolved) {
          clearInterval(watcher);
          clearInterval(poll);
          clearTimeout(hardTimer);
          resolve();
        }
      }, 50);
    });
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

  // --- Modes UI ---
  function renderModePanel() {
    const m = els.modeSelect.value;
    els.modeContent.innerHTML = '';
    if (m === 'Manual Mode') {
      const div = document.createElement('div');
      div.className = 'panel';
      
    } else if (m === 'Auto Mode') {
      const div = document.createElement('div');
      div.className = 'panel';
      div.innerHTML = `
        <div class="panel-title">Automatic rotation</div>
        <div class="inline-controls">
          <label class="badge"><span>Interval (s)</span>
            <input id="autoInterval" type="number" min="2" step="1" value="5" style="width:90px" />
          </label>
          <button id="autoStart">Start</button>
          <button id="autoStop" class="secondary">Stop</button>
          <span id="autoStatus" class="status">Stopped</span>
        </div>
      `;
      els.modeContent.appendChild(div);
      const autoStatus = div.querySelector('#autoStatus');
      const autoStart = () => {
        const sec = Math.max(1, parseInt(div.querySelector('#autoInterval').value || '5', 10));
        if (autoTimer) clearInterval(autoTimer);
        autoStatus.textContent = 'Running…';
        selectAndShowRandomRow({ speak: true });
        autoTimer = setInterval(() => {
          const token = ++phraseSessionId;
          // cancel previous speech before next cycle
          try { speechSynthesis.cancel(); } catch {}
          selectAndShowRandomRow({ speak: true });
        }, sec * 1000);
      };
      const autoStop = () => {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        autoStatus.textContent = 'Stopped';
      };
      div.querySelector('#autoStart').onclick = autoStart;
      div.querySelector('#autoStop').onclick = autoStop;
    } else if (m === 'Speaking Practice Mode') {
      const div = document.createElement('div');
      div.className = 'panel';
      div.innerHTML = `
        <div class="panel-title">Speaking practice</div>
        <div class="inline-controls">
          <label class="badge" width="100px"><span></span>
            <select id="sp-lang">
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </label>
          <label class="badge"><span>Min similarity %</span>
            <input id="sp-min" type="number" min="50" max="100" step="1" value="90" style="width:30px" />
          </label>
          <button id="sp-start">Start</button>
          <button id="sp-stop" class="secondary">Stop</button>
          <span id="sp-status" class="status">Idle</span>
        </div>
        <div class="panel" style="margin-top:10px">
          <div class="panel-title">Live transcription</div>
          <div class="progress-line">
            <progress id="sp-progress" value="0" max="100"></progress>
            <span id="sp-score" class="status">0%</span>
          </div>
          <div id="sp-live" class="status" style="margin-top:8px; font-size:15px;"></div>
        </div>
      `;
      els.modeContent.appendChild(div);

      speakingPractice.liveTextEl = div.querySelector('#sp-live');
      speakingPractice.progressEl = div.querySelector('#sp-progress');
      speakingPractice.scoreEl = div.querySelector('#sp-score');
      speakingPractice.statusEl = div.querySelector('#sp-status');

      div.querySelector('#sp-start').onclick = startSpeakingPractice;
      div.querySelector('#sp-stop').onclick = stopSpeakingPractice;
      div.querySelector('#sp-lang').onchange = e => { speakingPractice.lang = e.target.value; };
      div.querySelector('#sp-min').oninput = e => { speakingPractice.min = Math.max(50, Math.min(100, parseInt(e.target.value || '90', 10))); };
    } else if (m === 'Writing Practice Mode') {
      const div = document.createElement('div');
      div.className = 'panel';
      div.innerHTML = `
        <div class="panel-title">Writing practice</div>
        <div class="inline-controls">
          <label class="badge"><span>Practice language</span>
            <select id="wr-lang">
              <option value="es">ES</option>
              <option value="en">EN</option>
              <option value="it">IT</option>
              <option value="pt">PT</option>
            </select>
          </label>
          <button id="wr-start">Start</button>
          <button id="wr-stop" class="secondary">Stop</button>
          <span id="wr-status" class="status">Idle</span>
        </div>
        <div class="panel" style="margin-top:10px">
          <div class="panel-title">Type the phrase</div>
          <input id="wr-input" type="text" placeholder="Type here…" style="width: 100%" />
        </div>
      `;
      els.modeContent.appendChild(div);

      writingPractice.inputEl = div.querySelector('#wr-input');
      writingPractice.statusEl = div.querySelector('#wr-status');

      div.querySelector('#wr-start').onclick = startWritingPractice;
      div.querySelector('#wr-stop').onclick = stopWritingPractice;
      div.querySelector('#wr-lang').onchange = e => { writingPractice.lang = e.target.value; };
    }
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

  function pickRecLang(k) {
    // Use first locale guess for recognition; browsers may map internally
    return langMeta[k].localeGuess[0] || 'en-US';
  }

  async function startSpeakingPractice() {
    if (speakingPractice.active) return;
    speakingPractice.active = true;
    speakingPractice.lang = (els.modeContent.querySelector('#sp-lang')?.value) || 'es';
    speakingPractice.min = parseInt(els.modeContent.querySelector('#sp-min')?.value || '90', 10) || 90;
    speakingPractice.statusEl.textContent = 'Starting…';

    // User gesture initiates: select phrase and speak sequence, then start mic
    await selectAndShowRandomRow({ speak: true });
    if (!speakingPractice.active) return;

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
        // Prepare next phrase safely
        safeAdvanceSpeakingPractice(myToken);
      }
    };
    rec.onerror = () => {
      if (!speakingPractice.active) return;
      if (myToken !== phraseSessionId) return;
      // Keep listening; status note
      speakingPractice.statusEl.textContent = 'Listening…';
    };
    rec.onend = () => {
      // If ended unexpectedly while active and token still valid, attempt to restart
      if (speakingPractice.active && myToken === phraseSessionId) {
        try { rec.start(); } catch {}
      }
    };

    try { rec.start(); } catch {}
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

  // --- Writing Practice Flow ---
  async function startWritingPractice() {
    if (writingPractice.active) return;
    writingPractice.active = true;
    writingPractice.statusEl.textContent = 'Starting…';
    writingPractice.lang = (els.modeContent.querySelector('#wr-lang')?.value) || 'es';

    // Select and speak once
    await selectAndShowRandomRow({ speak: true });
    updateCurrentWriteTarget();
    writingPractice.statusEl.textContent = 'Type what you hear…';

    // Attach oninput handler referencing mutable target
    const input = writingPractice.inputEl;
    input.value = '';
    input.disabled = false;

    const onInput = async (e) => {
      if (!writingPractice.active || writingPractice.writingBusy) return;
      const user = normalizeForCompare(e.target.value);
      const target = normalizeForCompare(writingPractice.currentWriteTarget);
      if (user && user === target) {
        writingPractice.writingBusy = true;
        // Advance to next phrase safely; ensure single playback
        try { speechSynthesis.cancel(); } catch {}
        await selectAndShowRandomRow({ speak: true });
        updateCurrentWriteTarget();
        e.target.value = '';
        writingPractice.writingBusy = false;
      }
    };
    // Store handler so we can disable/enable without stale closure
    input.oninput = onInput;
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

  async function fallbackToGithub() {
    try {
      const user = "haiver77";       // ejemplo: "johnmalagon"
      const repo = "language_learning";   // ejemplo: "mi-web"
      const branch = "main";           // o "master" según tu repo
      const path = "predefined_phrases"; 

      const githubApiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}`;
      const res = await fetch(githubApiUrl);
      const files = await res.json();
      if (!Array.isArray(files)) throw new Error('Respuesta inesperada de GitHub');

      const validFiles = files
        .filter(f => f.name.endsWith('.csv') || f.name.endsWith('.txt'))
        .map(f => f.name);

      if (validFiles.length === 0) throw new Error('No se encontraron archivos válidos en GitHub.');

      for (const name of validFiles) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      }
    } catch (err) {
      alert('No se pudo cargar la lista de frases desde GitHub: ' + (err.message || err.toString()));
    }
  }
}


  async function loadSelectedPredefined() {
    const name = els.predefinedSelect.value;
    if (!name) return;
    try {
      const res = await fetch(`./predefined_phrases/${encodeURIComponent(name)}`);
      const text = await res.text();
      els.csvBox.value = text.trim();
      ensureParsed();
      if (parsedRows.length) {
        await selectAndShowRandomRow({ speak: false });
      }
    } catch {
      // ignore
    }
  }

  // --- Event wiring ---
  function bindEvents() {
    // Random button (global)
    els.btnRandom.onclick = async () => { populateVoices(); await selectAndShowRandomRow({ speak: true }); };
     // Mode switching
    els.modeSelect.onchange = () => {
      // Stop timers/practices on switch
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      stopSpeakingPractice();
      stopWritingPractice();
      renderModePanel();
    };

    // Replay per language
    for (const k of langs) {
      els.replay[k].onclick = () => replayLanguage(k);
    }

    // Show/Hide languages
    for (const k of langs) {
      els.show[k].onchange = applyShowVisibility;
    }

    // Font size
    const applyFont = () => {
      const px = Math.max(14, Math.min(100, parseInt(els.fontRange.value || '26', 10)));
      document.documentElement.style.setProperty('--phrase-font', px + 'px');
      els.fontValue.textContent = px + ' px';
    };
    els.fontRange.oninput = applyFont;

    // Theme toggle
    els.themeToggle.onchange = () => {
      const isDark = els.themeToggle.checked;
      document.body.classList.toggle('theme-light', !isDark);
      document.body.classList.toggle('theme-dark', isDark);
    };

    // CSV changes
    els.csvBox.oninput = () => {
      ensureParsed();
    };

    // Predefined
    els.btnLoadPredefined.onclick = loadSelectedPredefined;

    // File input
    els.fileInput.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      els.csvBox.value = text.trim();
      ensureParsed();
      await selectAndShowRandomRow({ speak: false });
    };

    // Voices ready
    if ('onvoiceschanged' in speechSynthesis) {
      speechSynthesis.onvoiceschanged = () => populateVoices();
    }
  }

  // --- Init sample data ---
  function loadSamplePhrases() {
    const sample = [
      'Hola;Hello',
      'Buenos días;Good morning',
      '¿Cómo estás?;How are you?'
    ].join('\n');
    els.csvBox.value = sample;
    ensureParsed();
  }

  // --- Bootstrap ---
  function init() {
    loadSamplePhrases();
    renderModePanel();
    bindEvents();
    applyShowVisibility();
    populateVoices();
    populatePredefinedList();

    // Initial phrase display (silent) so UI isn't empty
    selectAndShowRandomRow({ speak: false });

    // Defaults: dark theme, font slider reflect
    els.themeToggle.checked = true;
    els.fontRange.value = 26;
    els.fontValue.textContent = '26 px';
  }

  // Expose minimal for debugging (optional)
  window._trainer = { state: () => ({ currentIndex, phraseSessionId, parsedRowsCount: parsedRows.length }) };

  init();
})();