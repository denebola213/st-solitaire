import type { Difficulty, GameState } from './types';
import { createGameFromPattern, makeMove, dealFromStock, isGameWon } from './game';
import { getRandomPattern } from './patterns';
import { initUI, renderGame, computeAndSetCardSize } from './ui';

let currentState: GameState | null = null;
let history: GameState[] = [];

function showScreen(id: string): void {
  document.querySelectorAll<HTMLElement>('#difficulty-screen, #game-screen, #win-dialog').forEach(el => {
    el.style.display = 'none';
  });
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

async function startGame(difficulty: Difficulty): Promise<void> {
  history = [];
  try {
    const pattern = await getRandomPattern(difficulty);
    currentState = createGameFromPattern(pattern);
    showScreen('game-screen');
    renderGame(currentState);
  } catch (err) {
    console.error('Failed to load game pattern:', err);
    alert('Failed to load game. Please try again.');
  }
}

function handleMove(fromCol: number, fromIdx: number, toCol: number): void {
  if (!currentState) return;
  const newState = makeMove(currentState, fromCol, fromIdx, toCol);
  if (newState === currentState) return;
  history.push(currentState);
  currentState = newState;
  renderGame(currentState);
  if (isGameWon(currentState)) {
    showWin();
  }
}

function handleDeal(): void {
  if (!currentState) return;
  const newState = dealFromStock(currentState);
  if (newState === currentState) return;
  history.push(currentState);
  currentState = newState;
  renderGame(currentState);
  if (isGameWon(currentState)) {
    showWin();
  }
}

function handleUndo(): void {
  if (history.length === 0) return;
  currentState = history.pop()!;
  renderGame(currentState);
}

function handleNewGame(): void {
  showScreen('difficulty-screen');
}

function showWin(): void {
  const dialog = document.getElementById('win-dialog')!;
  const movesEl = document.getElementById('win-moves');
  if (movesEl && currentState) {
    movesEl.textContent = `Completed in ${currentState.moves} moves!`;
  }
  dialog.style.display = 'flex';
}

const RESIZE_DEBOUNCE_MS = 150;

initUI(handleMove, handleDeal, handleUndo, handleNewGame);

let resizeTimer: ReturnType<typeof setTimeout> | undefined;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    computeAndSetCardSize();
    if (currentState) renderGame(currentState);
  }, RESIZE_DEBOUNCE_MS);
});

document.querySelectorAll<HTMLButtonElement>('[data-difficulty]').forEach(btn => {
  btn.addEventListener('click', () => {
    const difficulty = btn.dataset.difficulty as Difficulty;
    startGame(difficulty);
  });
});

document.getElementById('play-again-btn')?.addEventListener('click', () => {
  showScreen('difficulty-screen');
});
