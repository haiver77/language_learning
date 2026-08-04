# Tech Stack & Conventions

## Stack
- **Vanilla HTML + CSS + JavaScript**. No framework, no bundler, no package manager, no build step.
- All application logic lives inline in a single `<script>` IIFE inside the HTML file. All styles live in an inline `<style>` block.
- **No external runtime dependencies** — everything is browser-native.

## Browser APIs Used
- **Web Speech Synthesis API** (`speechSynthesis`, `SpeechSynthesisUtterance`) for text-to-speech.
- **Web Speech Recognition API** (`SpeechRecognition` / `webkitSpeechRecognition`) for speaking practice. This is Chromium-only; guard for its absence and degrade gracefully.
- **localStorage** for persisting UI configuration (key: `lang_trainer_config_v1`) and the OpenAI token (key: `openai_token`).
- **fetch** for loading predefined sets, the GitHub contents API fallback, and OpenAI calls.

## External Services
- **OpenAI Chat Completions API** (`https://api.openai.com/v1/chat/completions`, model `gpt-3.5-turbo`). The token is entered by the user in the UI and stored in `localStorage` — it is never committed to the repo. Do not hardcode API keys.
- **GitHub Contents API** as a fallback for listing `predefined_phrases/` when directory browsing is unavailable. Repo reference: `haiver77/language_learning`, branch `main`.

## Hosting
- Served as static files. `web.config` enables IIS directory browsing. Any static server works.
- Because `SpeechRecognition`, microphone access, and predefined-set fetching need a proper origin, prefer serving over `http(s)://` rather than opening via `file://`.

## Coding Conventions
- Keep everything self-contained in the single HTML file; do not introduce a build toolchain, npm, or frameworks unless the user explicitly asks.
- Element references are collected up-front into an `els` object; add new controls there.
- Language metadata (labels, locale guesses for voice/recognition) lives in the `langMeta` map — extend it when adding a language.
- Wrap fragile browser-API calls in `try/catch`; speech APIs throw inconsistently across browsers.
- Speech sequencing uses a monotonic `phraseSessionId` token to cancel stale playback — preserve this pattern when touching TTS/recognition flow. Note: single-slot replay must NOT bump `phraseSessionId` (it should not interrupt active modes).
- Persist any new user-facing setting through `saveConfig()` / `loadConfig()`.

## Data Format
- Phrase files are **semicolon-separated** (`;`), not comma-separated, despite the `.csv` extension and "CSV" labels in the UI.
- Format is `Language1;Language2` per line (typically `Spanish;English`).
- Some legacy files carry four columns (`ES;EN;IT;PT`); the current app reads only the first two columns.
- The parser supports double-quoted fields with `""` escaping. No header row, no numbering, no blank lines.

## Running / Testing
- There is no automated test suite or build. "Running" means opening the app in a browser (ideally via a local static server).
- Manual verification: check TTS playback, mode switching, CSV parsing/coloring, predefined-set loading, and localStorage persistence across reloads.
