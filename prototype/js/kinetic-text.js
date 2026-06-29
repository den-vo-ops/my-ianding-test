export function splitWords(text) {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => `<span class="kinetic-word">${word}</span>`)
    .join(' ');
}
