# Project Structure

```
language_learning/
├── index.html              # Primary app (current). Full trainer: modes, TTS, recognition, AI, CSV editor.
├── index_full.html         # Alternate/older variant of the app (similar layout, kept for reference).
├── learn_bible.ico         # Favicon.
├── web.config              # IIS config; enables static directory browsing.
├── predefined_phrases/     # Bundled phrase sets + a directory-listing page.
│   ├── index.html          # GitHub-API-backed directory listing for the folder.
│   ├── ESEN_*.csv          # Spanish→English sets (idioms, business, phrasal verbs, speech topics, etc.).
│   ├── vida_diaria_*.csv   # Multi-language everyday-life sets (ES;EN;IT;PT).
│   └── *.csv               # Other themed phrase sets.
└── prompts/                # Prompt templates used to generate phrase content with an LLM.
    ├── index.html
    ├── speech.md           # Prompt: narrative text → short-phrase bilingual CSV.
    └── speech_app_details.md  # Prompt: technical topic explanation → bilingual CSV.
```

## Key Locations
- **Main app**: `index.html`. Single-file — HTML markup, inline `<style>`, and one inline `<script>` IIFE. Treat this as the source of truth for current behavior.
- **Phrase data**: `predefined_phrases/`. Semicolon-separated files. File names follow a loose convention: `<LANGPAIR>_<Category>_<Topic>.csv` (e.g. `ESEN_NoLiteral_Idioms.csv`) or descriptive snake_case (e.g. `vida_diaria_familia_1.csv`).
- **Content-generation prompts**: `prompts/`. Markdown templates with `[INPUTS]` and `[INSTRUCCIONES]` sections that instruct an LLM to output a clean 2-column `;`-separated CSV (no headers, no quotes, no markdown) — matching the format the app consumes.

## Naming Conventions
- Predefined set prefix `ESEN_` denotes a Spanish/English pair. `NoLiteral_` marks idiomatic (non-literal) translation sets; `Speech_` marks single-topic explanatory sets; `Intensive_` marks focused grammar/vocab drills.
- Keep new phrase files in `predefined_phrases/` so they are auto-discovered by the app's set picker.

## Notes for Editing
- When adding UI, follow the existing `.container` / `.container2c` / `.row` / `.panel` card structure and the CSS custom properties (`--bg`, `--fg`, `--accent`, etc.) for theming.
- Open TODOs are tracked inline at the bottom of `index.html` (the `#todoList` section).
- If `index.html` and `index_full.html` diverge, `index.html` is the one to update unless the user says otherwise.
