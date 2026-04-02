import type { Card, GameState } from './types';
import { isValidMove, getMovableSequenceStart } from './game';

type MoveCallback = (fromCol: number, fromIdx: number, toCol: number) => void;
type SimpleCallback = () => void;

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RANK_DISPLAY: Record<number, string> = {
  1: 'A', 11: 'J', 12: 'Q', 13: 'K',
};

function rankToDisplay(rank: number): string {
  return RANK_DISPLAY[rank] ?? String(rank);
}

let currentState: GameState | null = null;
let onMoveCallback: MoveCallback | null = null;

interface DragState {
  fromCol: number;
  fromIdx: number;
  cards: Card[];
  ghost: HTMLElement;
  offsetX: number;
  offsetY: number;
}

let dragState: DragState | null = null;

function getClientXY(e: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if ('changedTouches' in e && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}

function getCSSInt(varName: string, fallback: number): number {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue(varName).trim()) || fallback;
}

function computeColumnHeight(col: Card[]): number {
  if (col.length === 0) return getCSSInt('--card-height', 112);
  const overlapFaceDown = getCSSInt('--overlap-facedown', 18);
  const overlapFaceUp = getCSSInt('--overlap-faceup', 28);
  const cardHeight = getCSSInt('--card-height', 112);
  let height = 0;
  for (let i = 0; i < col.length - 1; i++) {
    height += col[i].faceUp ? overlapFaceUp : overlapFaceDown;
  }
  return height + cardHeight;
}

function createGhost(cards: Card[]): HTMLElement {
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  const overlapFaceUp = getCSSInt('--overlap-faceup', 28);
  const cardHeight = getCSSInt('--card-height', 112);
  const cardWidth = getCSSInt('--card-width', 80);
  cards.forEach((card, i) => {
    const el = buildCardElement(card, -1, -1);
    el.style.position = 'absolute';
    el.style.top = `${i * overlapFaceUp}px`;
    el.style.left = '0';
    ghost.appendChild(el);
  });
  ghost.style.width = `${cardWidth}px`;
  ghost.style.height = `${(cards.length - 1) * overlapFaceUp + cardHeight}px`;
  ghost.style.position = 'fixed';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = '1000';
  ghost.style.opacity = '0.85';
  document.body.appendChild(ghost);
  return ghost;
}

function buildCardElement(card: Card, colIdx: number, cardIdx: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'card';
  if (!card.faceUp) {
    el.classList.add('face-down');
    return el;
  }
  el.classList.add('face-up');
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  if (isRed) el.classList.add('red');

  const symbol = SUIT_SYMBOLS[card.suit];
  const rankStr = rankToDisplay(card.rank);

  el.innerHTML = `
    <div class="card-corner top-left">
      <div class="card-rank">${rankStr}</div>
      <div class="card-suit-small">${symbol}</div>
    </div>
    <div class="card-center">${symbol}</div>
    <div class="card-corner bottom-right">
      <div class="card-rank">${rankStr}</div>
      <div class="card-suit-small">${symbol}</div>
    </div>
  `;

  if (colIdx >= 0 && cardIdx >= 0) {
    el.dataset.col = String(colIdx);
    el.dataset.idx = String(cardIdx);
    el.style.cursor = 'grab';
  }
  return el;
}

function highlightValidTargets(state: GameState, fromCol: number, fromIdx: number): void {
  const cols = document.querySelectorAll<HTMLElement>('.tableau-col');
  cols.forEach((colEl, toCol) => {
    if (isValidMove(state, fromCol, fromIdx, toCol)) {
      colEl.classList.add('valid-target');
    }
  });
}

function clearHighlights(): void {
  document.querySelectorAll('.valid-target').forEach(el => el.classList.remove('valid-target'));
}

function onPointerDown(e: MouseEvent | TouchEvent): void {
  const target = e.target as HTMLElement;
  const cardEl = target.closest<HTMLElement>('.card.face-up[data-col]');
  if (!cardEl || !currentState || !onMoveCallback) return;

  const fromCol = parseInt(cardEl.dataset.col!);
  const fromIdx = parseInt(cardEl.dataset.idx!);
  const col = currentState.tableau[fromCol];

  const seqStart = getMovableSequenceStart(col);
  if (seqStart < 0 || fromIdx < seqStart) return;

  const cards = col.slice(fromIdx);
  const { x, y } = getClientXY(e);

  const rect = cardEl.getBoundingClientRect();
  const offsetX = x - rect.left;
  const offsetY = y - rect.top;

  const ghost = createGhost(cards);
  ghost.style.left = `${x - offsetX}px`;
  ghost.style.top = `${y - offsetY}px`;

  dragState = { fromCol, fromIdx, cards, ghost, offsetX, offsetY };

  highlightValidTargets(currentState, fromCol, fromIdx);

  const colEl = document.querySelector<HTMLElement>(`.tableau-col[data-col="${fromCol}"]`);
  if (colEl) {
    const cardEls = colEl.querySelectorAll<HTMLElement>('.card');
    for (let i = fromIdx; i < col.length; i++) {
      if (cardEls[i]) cardEls[i].style.opacity = '0.3';
    }
  }

  e.preventDefault();
}

function onPointerMove(e: MouseEvent | TouchEvent): void {
  if (!dragState) return;
  const { x, y } = getClientXY(e);
  dragState.ghost.style.left = `${x - dragState.offsetX}px`;
  dragState.ghost.style.top = `${y - dragState.offsetY}px`;
  e.preventDefault();
}

function onPointerUp(e: MouseEvent | TouchEvent): void {
  if (!dragState || !currentState || !onMoveCallback) return;

  const { x, y } = getClientXY(e);

  clearHighlights();

  const colEl = document.querySelector<HTMLElement>(`.tableau-col[data-col="${dragState.fromCol}"]`);
  if (colEl) {
    colEl.querySelectorAll<HTMLElement>('.card').forEach(el => (el.style.opacity = ''));
  }

  dragState.ghost.style.display = 'none';
  const elemBelow = document.elementFromPoint(x, y);
  dragState.ghost.remove();

  const targetCol = elemBelow?.closest<HTMLElement>('.tableau-col');
  if (targetCol && targetCol.dataset.col !== undefined) {
    const toCol = parseInt(targetCol.dataset.col);
    onMoveCallback(dragState.fromCol, dragState.fromIdx, toCol);
  }

  dragState = null;
}

export function initUI(
  onMove: MoveCallback,
  onDeal: SimpleCallback,
  onUndo: SimpleCallback,
  onNewGame: SimpleCallback
): void {
  onMoveCallback = onMove;

  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);
  document.addEventListener('touchmove', onPointerMove, { passive: false });
  document.addEventListener('touchend', onPointerUp);
  document.addEventListener('touchcancel', onPointerUp);

  document.getElementById('stock-pile')!.addEventListener('click', onDeal);
  document.getElementById('undo-btn')!.addEventListener('click', onUndo);
  document.getElementById('new-game-btn')!.addEventListener('click', onNewGame);
}

export function renderGame(state: GameState): void {
  currentState = state;
  renderTableau(state);
  renderStock(state);
  renderFoundation(state);
  renderStats(state);
}

function renderTableau(state: GameState): void {
  const tableauEl = document.getElementById('tableau')!;
  tableauEl.innerHTML = '';

  const overlapFaceDown = getCSSInt('--overlap-facedown', 18);
  const overlapFaceUp = getCSSInt('--overlap-faceup', 28);

  state.tableau.forEach((col, colIdx) => {
    const colEl = document.createElement('div');
    colEl.className = 'tableau-col';
    colEl.dataset.col = String(colIdx);

    if (col.length === 0) {
      colEl.classList.add('empty-col');
    }

    let topOffset = 0;
    col.forEach((card, cardIdx) => {
      const cardEl = buildCardElement(card, colIdx, cardIdx);

      cardEl.style.top = `${topOffset}px`;
      topOffset += card.faceUp ? overlapFaceUp : overlapFaceDown;

      if (card.faceUp) {
        cardEl.addEventListener('mousedown', onPointerDown);
        cardEl.addEventListener('touchstart', onPointerDown, { passive: false });
      }

      colEl.appendChild(cardEl);
    });

    colEl.style.height = `${computeColumnHeight(col)}px`;
    tableauEl.appendChild(colEl);
  });
}

function renderStock(state: GameState): void {
  const stockEl = document.getElementById('stock-pile')!;
  stockEl.innerHTML = '';
  if (state.stock.length > 0) {
    const pile = document.createElement('div');
    pile.className = 'stock-card face-down';
    const count = document.createElement('span');
    count.className = 'stock-count-label';
    count.textContent = String(state.stock.length);
    pile.appendChild(count);
    stockEl.appendChild(pile);
  } else {
    stockEl.innerHTML = '<div class="stock-empty">Empty</div>';
  }
}

function renderFoundation(state: GameState): void {
  const foundEl = document.getElementById('foundation-area')!;
  foundEl.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const slot = document.createElement('div');
    slot.className = 'foundation-slot';
    if (state.foundation[i]) {
      const top = state.foundation[i][0];
      const symbol = SUIT_SYMBOLS[top.suit];
      slot.classList.add('filled');
      slot.innerHTML = `<div class="foundation-suit">${symbol}</div>`;
    }
    foundEl.appendChild(slot);
  }
}

function renderStats(state: GameState): void {
  const moveEl = document.getElementById('move-count');
  const stockEl = document.getElementById('stock-count');
  const foundEl = document.getElementById('foundation-count');
  if (moveEl) moveEl.textContent = String(state.moves);
  if (stockEl) stockEl.textContent = String(state.stock.length);
  if (foundEl) foundEl.textContent = String(state.foundation.length);
}
