import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { renderStage, renderGame, GLYPH } from "../src/render.js";
import { parseStage, loadStageFile } from "../src/loader.js";
import { createGame, move } from "../src/game.js";

const smallYaml = `
name: 小部屋
legend:
  "#": wall
  ".": floor
  "@": start
  "G": goal
map: |
  ####
  #@.#
  #.G#
  ####
`;

describe("renderStage", () => {
  it("legend の文字を TileKind ごとの表示文字に置換する", () => {
    const stage = parseStage(smallYaml);
    const out = renderStage(stage);
    // floor(".") は GLYPH.floor に、他はそれぞれの glyph に変換される
    const expected = ["####", `#@${GLYPH.floor}#`, `#${GLYPH.floor}G#`, "####"].join("\n");
    expect(out).toBe(expected);
  });

  it("wall/start/goal はそのままの見た目、floor だけ記号化される", () => {
    const stage = parseStage(smallYaml);
    const out = renderStage(stage);
    expect(out).toContain("@"); // start
    expect(out).toContain("G"); // goal
    expect(out).not.toContain("."); // 生の floor 文字は残らない
  });

  it("末尾の余分な空行を含まない（行数 = マップの高さ）", () => {
    const stage = parseStage(smallYaml);
    const out = renderStage(stage);
    expect(out.split("\n")).toHaveLength(4);
  });

  it("tutorial.yaml を描画できる", () => {
    const path = fileURLToPath(new URL("../stages/tutorial.yaml", import.meta.url));
    const stage = loadStageFile(path);
    const out = renderStage(stage);
    expect(out.split("\n")).toHaveLength(5);
    expect(out.split("\n")[0]).toBe("#######");
    // glyph 変換が実ファイル経由でも効いていること（回帰検出）
    expect(out).toContain("@"); // start
    expect(out).toContain("G"); // goal
    expect(out).toContain(GLYPH.floor); // 床が記号化されている
    expect(out).not.toContain("."); // 生の床文字は残らない
  });

  it("legend 未定義の文字は可視マーカー ? になる", () => {
    // 検証を通さず未定義文字を含む Stage を直接構築（renderStage の保険挙動）
    const stage = {
      name: "壊れた部屋",
      legend: { "#": "wall" as const },
      map: "#X#",
    };
    expect(renderStage(stage)).toBe("#?#");
  });
});

const roadYaml = `
name: 一本道
legend:
  "#": wall
  ".": floor
  "@": start
  "G": goal
map: |
  #####
  #@.G#
  #####
`;

describe("renderGame", () => {
  it("初期状態はスタート位置に @ を描く", () => {
    const out = renderGame(createGame(parseStage(roadYaml)));
    expect(out.split("\n")[1]).toBe(`#@${GLYPH.floor}G#`);
  });

  it("移動後は現在地に @、開始マスは床に戻る", () => {
    const state = move(createGame(parseStage(roadYaml)), "right");
    const out = renderGame(state);
    // 開始マス(1,1)は床、現在地(2,1)に @
    expect(out.split("\n")[1]).toBe(`#${GLYPH.floor}@G#`);
  });
});
