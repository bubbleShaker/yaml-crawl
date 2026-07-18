import type { Stage, TileKind } from "./types.js";

/**
 * タイル種別 → 画面表示文字。
 * 表示の見た目はここ 1 箇所に集約する。将来 chalk で色付けする時も、
 * この対応表（と renderStage 内の置換）だけ変えれば描画側は触らずに済む。
 */
export const GLYPH: Record<TileKind, string> = {
  wall: "#",
  floor: "·", // 中黒(·)。床を薄く見せて壁との差を出す
  start: "@",
  goal: "G",
};

/**
 * Stage を「改行区切りのグリッド文字列」に変換する純粋関数。
 * 副作用を持たない（console.log しない）ことで vitest から直接検証できる。
 * 実際の画面出力は index.ts が console.log(renderStage(...)) で行う。
 */
export function renderStage(stage: Stage): string {
  // CR を除去し行に分割。map: | ブロックは末尾に空行が付きやすいので落とす。
  const lines = stage.map.replace(/\r/g, "").split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines
    .map((line) =>
      [...line]
        .map((ch) => {
          const kind = stage.legend[ch];
          // legend 未定義文字は loader が事前に弾く前提。保険として素の文字を残す。
          return kind ? GLYPH[kind] : ch;
        })
        .join(""),
    )
    .join("\n");
}
