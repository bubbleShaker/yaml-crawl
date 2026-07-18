// エントリポイント。ステージ読み込み → 描画 → 画面出力を行う。
// 操作（プレイヤー移動）は M3 で追加する。
import { fileURLToPath } from "node:url";
import { loadStageFile } from "./loader.js";
import { renderStage } from "./render.js";

export function banner(): string {
  return "yaml-crawl — YAML でダンジョンを潜れ";
}

/** ステージを読み込んで画面に描画する（副作用あり。実行専用）。 */
export function main(): void {
  // 既定ステージ。将来は argv でステージ選択できるようにする。
  const stagePath = fileURLToPath(new URL("../stages/tutorial.yaml", import.meta.url));
  const stage = loadStageFile(stagePath);

  console.log(banner());
  console.log(`\n【${stage.name}】\n`);
  console.log(renderStage(stage));
}

// 直接実行されたときだけ描画する（import 時は副作用なし）。
// fileURLToPath で Windows/Unix 双方のパス表記差を吸収する。
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
