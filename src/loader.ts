import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, parseAllDocuments } from "yaml";
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

/**
 * パース済みデータ（1 ドキュメント分）を検証して Stage 化する。
 * parseStage（単体）と parseStages（複数）の両方が共有する検証本体。
 * label は複数ステージ時にどのステージのエラーかを示す接頭辞（例: "ステージ 2: "）。
 */
function validateStage(data: unknown, label = ""): Stage {
  // 1. 構造検証（JSON Schema）
  if (!validateSchema(data)) {
    const detail = (validateSchema.errors ?? [])
      .map((e) => `  ${e.instancePath || "(root)"} ${e.message ?? ""}`)
      .join("\n");
    throw new StageValidationError(`${label}ステージ定義が不正です:\n${detail}`);
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
    throw new StageValidationError(`${label}map に legend で未定義の文字があります: ${list}`);
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
      `${label}スタート地点(start)はちょうど 1 つ必要です（現在 ${startCount} 個）`,
    );
  }
  const goalCount = countKind("goal");
  if (goalCount < 1) {
    throw new StageValidationError(`${label}ゴール(goal)は最低 1 つ必要です（現在 ${goalCount} 個）`);
  }

  return stage;
}

/** YAML テキスト（1 ステージ）を検証済み Stage に変換する。 */
export function parseStage(text: string): Stage {
  return validateStage(parseYaml(text));
}

/**
 * YAML マルチドキュメント（--- 区切り）を検証済み Stage[] に変換する。
 * `parseAllDocuments` は各 --- を別ドキュメントとして返す。
 * 注意: YAML のアンカー(&)/エイリアス(*) は 1 ドキュメント内でのみ有効で、
 * --- をまたいでは共有できない（アンカーはドキュメントごとにリセットされる）。
 */
export function parseStages(text: string): Stage[] {
  const docs = parseAllDocuments(text);
  const stages: Stage[] = [];

  for (const doc of docs) {
    // 空ドキュメント（末尾/途中の余分な ---）は数えずにスキップ。
    // ラベル番号は「実際にプレイする順（= 収録済み数 + 1）」で振り、
    // 空ドキュメントがあってもユーザーに見えるステージ番号とズレないようにする。
    const label = `ステージ ${stages.length + 1}: `;
    // YAML 構文レベルのエラー（インデント崩れ等）はここで拾う
    if (doc.errors.length > 0) {
      throw new StageValidationError(`${label}YAML 構文が不正です: ${doc.errors[0].message}`);
    }
    const data: unknown = doc.toJS();
    if (data == null) continue;
    stages.push(validateStage(data, label));
  }

  if (stages.length === 0) {
    throw new StageValidationError("ステージが 1 つも定義されていません");
  }
  return stages;
}

/** ファイルパスから 1 ステージを読み込む */
export function loadStageFile(path: string): Stage {
  return parseStage(readFileSync(path, "utf8"));
}

/** ファイルパスから複数ステージ（--- 区切り）を読み込む */
export function loadStagesFile(path: string): Stage[] {
  return parseStages(readFileSync(path, "utf8"));
}
