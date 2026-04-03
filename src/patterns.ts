import type { Difficulty, Pattern } from './types';
import { generatePattern } from './generatePattern';

/** パターンIDの生成に使うランダムインデックスの上限値 */
const PATTERN_INDEX_RANGE = 1_000_000;

export function getRandomPattern(difficulty: Difficulty): Pattern {
  const index = Math.floor(Math.random() * PATTERN_INDEX_RANGE);
  return generatePattern(difficulty, index);
}
