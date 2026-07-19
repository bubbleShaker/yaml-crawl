# yaml-crawl アーキテクチャ（UML スナップショット）

現時点の構成を UML 図でまとめたもの。コールドスタート時は PLAN.md /
`summary/m0-m3-overview.md` と合わせて読むと全体像が早い。

一言でいうと「YAML でダンジョンを書いて矢印キーで潜るミニゲーム」。
設計の肝は **内向き依存（クリーンアーキテクチャ的）** で、純粋関数（テスト可能）と
I/O（副作用）をきっちり分けている点。

## ① モジュール依存図（コンポーネント図）

依存はすべて内側（`types.ts`）へ向く。矢印は「〜に依存する」。

```mermaid
graph TD
    index["index.ts<br/>(I/O・キー入力ループ)"]
    loader["loader.ts<br/>(YAML読込+検証)"]
    game["game.ts<br/>(移動ロジック・純粋)"]
    render["render.ts<br/>(描画文字列生成・純粋)"]
    grid["grid.ts<br/>(座標系・現在ステージ)"]
    types["types.ts<br/>(データ型のみ)"]
    schema["schema/stage.schema.json"]
    yaml["stages/tutorial.yaml"]

    index --> loader
    index --> game
    index --> render
    index --> grid
    loader --> types
    loader -. 読込・検証 .-> schema
    game --> grid
    render --> grid
    grid --> types
    game --> types
    render --> types
    loader -. 読込 .-> yaml

    style types fill:#2d6,stroke:#161,color:#000
    style index fill:#f96,stroke:#a30,color:#000
```

ポイント:
- **`types.ts` が一番内側** — 何にも依存しない（`Stage` / `GameState` などデータ型だけ）。
- **`render` は `game` に依存しない** — 両方 `GameState` を受け取るだけで、描画とロジックが独立。
- **実行時のユーザー I/O（描画・入力）は `index.ts` だけ** — `console` / `readline` / `process` を触るのはここだけ。ロジックは全部純粋関数（`loader.ts` は起動時のファイル読込 I/O のみ）。

## ② データ型のクラス図

```mermaid
classDiagram
    class Stage {
        +string name
        +Record~string,TileKind~ legend
        +string map
    }
    class GameState {
        +Stage[] stages
        +number index
        +Position player
        +boolean won
    }
    class Position {
        +number x
        +number y
    }
    class TileKind {
        <<union type>>
        "wall" | "floor" | "start" | "goal"
    }
    class Direction {
        <<union type>>
        "up" | "down" | "left" | "right"
    }

    GameState "1" o-- "*" Stage : stages
    GameState "1" *-- "1" Position : player
    Stage ..> TileKind : legend の値
```

`GameState` が複数 `Stage` を持ち、`index` で「今どのステージか」を指す。
`map`（文字列）の 1 文字を `legend` で `TileKind` に変換する。

## ③ 起動〜移動の流れ（シーケンス図）

`index.ts` は `main()`（ステージ読込）と `play()`（状態生成・入力ループ・描画）に
責務が分かれている。描画は `play`/`draw` 内の副作用関数 `draw()` が `renderGame` を
包んで `console` へ出す。

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant M as index.main()
    participant P as index.play()
    participant D as index.draw()
    participant L as loader.ts
    participant G as game.ts
    participant R as render.ts

    M->>L: loadStagesFile(tutorial.yaml)
    Note over L: YAML パース → JSON Schema 検証<br/>→ legend/map 整合チェック
    L-->>M: Stage[]
    M->>P: play(stages)
    P->>G: createGame(stages)
    G-->>P: GameState (player=start)
    P->>D: draw(state)
    D->>R: renderGame(state)
    R-->>D: 画面文字列
    D->>U: console 出力

    loop 矢印キーごと
        U->>P: keypress(↑↓←→)
        P->>G: move(state, dir)
        Note over G: 壁/範囲外→留まる<br/>goal→次ステージ or won=true
        G-->>P: 新しい GameState（不変）
        P->>D: draw(state)
        D->>R: renderGame(state)
        R-->>D: 画面文字列
        D->>U: console 出力（再描画）
    end
```

## 設計上のポイント

| 仕組み | どこ | 狙い |
|---|---|---|
| **`move` は純粋関数** | `game.ts` | 新しい `GameState` を返す（不変）。`vitest` で状態遷移を直接テストできる |
| **座標系の集約** | `grid.ts:toRows` / `tileKindAt` | 描画と移動判定が同じ座標系を共有。ズレない |
| **表示文字の集約** | `render.ts:GLYPH` | 将来 `chalk` で色付けする時もここだけ直せばよい |
| **2 段階検証** | `loader.ts` | JSON Schema（構造）＋ セマンティック（start=1 個 等）で壊れた YAML を弾く |

## 現在地

PLAN.md 準拠で **M0〜M4a 完了**（矢印キーで遊べ、`---` で複数ステージを連続クリア可）。
次は M4b（鍵・扉、Issue #14）着手前。
