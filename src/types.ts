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

/** ゲームの状態。move は新しい GameState を返す（不変・純粋）。 */
export interface GameState {
  stage: Stage;
  player: Position;
  won: boolean;
}
