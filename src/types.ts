export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface GameState {
  tableau: Card[][];
  stock: Card[][];
  foundation: Card[][];
  moves: number;
}

export interface Pattern {
  id: string;
  difficulty: Difficulty;
  tableau: {suit: Suit; rank: Rank}[][];
  stock: {suit: Suit; rank: Rank}[][];
}
