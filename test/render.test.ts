import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { renderStage, GLYPH } from "../src/render.js";
import { parseStage, loadStageFile } from "../src/loader.js";

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
  });
});
