# tsx とは（TypeScript をビルド無しで実行するツール）

## 疑問
`package.json` の `"dev": "tsx src/index.ts"` に出てくる `tsx` って何？

## 解説
`tsx` = **TypeScript Execute**。TypeScript を「ビルド無しでそのまま実行する」CLI ツール。
npm パッケージで、内部は esbuild ベースの高速トランスパイラ。

普通の TypeScript は 2 段階が必要：

```
tsc && node dist/index.js   # ① .ts → .js にコンパイル → ② node で実行
```

`tsx` はこれを 1 コマンドにまとめる：

```
npx tsx src/index.ts        # .ts を直接そのまま実行
```

## このプロジェクトでの立ち位置
- **開発時の実行専用**（`npm run dev` → `tsx src/index.ts`）。手早く動かして即フィードバック。
- 型チェックは `tsc --noEmit`、テストは `vitest` が担当。`tsx` は「今すぐ動かす」係。

## 似たツールとの違い
| ツール | 役割 |
|---|---|
| `tsc` | 型チェック＆コンパイル（型エラーを見る／本番ビルド用） |
| `tsx` | 型チェックは**しない**で高速実行（開発の試し打ち用） |
| `ts-node` | tsx の先輩。tsx の方が速く ESM 相性も良い |

## 注意点
`tsx` は **型エラーを無視して実行する**。型の正しさは別途 `npx tsc --noEmit` で確認すること。
つまり「動かす（tsx）」と「型を保証する（tsc）」は別担当。

## 関連
WSL では node_modules が Windows インストールだと native バイナリ不足で `tsx`/`vitest` が落ちることがある → `npm ci` で修復（PLAN.md「WSL 注意」参照）。
