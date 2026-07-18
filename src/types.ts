// ステージのデータ型。YAML の legend/map はここに対応する。
export type TileKind = "wall" | "floor" | "start" | "goal";

export interface Stage {
  /** ステージ名（表示用） */
  name: string;
  /** map 中の 1 文字 → タイル種別 のマッピング */
  legend: Record<string, TileKind>;
  /** 複数行文字列で表したマップ */
  map: string;
}

// ゲーム進行のデータ型。描画(render)と進行(game)の双方が共有する内側の型として、
// ここ（最も内側のレイヤー）に置く。こうすると render は game に依存せず済む。
export interface Position {
  x: number;
  y: number;
}

export type Direction = "up" | "down" | "left" | "right";

/**
 * ゲームの状態。move は新しい GameState を返す（不変・純粋）。
 * 複数ステージを保持し、ゴールで次ステージへ進む。現在のステージは
 * `stages[index]`（描画・移動判定は grid.ts の currentStage を通す）。
 */
export interface GameState {
  /** 収録された全ステージ（YAML の --- で区切られた順） */
  stages: Stage[];
  /** 現在プレイ中のステージ番号（0 始まり） */
  index: number;
  player: Position;
  /** 最終ステージのゴールに到達＝全クリア */
  won: boolean;
}
