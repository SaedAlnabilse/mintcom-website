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


const TITLE_CASE_SMALL_WORDS = new Set([
  'a', 'an', 'the',
  'and', 'but', 'or', 'nor',
  'for', 'yet', 'so',
  'at', 'by', 'in', 'of', 'on', 'to', 'up', 'as',
  'if', 'it', 'is', 'vs', 'via',
]);

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function toTitleCase(value: string | null | undefined, locale = 'en'): string {
  if (!value || locale.toLowerCase().startsWith('ar') || !/[A-Za-z]/.test(value)) {
    return value || '';
  }

  const words = value.trim().split(/\s+/);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      const isAcronym = word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);

      if (isAcronym) {
        return word;
      }

      if (index > 0 && TITLE_CASE_SMALL_WORDS.has(lower)) {
        return lower;
      }

      return capitalizeWord(lower);
    })
    .join(' ');
}

export function formatInputLabel(value: string | null | undefined, locale = 'en'): string {
  return toTitleCase(value, locale);
}

export function formatInputPlaceholder(value: string | null | undefined, locale = 'en'): string {
  return toSentenceCase(value || '', locale);
}
