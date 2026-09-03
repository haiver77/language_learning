# Context of current application

Language Learning Practice Modes

* Manual mode (Ramdom, Go to First)
* Auto (Ramdom, First, Start, Stop)
* Speaking practice mode (Transcription, Match level, Lang, Similarity, SilenceWait)
* Writing Pracice Mode (Type phrase)

Language Selection

* Language 1
* Language 2

Read Aloud Language

* Language 1 Flag
* Language 2 Flag

Visualization Languate

* Language 1 Flag
* Language 2 Flag

Visualization

* Font size.

Phrases

* Load by AI
* Load by Predefined
* Load from File

CSV Visualizer

CSV Editor

# Prompt para esqueleto UI

Transform this application into a mobile-first experience.

Use:

- Fixed bottom tab navigation
- 6 primary sections
- Dynamic content area
- Card-based content
- Large thumb-friendly buttons
- Minimal top navigation
- UX patterns similar to Duolingo, Linkeding, Microsoft Learn, and modern learning applications

Focus on usability and navigation simplicity rather than visual imitation.

# New design specification

## Bottom menu options (Left to right)

1. 🏋️ Practice Mode

   * Dummy Prototype: 1 Clicking on Practice Bottom Menu Button.png
   * When clicking in Practice mode button, it will appear a menu with 3 options:
     1. 👆 Manual Mode
     2. 🗣️ Speaking Practice
     3. ✍️ Dictate Practice
2. 📢 Voices Options

   * Dummy Prototype: 2 Clicking on Voice Settings Bottom Menu Button.png
   * When clicking in this button, a panel comes from down to up displaying the following elements
   * Description of content from top to bottom:
     - Title: Voices
     - Display the existing voice selection controls (Voice 1 and Voice 2)
     - Title: Options
     - Display existing "Rate" and "Pitch" controls
     - Title: Read Language
     - Display existing Read Language section (Comboboxes)
     -
3. 👀 Visualization Options

   * Dummy Prototype: 3 Clicking on Visualization Settings Bottom Menu Button.png
   * When clicking in this button, a panel comes from down to up displaying the following elements
   * Description of content from top to bottom:
     - Title: Visualization Options
     - Display the existing control to change font size
     - Display the existing checkbox to activate dark theme
     - Display the existing Show Language section
4. 🤖 Load Phrases

   * Dummy Prototype: 4 Clicking on Load Phrases Bottom Menu Button.png
   * When clicking in this button, a panel comes from down to up displaying the following elements
   * Description of content from top to bottom:
     - Title: Prompt (Load using Open AI)
     - Place existing text area to input the ai prompt
     - Display the existing controls "Level", "Quantity", "Min words", "OPEN_AI_TOKEN", "Load from AI".
     - Title: Load from file
     - Display control to "Choose File" and button.
     - Title: Predefined Sets
     - Display existing combobox to select predefined sets of phrases.
5. 📝 CSV Viewer

   * Dummy Prototype: N/A
   * When clicking on this option, the system will display the existing CSV Viewer control
6. ⚙️ Settings

   * Dummy Prototype: 6 Clicking on Configuration Bottom Menu Button.png
   * When clicking on this button, the system will display the remaining configurable options din't displayed yet, for example:
     - Title: Reproduction
       Display the existing control "Interval (Sec)"
     - Title: Speaking Practice
       Display the existing control "Min. Similarity (%)", and "Silence Wait (sec)".

# The main content

The main content that will be always visible in most of sections will be the phrases viewer without no changes, the language 1 phrase and language 2 phrase, and the controls for:

* 🔀 Toggle button (It Replaces the current ramdom combobox), if activated, then the phrase selection will work in ramdom mode, if deactivate, then, the phrase selection is sequencial.
* ⏮️ Button to go to first phrase
* ⏹️ Button to stop auto reproduction (Stop of existing auto mode)
* ▶️ Button to start auto reproduction (Star the existing auto mode)
* ⬅️ New Button to go to next phrase in the sequence
* ➡️ New button to go to previous phrase in the sequence
