import { describe, it, expect } from "vitest";
import { parseStage } from "../src/loader.js";
import { createGame, move } from "../src/game.js";

// 横一列: 壁 スタート 床 ゴール 壁
const yaml = `
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

describe("createGame", () => {
  it("map から start 位置を見つけて初期状態を作る", () => {
    const state = createGame(parseStage(yaml));
    expect(state.player).toEqual({ x: 1, y: 1 });
    expect(state.won).toBe(false);
  });
});

describe("move", () => {
  it("床へは進める", () => {
    const state = move(createGame(parseStage(yaml)), "right");
    expect(state.player).toEqual({ x: 2, y: 1 });
    expect(state.won).toBe(false);
  });

  it("壁へは進めず留まる", () => {
    const start = createGame(parseStage(yaml));
    const up = move(start, "up"); // 上は壁
    const left = move(start, "left"); // 左は壁
    expect(up.player).toEqual({ x: 1, y: 1 });
    expect(left.player).toEqual({ x: 1, y: 1 });
  });

  it("ゴールに乗ると won になる", () => {
    let state = createGame(parseStage(yaml));
    state = move(state, "right"); // 床
    state = move(state, "right"); // ゴール
    expect(state.player).toEqual({ x: 3, y: 1 });
    expect(state.won).toBe(true);
  });

  it("クリア後は移動しない", () => {
    let state = createGame(parseStage(yaml));
    state = move(move(state, "right"), "right"); // ゴール到達 won
    const after = move(state, "left");
    expect(after).toBe(state); // 同一参照(no-op)
  });

  it("元の state を破壊しない（純粋関数）", () => {
    const start = createGame(parseStage(yaml));
    move(start, "right");
    expect(start.player).toEqual({ x: 1, y: 1 });
  });
});
