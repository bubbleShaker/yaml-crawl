# yaml-crawl 開発計画

## 目的
YAML を抵抗なく触れるようにする。手段として「YAML でステージを定義するターミナルのグリッド探索ゲーム（ローグライク風）」を TypeScript / Node で個人開発する。
自分の書いた YAML が即座に画面へ反映されるフィードバックループで、YAML の高度機能（アンカー `&` / エイリアス `*` / マージキー `<<` / 複数ドキュメント `---` / JSON Schema 検証）に自然に触れる。

## 決定事項
- 方向性: データ駆動アプリ（YAML にデータを書き、アプリが読んで動く）
- 環境: TypeScript / Node
- 題材: YAML ステージ定義のミニゲーム
- 型: グリッド探索（ローグライク風・ターミナル描画）

## 技術選定
| 用途 | 採用 | 理由 |
|---|---|---|
| YAML パース | `yaml` | アンカー/エイリアス/マージキーを正しく扱える。学習題材の核 |
| スキーマ検証 | `ajv` + `ajv-formats` | JSON Schema でステージを起動時に検証。壊れた YAML を弾く |
| キー入力 | Node 標準 `readline`（raw mode） | 依存を増やさず矢印キー移動 |
| 色付け | `chalk`（後回し可） | 壁/敵/ゴールの色分け |
| テスト | `vitest` | TDD。ローダ/判定ロジックを先にテスト |
| 実行 | `tsx`（開発時） | ビルド無しで TS を直接実行 |

## ディレクトリ構成
```
yaml-crawl/
  PLAN.md
  schema/stage.schema.json    # ステージの JSON Schema
  stages/tutorial.yaml        # YAML ステージ集（--- で複数収録）
  src/
    types.ts  loader.ts  game.ts  render.ts  index.ts
  test/
  research/ summary/ knowledge/
```

## YAML ステージの形（初期）
```yaml
name: はじまりの部屋
legend:
  "#": wall
  ".": floor
  "@": start
  "G": goal
map: |
  #######
  #@....#
  #.###.#
  #....G#
  #######
```
将来（敵テンプレをアンカー/マージで共通化）:
```yaml
templates:
  base: &base { hp: 3, symbol: e }
goblin: { <<: *base, name: goblin }
```

## マイルストーン（小さく刻む = 各 Issue）
- [x] **M0** 環境セットアップ（package.json / tsconfig / vitest / tsx）— #1 / PR #7
- [x] **M1** YAML ローダ + スキーマ検証（TDD。1ステージ読んで検証）— #2
- [x] **M2** ターミナル描画（マップ表示）— #10 / PR #11
- [x] **M3** プレイヤー移動 + 壁判定 + ゴール判定（＝遊べる）— #12 / PR #13
- [x] **M4a** 複数ステージ（`---` マルチドキュメント）— #14 / PR #17
- [ ] **M4b** 鍵・扉（`TileKind` に key/door、所持数、扉は鍵消費で通過）— #14
- [ ] **M5** 敵（アンカーでテンプレ共通化）+ 接触判定

補足: chore として `.gitattributes` で改行を LF 正規化済み（#8 / PR #9）。

## 開発サイクル（CLAUDE.md 準拠）
Issue 起票 → 実装（Issue ブランチ）→ reviewer サブエージェントでレビュー → 🔴must 解消 → PR → マージ。
GitHub: https://github.com/bubbleShaker/yaml-crawl （public）

## 現在地
**M0〜M4a 完了（＝矢印キーで遊べ、`---` で複数ステージを連続クリアできる）。次は M4b（鍵・扉、#14）着手前。**
実装概要と再開手順は `summary/m0-m3-overview.md` に集約（コールドスタート時はまずそれを読む）。

- 依存方向（内向き）: `index.ts`(I/O) → `game.ts`/`render.ts`/`loader.ts` → `grid.ts` → `types.ts`。render は game に依存しない。
- `GameState = { stages: Stage[]; index; player; won }`。現在ステージは `grid.ts:currentStage(state)` で取得（game/render で共有）。
- loader: `parseStage`(単一) / `parseStages`(複数, `parseAllDocuments`) / `loadStagesFile`。検証本体は `validateStage(data, label)` に集約。
- 実行 `npx tsx src/index.ts` / テスト `npx vitest run`（35 tests）/ 型 `npx tsc --noEmit`。
- WSL 注意: node_modules が Windows インストールだと native 不足で落ちる → `npm ci` で修復。
- **M4b の着手ポイント**: `TileKind` に `key`/`door` 追加 → schema/GLYPH 対応 → `GameState` に `keys:number` → `move` で鍵取得（床化）・扉は鍵所持時のみ通過し消費。TDD で game.ts から。YAML アンカーは M5（敵テンプレ）で本格活用（`---` は跨げない点に注意）。
