import type { Stage, TileKind } from "./types.js";
import type { GameState } from "./game.js";
import { toRows } from "./grid.js";

/**
 * タイル種別 → 画面表示文字。
 * 表示の見た目はここ 1 箇所に集約する。将来 chalk で色付けする時も、
 * この対応表（と置換ロジック）だけ変えれば描画側は触らずに済む。
 */
export const GLYPH: Record<TileKind, string> = {
  wall: "#",
  floor: "·", // 中黒(·)。床を薄く見せて壁との差を出す
  start: "@",
  goal: "G",
};

/** legend の 1 文字を表示文字へ変換する。未定義文字は可視マーカー "?"。 */
function glyphOf(stage: Stage, ch: string): string {
  const kind = stage.legend[ch];
  return kind ? GLYPH[kind] : "?";
}

/**
 * Stage を「改行区切りのグリッド文字列」に変換する純粋関数（静的なマップ表示用）。
 * 副作用を持たない（console.log しない）ことで vitest から直接検証できる。
 */
export function renderStage(stage: Stage): string {
  return toRows(stage.map)
    .map((line) => [...line].map((ch) => glyphOf(stage, ch)).join(""))
    .join("\n");
}

/**
 * ゲーム状態を描画する純粋関数。マップの上にプレイヤーを重ねる。
 * - 現在地には start の glyph("@") を描く
 * - 開始マス(start)は歩いた跡として床に見せる（"@" が残らないように）
 */
export function renderGame(state: GameState): string {
  const { stage, player } = state;
  return toRows(stage.map)
    .map((line, y) =>
      [...line]
        .map((ch, x) => {
          if (x === player.x && y === player.y) return GLYPH.start;
          // 開始マスは床扱いにする
          return stage.legend[ch] === "start" ? GLYPH.floor : glyphOf(stage, ch);
        })
        .join(""),
    )
    .join("\n");
}
