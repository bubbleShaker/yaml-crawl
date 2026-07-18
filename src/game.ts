import type { Stage, Position, Direction, GameState } from "./types.js";
import { toRows, tileKindAt, currentStage } from "./grid.js";

/** 方向 → 座標の増分 */
const DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** map から start 位置を探す。loader が start=1 個を保証するため通常必ず見つかる。 */
function findStart(stage: Stage): Position {
  const rows = toRows(stage.map);
  const startChars = Object.entries(stage.legend)
    .filter(([, kind]) => kind === "start")
    .map(([ch]) => ch);

  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      if (startChars.includes(row[x])) {
        return { x, y };
      }
    }
  }
  throw new Error("スタート地点が見つかりません");
}

/**
 * 初期状態を作る。単体 Stage・Stage[] のどちらも受け付ける
 * （単体は 1 ステージの配列として正規化する）。
 */
export function createGame(input: Stage | Stage[]): GameState {
  const stages = Array.isArray(input) ? input : [input];
  return { stages, index: 0, player: findStart(stages[0]), won: false };
}

/**
 * 指定方向へ移動を試みる純粋関数。
 * 壁・範囲外なら留まる（同一 state を返す）。
 * ゴールに乗ると: 最終ステージなら won=true（全クリア）、
 * それ以外なら次ステージへ遷移し player をその start へ置く。
 * クリア後(won)は操作を受け付けない。
 */
export function move(state: GameState, dir: Direction): GameState {
  if (state.won) return state;

  const stage = currentStage(state);
  const delta = DELTA[dir];
  const nx = state.player.x + delta.x;
  const ny = state.player.y + delta.y;
  const kind = tileKindAt(stage, nx, ny);

  // 範囲外(undefined) または壁は進めない → 状態を変えない
  if (kind === undefined || kind === "wall") {
    return state;
  }

  if (kind === "goal") {
    const isLast = state.index === state.stages.length - 1;
    if (isLast) {
      return { ...state, player: { x: nx, y: ny }, won: true };
    }
    // 次ステージへ: index を進め、player を次ステージの start に置く
    const nextIndex = state.index + 1;
    return { ...state, index: nextIndex, player: findStart(state.stages[nextIndex]) };
  }

  return { ...state, player: { x: nx, y: ny } };
}
