# yaml-crawl 実装概要（M0〜M3）

セッションを跨いで再開しやすくするための、現時点のスナップショット。
コールドスタートの新セッションは **まずこれと PLAN.md を読む** こと。

## 現状：矢印キーで遊べる最小ゲーム
YAML で定義したステージを読み込み、ターミナルに描画し、矢印キーで移動できる。
壁は通れず、ゴールに乗るとクリア表示。`q` / `Ctrl+C` で終了。

```
【はじまりの部屋】  矢印キーで移動 / q で終了

#######
#·····#
#·###·#
#····@#
#######

🎉 ゴール到達！クリアなのだ（q で終了）
```

## アーキテクチャ（依存方向は内向き）

```
index.ts (I/O・最外)
  ├─ loader.ts  … YAML→Stage（ajv 検証）
  ├─ game.ts    … createGame / move（純粋ロジック）
  └─ render.ts  … renderStage / renderGame / GLYPH（描画）
        ↓ 3者が共有
      grid.ts   … toRows / tileKindAt（座標系）
        ↓
      types.ts  … Stage / TileKind / Position / Direction / GameState（最内の型）
```

- **依存の向き**: `index → (game/render/loader) → grid → types`。
  型はすべて最内の `types.ts` に集約したので、**render は game に依存しない**。
- **純粋関数（game/render/grid/loader）と副作用（index）を分離**。テストは純粋側に集中。

### 各モジュールの責務
| ファイル | 責務 | 主な公開 |
|---|---|---|
| `src/types.ts` | 共有の型定義 | `Stage`, `TileKind`, `Position`, `Direction`, `GameState` |
| `src/grid.ts` | map 文字列の座標系 | `toRows(map)`, `tileKindAt(stage,x,y)` |
| `src/loader.ts` | YAML 読み込み + 検証 | `parseStage(text)`, `loadStageFile(path)`, `StageValidationError` |
| `src/game.ts` | ゲーム進行ロジック（純粋） | `createGame(stage)`, `move(state,dir)` |
| `src/render.ts` | 文字列描画（純粋） | `renderStage(stage)`, `renderGame(state)`, `GLYPH` |
| `src/index.ts` | 入力ループ・画面出力（I/O） | `banner()`, `play(stage)`, `main()` |

### 設計上の要点
- `move` は不変・純粋。壁/範囲外は同一 state を返し、ゴールで `won=true`、クリア後は no-op。
- 範囲外判定は `tileKindAt` の `undefined` に一元化（loader が全文字 legend 済みを保証するため）。
- 表示文字は `GLYPH`（`TileKind → 文字`）1 箇所に集約。将来の chalk 色付けもここだけ変えれば済む。
- 未検証 Stage を描画した際の未定義文字は可視マーカー `?` に寄せる（異常に気づけるように）。
- 入力は readline raw mode。`process.on("exit")` で raw mode を必ず復元。`play` は 1 プロセス 1 回起動前提。

## YAML ステージ形式
```yaml
name: はじまりの部屋
legend:            # map の 1 文字 → タイル種別
  "#": wall
  ".": floor
  "@": start
  "G": goal
map: |             # 複数行文字列のグリッド
  #######
  #@....#
  #.###.#
  #....G#
  #######
```
loader の検証: JSON Schema（構造）＋ セマンティック（map の全文字が legend 済み / start ちょうど 1 / goal 1 以上）。

## 実行・テスト
- 実行: `npx tsx src/index.ts`
- テスト: `npx vitest run`（現在 24 tests：loader 10 / render 7 / game 6 / smoke 1）
- 型チェック: `npx tsc --noEmit`
- **WSL 注意**: `node_modules` が Windows 側 `npm install` だと rollup/esbuild の native バイナリが無く vitest が落ちる。`rm -rf node_modules && npm ci` で現プラットフォーム用に再構築（package-lock はクロスプラットフォーム構成なので変更されない）。
- 改行は `.gitattributes`（`* text=auto eol=lf`）で LF 正規化済み。

## 次の一歩：M4（#14）複数ステージ + 鍵・扉
- **複数ステージ**: `yaml` の複数ドキュメント（`---`）を読む。loader に `parseStages(text): Stage[]` を追加想定。ゴールで次ステージへ、全クリア判定。
- **鍵・扉**: `TileKind` に `key` / `door` を追加。`GameState` に所持数を持たせ、扉は鍵所持時のみ通過（通ると消費）。schema / GLYPH / render も対応。
- YAML のアンカー `&` / エイリアス `*` / マージキー `<<` は M5（敵テンプレ共通化）で本格活用するが、M4 の legend 共通化などでも触れられる。

## Issue / PR 対応表
- M0 環境: #1 / PR #7
- M1 ローダ+検証: #2
- M2 描画: #10 / PR #11
- M3 移動+判定: #12 / PR #13
- chore LF 正規化: #8 / PR #9
- M4 複数ステージ+鍵扉: #14（未着手）
