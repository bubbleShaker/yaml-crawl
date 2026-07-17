import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { Ajv, type ValidateFunction } from "ajv";
import type { Stage, TileKind } from "./types.js";

/** ステージ定義が不正なときに投げる例外 */
export class StageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StageValidationError";
  }
}

// スキーマは JSON ファイルとして読む（JSON import はランタイム差異が出やすいため
// readFileSync で確実に読む）。パスは自身の位置から解決する。
const schemaPath = fileURLToPath(new URL("../schema/stage.schema.json", import.meta.url));
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv({ allErrors: true });
const validateSchema: ValidateFunction<Stage> = ajv.compile<Stage>(schema);

/** YAML テキストを検証済み Stage に変換する（ファイル入出力なしでテストしやすい形） */
export function parseStage(text: string): Stage {
  const data: unknown = parseYaml(text);

  // 1. 構造検証（JSON Schema）
  if (!validateSchema(data)) {
    const detail = (validateSchema.errors ?? [])
      .map((e) => `  ${e.instancePath || "(root)"} ${e.message ?? ""}`)
      .join("\n");
    throw new StageValidationError(`ステージ定義が不正です:\n${detail}`);
  }
  const stage = data as Stage;

  // 2. セマンティック検証（JSON Schema では表せない、legend と map の整合）
  // 検証ルールが増えたら（矩形チェック等）ルール配列への切り出しを検討する。

  // 2-1. map の文字はすべて legend に定義済み（改行以外）
  const known = new Set(Object.keys(stage.legend));
  const unknown = [...new Set([...stage.map])].filter(
    (ch) => ch !== "\n" && ch !== "\r" && !known.has(ch),
  );
  if (unknown.length > 0) {
    const list = unknown.map((c) => JSON.stringify(c)).join(", ");
    throw new StageValidationError(`map に legend で未定義の文字があります: ${list}`);
  }

  // 2-2. start はちょうど 1 つ / goal は最低 1 つ
  const countKind = (target: TileKind): number => {
    const chars = Object.entries(stage.legend)
      .filter(([, kind]) => kind === target)
      .map(([ch]) => ch);
    return [...stage.map].filter((ch) => chars.includes(ch)).length;
  };
  const startCount = countKind("start");
  if (startCount !== 1) {
    throw new StageValidationError(
      `スタート地点(start)はちょうど 1 つ必要です（現在 ${startCount} 個）`,
    );
  }
  const goalCount = countKind("goal");
  if (goalCount < 1) {
    throw new StageValidationError(`ゴール(goal)は最低 1 つ必要です（現在 ${goalCount} 個）`);
  }

  return stage;
}

/** ファイルパスからステージを読み込む */
export function loadStageFile(path: string): Stage {
  return parseStage(readFileSync(path, "utf8"));
}
