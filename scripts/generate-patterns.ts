import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Difficulty, Pattern } from '../src/types.ts';
import { generatePattern } from '../src/generatePattern.ts';

function generatePatterns(difficulty: Difficulty, count: number): Pattern[] {
  return Array.from({ length: count }, (_, i) => generatePattern(difficulty, i));
}

const outputDir = join(process.cwd(), 'public', 'patterns');
mkdirSync(outputDir, { recursive: true });

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
for (const difficulty of difficulties) {
  const patterns = generatePatterns(difficulty, 10);
  const outputPath = join(outputDir, `${difficulty}.json`);
  writeFileSync(outputPath, JSON.stringify(patterns, null, 2));
  console.log(`Generated ${patterns.length} ${difficulty} patterns -> ${outputPath}`);
}
