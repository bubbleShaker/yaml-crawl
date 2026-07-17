import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { parseStage, loadStageFile, StageValidationError } from "../src/loader.js";

const validYaml = `
name: テスト部屋
legend:
  "#": wall
  ".": floor
  "@": start
  "G": goal
map: |
  ###
  #@#
  #G#
  ###
`;

describe("parseStage", () => {
  it("正常な YAML を Stage として読める", () => {
    const stage = parseStage(validYaml);
    expect(stage.name).toBe("テスト部屋");
    expect(stage.legend["@"]).toBe("start");
    expect(stage.map).toContain("@");
  });

  it("name が欠けていると検証エラー", () => {
    const yaml = validYaml.replace("name: テスト部屋", "");
    expect(() => parseStage(yaml)).toThrow(StageValidationError);
  });

  it("legend に未定義のタイル種別があると検証エラー", () => {
    const yaml = validYaml.replace('"#": wall', '"#": trap');
    expect(() => parseStage(yaml)).toThrow(StageValidationError);
  });

  it("スタート地点が 0 個だと検証エラー", () => {
    const yaml = validYaml.replace("#@#", "#.#");
    expect(() => parseStage(yaml)).toThrow(/ちょうど 1 つ/);
  });

  it("スタート地点が 2 個だと検証エラー", () => {
    const yaml = validYaml.replace("#G#", "#@#");
    expect(() => parseStage(yaml)).toThrow(/現在 2 個/);
  });

  it("map に legend 未定義の文字があると検証エラー", () => {
    const yaml = validYaml.replace("#G#", "#X#");
    expect(() => parseStage(yaml)).toThrow(/未定義の文字/);
  });

  it("ゴールが無いと検証エラー", () => {
    const yaml = validYaml.replace("#G#", "#.#");
    expect(() => parseStage(yaml)).toThrow(/ゴール/);
  });

  it("legend のキーが複数文字だと検証エラー", () => {
    const yaml = validYaml.replace('"#": wall', '"##": wall');
    expect(() => parseStage(yaml)).toThrow(StageValidationError);
  });

  it("不正な YAML 文字列は検証エラー", () => {
    // map(文字列期待)に数値を与える
    const yaml = validYaml.replace(/map: \|[\s\S]*$/, "map: 42\n");
    expect(() => parseStage(yaml)).toThrow(StageValidationError);
  });
});

describe("loadStageFile", () => {
  it("stages/tutorial.yaml が検証を通る", () => {
    const path = fileURLToPath(new URL("../stages/tutorial.yaml", import.meta.url));
    const stage = loadStageFile(path);
    expect(stage.name).toBe("はじまりの部屋");
    expect(stage.legend["G"]).toBe("goal");
  });
});
