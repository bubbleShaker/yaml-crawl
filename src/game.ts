import type { Stage, Position, Direction, GameState } from "./types.js";
import { toRows, tileKindAt } from "./grid.js";

/** 方向 → 座標の増分 */
const DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** map から start 位置を探して初期状態を作る。 */
export function createGame(stage: Stage): GameState {
  const rows = toRows(stage.map);
  const startChars = Object.entries(stage.legend)
    .filter(([, kind]) => kind === "start")
    .map(([ch]) => ch);

  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      if (startChars.includes(row[x])) {
        return { stage, player: { x, y }, won: false };
      }
    }
  }
  // loader が start=1 個を保証するため通常ここには来ない（保険）。
  throw new Error("スタート地点が見つかりません");
}

/**
 * 指定方向へ移動を試みる純粋関数。
 * 壁・範囲外なら留まる（同一 state を返す）。ゴールに乗ると won=true。
 * クリア後(won)は操作を受け付けない。
 */
export function move(state: GameState, dir: Direction): GameState {
  if (state.won) return state;

  const delta = DELTA[dir];
  const nx = state.player.x + delta.x;
  const ny = state.player.y + delta.y;
  const kind = tileKindAt(state.stage, nx, ny);

  // 範囲外(undefined) または壁は進めない → 状態を変えない
  if (kind === undefined || kind === "wall") {
    return state;
  }

  return { ...state, player: { x: nx, y: ny }, won: kind === "goal" };
}
