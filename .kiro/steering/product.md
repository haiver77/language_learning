# Product

## Overview
A browser-based **language learning phrase trainer**. It shows bilingual phrase pairs, speaks them aloud, and drills the learner through several practice modes. The app is entirely client-side — a single HTML file that runs in the browser with no backend of its own.

## Core Features
- **Bilingual phrase display**: two language slots (Language 1 / Language 2), each with its own replay button. Default pairing is Spanish → English. Selectable languages: ES, EN, IT, PT, DE, FR.
- **Practice modes** (selected from a dropdown):
  - *Manual Mode* — step through phrases manually.
  - *Auto Mode* — auto-advance with a configurable wait interval, random or sequential.
  - *Speaking Practice Mode* — uses the browser's SpeechRecognition to score spoken input word-by-word against the target phrase (similarity %, live transcription, correct/incorrect highlighting).
  - *Writing Practice Mode* — the learner types the phrase they hear; correct input advances to the next phrase.
- **Text-to-speech (TTS)**: reads phrases aloud via the Web Speech Synthesis API with selectable voices, rate, and pitch per language.
- **Phrase sources**:
  - Inline CSV editor (semicolon-separated) with a colorized read-only overlay and line numbers.
  - Predefined phrase sets loaded from the `predefined_phrases/` folder (with a GitHub API fallback).
  - Upload from a local `.csv` / `.txt` file.
  - **AI generation** via the OpenAI Chat Completions API (topic, CEFR level, quantity, minimum words).
- **Personalization**: dark/light theme, adjustable phrase font size, per-slot show/read toggles, phrase colors. All settings persist in `localStorage`.

## Target Users
Self-directed language learners (primarily Spanish/English) who want listening, speaking, and writing drills. Content leans toward everyday conversation, idioms, business/professional vocabulary, and technical-topic explanations.

## Design Principles
- Mobile-first, responsive layout.
- Zero install, zero build — open the HTML file (or serve it) and it works.
- Accessibility-minded: focus rings, aria labels on controls.
