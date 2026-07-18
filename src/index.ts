// エントリポイント。ステージ読み込み → 描画 → キー操作のループを回す。
// ゲームロジックは game.ts（純粋・テスト済み）に置き、ここは I/O だけを担う。
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { loadStageFile } from "./loader.js";
import { renderGame } from "./render.js";
import { createGame, move, type Direction, type GameState } from "./game.js";
import type { Stage } from "./types.js";

export function banner(): string {
  return "yaml-crawl — YAML でダンジョンを潜れ";
}

// 矢印キー名 → 移動方向。readline の keypress が key.name を "up" 等で渡す。
const KEY_TO_DIR: Record<string, Direction> = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
};

/** 画面を再描画する（副作用）。 */
function draw(state: GameState): void {
  console.clear();
  console.log(banner());
  console.log(`\n【${state.stage.name}】  矢印キーで移動 / q で終了\n`);
  console.log(renderGame(state));
  if (state.won) {
    console.log("\n🎉 ゴール到達！クリアなのだ（q で終了）");
  }
}

/**
 * キー入力ループを起動する（実行専用・副作用あり）。
 * readline.emitKeypressEvents + raw mode で、Enter を待たず 1 キーずつ拾う。
 */
export function play(stage: Stage): void {
  let state = createGame(stage);
  draw(state);

  readline.emitKeypressEvents(process.stdin);
  // TTY のときだけ raw mode（テスト等のパイプ実行では setRawMode が無い）
  process.stdin.setRawMode?.(true);
  process.stdin.resume();

  process.stdin.on("keypress", (_str, key) => {
    if (!key) return;

    // q または Ctrl+C で終了
    if (key.name === "q" || (key.ctrl && key.name === "c")) {
      process.stdin.setRawMode?.(false);
      process.exit(0);
    }

    const dir = KEY_TO_DIR[key.name];
    if (!dir) return; // 移動キー以外は無視

    state = move(state, dir);
    draw(state);
  });
}

/** 既定ステージを読み込んで遊ぶ。将来は argv でステージ選択できるようにする。 */
export function main(): void {
  const stagePath = fileURLToPath(new URL("../stages/tutorial.yaml", import.meta.url));
  play(loadStageFile(stagePath));
}

// 直接実行されたときだけループを起動する（import 時は副作用なし）。
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
