import type { Difficulty, Pattern } from './types';
import { generatePattern } from './generatePattern';

export function getRandomPattern(difficulty: Difficulty): Pattern {
  const index = Math.floor(Math.random() * 1000);
  return generatePattern(difficulty, index);
}
