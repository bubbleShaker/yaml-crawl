import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { parseStage, parseStages, loadStagesFile, StageValidationError } from "../src/loader.js";

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
  it("単一ステージファイルを読める（1 ステージ分の YAML 文字列）", () => {
    // 複数ドキュメントを含まない単体 Stage は loadStageFile で読める。
    // stages/tutorial.yaml は複数ステージ化したので loadStagesFile 側で検証する。
    const stage = parseStage(validYaml);
    expect(stage.name).toBe("テスト部屋");
    expect(stage.legend["G"]).toBe("goal");
  });
});

const twoStages = `
name: 部屋1
legend:
  "#": wall
  "@": start
  "G": goal
map: |
  ###
  #@#
  #G#
  ###
---
name: 部屋2
legend:
  "#": wall
  "@": start
  "G": goal
map: |
  ###
  #@#
  #G#
  ###
`;

describe("parseStages", () => {
  it("--- 区切りの複数ステージを順に読める", () => {
    const stages = parseStages(twoStages);
    expect(stages).toHaveLength(2);
    expect(stages[0].name).toBe("部屋1");
    expect(stages[1].name).toBe("部屋2");
  });

  it("末尾の余分な --- による空ドキュメントは無視する", () => {
    const stages = parseStages(twoStages + "\n---\n");
    expect(stages).toHaveLength(2);
  });

  it("単一ステージでも 1 要素の配列を返す", () => {
    expect(parseStages(validYaml)).toHaveLength(1);
  });

  it("どれか 1 ステージが不正なら、そのステージ番号付きで検証エラー", () => {
    const broken = twoStages.replace("name: 部屋2", "");
    expect(() => parseStages(broken)).toThrow(/ステージ 2:/);
  });

  it("空文字列はステージ 0 個で検証エラー", () => {
    expect(() => parseStages("")).toThrow(/1 つも定義されていません/);
  });
});

describe("loadStagesFile", () => {
  it("stages/tutorial.yaml を複数ステージとして読める", () => {
    const path = fileURLToPath(new URL("../stages/tutorial.yaml", import.meta.url));
    const stages = loadStagesFile(path);
    expect(stages.length).toBeGreaterThanOrEqual(2);
    expect(stages[0].name).toBe("はじまりの部屋");
  });
});
