import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
type Difficulty = 'easy' | 'medium' | 'hard';

interface CardData {
  suit: Suit;
  rank: Rank;
}

interface Pattern {
  id: string;
  difficulty: Difficulty;
  tableau: CardData[][];
  stock: CardData[][];
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePattern(difficulty: Difficulty, index: number): Pattern {
  let suits: Suit[];
  if (difficulty === 'easy') {
    suits = ['spades','spades','spades','spades','spades','spades','spades','spades'];
  } else if (difficulty === 'medium') {
    suits = ['spades','spades','spades','spades','hearts','hearts','hearts','hearts'];
  } else {
    suits = ['spades','spades','hearts','hearts','diamonds','diamonds','clubs','clubs'];
  }

  const allCards: CardData[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      allCards.push({ suit, rank: rank as Rank });
    }
  }

  const shuffled = fisherYatesShuffle(allCards);

  const tableau: CardData[][] = [];
  let idx = 0;
  for (let c = 0; c < 10; c++) {
    const count = c < 4 ? 6 : 5;
    tableau.push(shuffled.slice(idx, idx + count));
    idx += count;
  }

  const stockCards = shuffled.slice(idx);
  const stock: CardData[][] = [];
  for (let r = 0; r < 5; r++) {
    stock.push(stockCards.slice(r * 10, (r + 1) * 10));
  }

  return { id: `${difficulty}-${index}`, difficulty, tableau, stock };
}

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
