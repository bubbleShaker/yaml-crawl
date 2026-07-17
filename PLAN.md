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
- [ ] **M0** 環境セットアップ（package.json / tsconfig / vitest / tsx）
- [ ] **M1** YAML ローダ + スキーマ検証（TDD。1ステージ読んで検証）
- [ ] **M2** ターミナル描画（マップ表示）
- [ ] **M3** プレイヤー移動 + 壁判定 + ゴール判定（＝遊べる）
- [ ] **M4** 複数ステージ（`---`）+ 鍵・扉
- [ ] **M5** 敵（アンカーでテンプレ共通化）+ 接触判定

## 開発サイクル（CLAUDE.md 準拠）
Issue 起票 → 実装（Issue ブランチ）→ reviewer サブエージェントでレビュー → 🔴must 解消 → PR → マージ。
GitHub: https://github.com/bubbleShaker/yaml-crawl （public）

## 現在地
M0/M1 に着手予定。
