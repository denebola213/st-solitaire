import type { Difficulty, Pattern, Rank, Suit } from './types';

interface CardData {
  suit: Suit;
  rank: Rank;
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 指定された難易度でカードのパターンをランダムに生成する。
 *
 * @param difficulty - 難易度（'easy' | 'medium' | 'hard'）
 * @param index - 生成されたパターンのID文字列に使う連番。シャッフルには影響しない。
 */
export function generatePattern(difficulty: Difficulty, index: number): Pattern {
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
