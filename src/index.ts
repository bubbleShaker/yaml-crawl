// エントリポイント（M0 では動作確認用の最小実装）
// M1 以降でステージ読み込み → 描画 → 操作へ拡張する。
import { fileURLToPath } from "node:url";

export function banner(): string {
  return "yaml-crawl — YAML でダンジョンを潜れ";
}

// 直接実行されたときだけバナーを出す（import 時は副作用なし）。
// fileURLToPath で Windows/Unix 双方のパス表記差を吸収する。
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(banner());
}
