import type { Stage, TileKind } from "./types.js";

/**
 * map 文字列を「行の配列」に正規化する。
 * CR を除去し、`map: |` ブロック末尾に付きやすい空行を落とす。
 * 描画(render)と移動判定(game)の双方がこの座標系を共有するため 1 箇所に集約する。
 */
export function toRows(map: string): string[] {
  const rows = map.replace(/\r/g, "").split("\n");
  while (rows.length > 0 && rows[rows.length - 1] === "") {
    rows.pop();
  }
  return rows;
}

/**
 * (x, y) のタイル種別を返す。範囲外・legend 未定義文字は undefined。
 * loader が「map の全文字は legend 済み」を保証するので、
 * 実質 undefined ＝ グリッド範囲外を意味する。
 */
export function tileKindAt(stage: Stage, x: number, y: number): TileKind | undefined {
  const ch = toRows(stage.map)[y]?.[x];
  if (ch === undefined) return undefined;
  return stage.legend[ch];
}
