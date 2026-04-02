import type { Difficulty, Pattern } from './types';

export async function loadPatterns(difficulty: Difficulty): Promise<Pattern[]> {
  const response = await fetch(`./patterns/${difficulty}.json`);
  if (!response.ok) throw new Error(`Failed to load patterns for ${difficulty}`);
  return response.json();
}

export async function getRandomPattern(difficulty: Difficulty): Promise<Pattern> {
  const patterns = await loadPatterns(difficulty);
  if (patterns.length === 0) {
    throw new Error(`No patterns available for difficulty: ${difficulty}`);
  }
  const idx = Math.floor(Math.random() * patterns.length);
  return patterns[idx];
}
