import type { Advocate } from '@DB/schema';

// Centralized advocate search logic with light normalization/stemming.
// - Normalizes punctuation, case, and whitespace
// - Simplistic word stemming to handle pluralization (e.g., 'disorders' -> 'disorder')
// - Designed to be locale-agnostic and resilient to minor input variations

function normalizeBase(input: string): string {
  // Normalize string: lowercase, Unicode fold, replace punctuation, collapse spaces.
  const lowered = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  // Replace connectors with spaces or words for better matching fidelity
  const replaced = lowered
    .replace(/&/g, ' and ')
    .replace(/[/\\]/g, ' ')
    .replace(/[()[\],.:;'"`]/g, ' ')
    .replace(/[-_]/g, ' ');
  return replaced.replace(/\s+/g, ' ').trim();
}

function stemWords(input: string): string {
  const words = input.split(' ');
  const stemmedWords = words.map((word) => {
    if (word.length <= 3) return word;
    if (word.endsWith('ies') && word.length > 4) {
      return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('sses')) {
      return word.slice(0, -2); // classes -> class
    }
    if (word.endsWith('es') && word.length > 4) {
      // boxes -> box, matches -> match (approximation)
      return word.slice(0, -2);
    }
    if (word.endsWith('s') && !word.endsWith('ss')) {
      return word.slice(0, -1);
    }
    return word;
  });
  return stemmedWords.join(' ');
}

function textMatches(searchNorm: string, searchStem: string, candidate: string): boolean {
  const norm = normalizeBase(candidate);
  // Fast path: exact normalized includes
  if (norm.includes(searchNorm)) return true;
  // Stemmed comparison for pluralization tolerance
  const normStem = stemWords(norm);
  return normStem.includes(searchStem);
}

export function filterAdvocates(advocates: Advocate[], rawSearchTerm: string): Advocate[] {
  // Early return to avoid unnecessary work on empty queries.
  const trimmed = rawSearchTerm.trim();
  if (trimmed === '') return advocates;

  const searchNorm = normalizeBase(trimmed);
  const searchStem = stemWords(searchNorm);

  return advocates.filter((advocate) => {
    const firstNameMatch = textMatches(searchNorm, searchStem, advocate.firstName);
    const lastNameMatch = textMatches(searchNorm, searchStem, advocate.lastName);
    const cityMatch = textMatches(searchNorm, searchStem, advocate.city);
    const degreeMatch = textMatches(searchNorm, searchStem, advocate.degree);
    const specialtiesMatch = advocate.specialties.some((s) =>
      textMatches(searchNorm, searchStem, s)
    );
    const yearsMatch = String(advocate.yearsOfExperience).includes(searchNorm);

    return (
      firstNameMatch ||
      lastNameMatch ||
      cityMatch ||
      degreeMatch ||
      specialtiesMatch ||
      yearsMatch
    );
  });
}
