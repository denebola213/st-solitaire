import type { Card, GameState, Pattern } from './types';
import type { Rank } from './types';

export function createGameFromPattern(pattern: Pattern): GameState {
  const tableau: Card[][] = pattern.tableau.map(col =>
    col.map((c, cardIdx) => ({
      ...c,
      faceUp: cardIdx === col.length - 1,
    }))
  );

  const stock: Card[][] = pattern.stock.map(round =>
    round.map(c => ({ ...c, faceUp: false }))
  );

  return {
    tableau,
    stock,
    foundation: [],
    moves: 0,
  };
}

export function getMovableSequenceStart(col: Card[]): number {
  if (col.length === 0) return -1;
  const last = col.length - 1;
  if (!col[last].faceUp) return -1;
  
  let start = last;
  while (start > 0) {
    const curr = col[start];
    const prev = col[start - 1];
    if (!prev.faceUp) break;
    if (prev.suit !== curr.suit) break;
    if (prev.rank !== curr.rank + 1) break;
    start--;
  }
  return start;
}

export function isValidMove(state: GameState, fromCol: number, fromIdx: number, toCol: number): boolean {
  const from = state.tableau[fromCol];
  const to = state.tableau[toCol];
  
  if (fromCol === toCol) return false;
  if (fromIdx < 0 || fromIdx >= from.length) return false;
  if (!from[fromIdx].faceUp) return false;
  
  const seqStart = getMovableSequenceStart(from);
  if (seqStart > fromIdx) return false;
  
  if (to.length === 0) return true;
  
  const topCard = to[to.length - 1];
  if (!topCard.faceUp) return false;
  
  return topCard.rank === from[fromIdx].rank + 1;
}

export function makeMove(state: GameState, fromCol: number, fromIdx: number, toCol: number): GameState {
  if (!isValidMove(state, fromCol, fromIdx, toCol)) return state;
  
  const newTableau = state.tableau.map(col => [...col]);
  const moving = newTableau[fromCol].splice(fromIdx);
  newTableau[toCol].push(...moving);
  
  if (newTableau[fromCol].length > 0) {
    const top = newTableau[fromCol][newTableau[fromCol].length - 1];
    if (!top.faceUp) {
      newTableau[fromCol][newTableau[fromCol].length - 1] = { ...top, faceUp: true };
    }
  }
  
  let newState: GameState = {
    ...state,
    tableau: newTableau,
    moves: state.moves + 1,
  };
  
  newState = checkAndCompleteSequences(newState);
  return newState;
}

export function dealFromStock(state: GameState): GameState {
  if (state.stock.length === 0) return state;
  
  const newStock = [...state.stock];
  const round = newStock.shift()!;
  
  const newTableau = state.tableau.map((col, i) => {
    const card = round[i];
    if (!card) return col;
    return [...col, { ...card, faceUp: true }];
  });
  
  let newState: GameState = {
    ...state,
    tableau: newTableau,
    stock: newStock,
    moves: state.moves + 1,
  };
  
  newState = checkAndCompleteSequences(newState);
  return newState;
}

export function checkAndCompleteSequences(state: GameState): GameState {
  let newTableau = state.tableau.map(col => [...col]);
  const newFoundation = [...state.foundation];
  let changed = true;
  
  while (changed) {
    changed = false;
    for (let c = 0; c < newTableau.length; c++) {
      const col = newTableau[c];
      if (col.length < 13) continue;
      
      const last13 = col.slice(-13);
      if (isCompleteSequence(last13)) {
        newFoundation.push(last13);
        newTableau[c] = col.slice(0, -13);
        if (newTableau[c].length > 0) {
          const top = newTableau[c][newTableau[c].length - 1];
          if (!top.faceUp) {
            newTableau[c][newTableau[c].length - 1] = { ...top, faceUp: true };
          }
        }
        changed = true;
        break;
      }
    }
  }
  
  return {
    ...state,
    tableau: newTableau,
    foundation: newFoundation,
  };
}

function isCompleteSequence(cards: Card[]): boolean {
  if (cards.length !== 13) return false;
  const suit = cards[0].suit;
  for (let i = 0; i < 13; i++) {
    if (cards[i].suit !== suit) return false;
    if (cards[i].rank !== ((13 - i) as Rank)) return false;
    if (!cards[i].faceUp) return false;
  }
  return true;
}

export function isGameWon(state: GameState): boolean {
  return state.foundation.length === 8;
}
