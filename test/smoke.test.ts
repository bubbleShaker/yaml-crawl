import { describe, it, expect } from "vitest";
import { banner } from "../src/index.js";

// M0: ビルド/テスト/ESM import(.js 拡張子) が通ることの確認
describe("smoke", () => {
  it("banner を返す", () => {
    expect(banner()).toContain("yaml-crawl");
  });
});
