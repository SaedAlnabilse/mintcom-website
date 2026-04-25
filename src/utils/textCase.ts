export function toSentenceCase(value: string, locale = 'en'): string {
  if (!value || locale.toLowerCase().startsWith('ar') || !/[A-Za-z]/.test(value)) {
    return value;
  }

  const characters = Array.from(value);
  const firstLetterIndex = characters.findIndex((character) => /[A-Za-z]/.test(character));

  if (firstLetterIndex === -1) {
    return value;
  }

  return characters
    .map((character, index) => {
      if (!/[A-Za-z]/.test(character)) {
        return character;
      }

      return index === firstLetterIndex ? character.toUpperCase() : character.toLowerCase();
    })
    .join('');
}
