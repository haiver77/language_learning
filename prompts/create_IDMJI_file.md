# Goal:
- Reorganize the existing text ensuring that sentences and ideas are not split across lines and adding a Spanish translation at the beginning of each line.

# Requirements

1. Do not add, remove, replace, or modify any words from the original English text.
2. Remove all existing semicolons (;) before processing the document.
3. Reorganize the text so that:
   - Sentences and ideas are not split across lines.
   - Each line contains a complete thought whenever possible.
4. Each resulting line must contain more than 10 words and fewer than 40 words.
5. Add the punctuation marks you consider necessary to make the text clear.
6. For every line, prepend its Spanish translation.
7. Use a semicolon (;) as the separator between the Spanish translation and the original English text.


# Output Format

[Spanish translation];[Original English text]

# Processing Steps

1. Remove all existing semicolons (;) from the document.
2. Split and reorganize the original English text into lines that comply with the length and readability requirements.
3. Generate a Spanish translation for each line.
4. Place the Spanish translation at the beginning of the line.
5. Separate the Spanish translation and the original
