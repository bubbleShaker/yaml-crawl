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
