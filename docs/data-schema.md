# ASRS データスキーマ設計

このドキュメントがJSONスキーマの正であり、実装時の `src/core/types/` と常に一致させる。
スキーマ変更時は必ず両方を更新し、`decisions.md` に記録する。

## 基本方針

1. **formatVersion を必ず含める。** プロジェクトJSONのルートに `formatVersion: number` を置く。スキーマの後方互換を壊す変更をしたらインクリメントし、読み込み時にマイグレーション or 明示的なエラーを出す。
2. **定義データと実行時状態を分ける。** プロジェクトJSONに保存されるのは「定義データ」のみ。テストプレイ中の状態（現在HP・スイッチ状態・位置・所持品）は `PlaySession` / `BattleState` という別の型で持ち、絶対に混ぜない。
3. **IDは人間可読なslug。** 例: `npc-village-elder`, `skill-flame-arrow`, `map-start-village`。連番ではなく意味のある文字列にする。AIが読み書きしやすく、部分マージが安全になる。
4. **参照はすべてID文字列。** オブジェクトの埋め込み参照はしない。`enemyIds: ["enemy-cave-bat"]` のように持つ。JSON化・validate・AI編集が容易になる。
5. **すべての外部入力は同じvalidateを通す。** 手入力・ファイル読み込み・localStorage・AI出力の区別なく、単一のvalidate関数（純関数）で検査する。

## 型の全体構造（設計案）

### プロジェクトルート

- `AsrsProject`
  - `formatVersion: number` — スキーマバージョン（初期値 1）
  - `meta` — `title`, `author`, `createdAt`, `updatedAt`
  - `maps: GameMap[]`
  - `database: GameDatabase`
  - `startPoint: StartPoint` — `mapId`, `x`, `y`

### マップ関連

- `TileType` — `"floor" | "wall" | "grass" | "water"`（Phase 1）。通行可否はタイル定義側に `walkable: boolean` で持たせる。
- `GameMap`
  - `id`, `name`
  - `width`, `height`（Phase 1では 16×12 固定）
  - `tiles` — 1次元配列（`width` と併用してindex計算）
  - `events: MapEvent[]`
- `MapEvent`
  - `id`, `name`
  - `x`, `y`
  - `appearance` — 見た目種別（`"npc" | "chest" | "orb"` など）
  - `trigger` — `"talk"`（調べる） | `"touch"`（接触） | `"auto"`（自動）
  - `conditions` — 出現条件（スイッチ条件など、Phase 2）
  - `commands: EventCommand[]`（Phase 2）

### イベントコマンド（Phase 2）

`type` フィールドで判別する判別可能ユニオン（discriminated union）にする。
この形式はAIに生成させる際にも最も安全。詳細は `event-commands.md`。

- `EventCommand = ShowMessage | GiveItem | SetSwitch | TransferPlayer | StartBattle`
- 例: `{ "type": "showMessage", "text": "ようこそ！" }`

### データベース（Phase 3中心）

- `GameDatabase`
  - `enemies: Enemy[]`
  - `skills: Skill[]`
  - `items: Item[]`
  - `classes: ActorClass[]`
  - `troops: Troop[]` — 敵グループ（1〜3体の組み合わせと配置）
  - `switches: SwitchDef[]` — 名前付きスイッチ定義
- `Actor` — 味方。`id`, `name`, `classId`, `level`, `stats`, `skillIds`
- `Stats` — `maxHp`, `maxMp`, `attack`, `defense`, `speed`
- `Enemy` — `id`, `name`, `stats`, `actions`（行動パターン）, `rewards`（`exp`, `gold`, `dropItemIds`）
- `Skill` — `id`, `name`, `cost`, `target`（`"one-enemy" | "all-enemies" | "one-ally"` など）, `effect`
- `Item` — `id`, `name`, `category`, `effect`, `price`
- ダメージ計算は当面「固定の式＋パラメータ」。自由数式のパースはPhase 5以降に検討。

### 実行時状態（保存データとは別物）

- `PlaySession` — テストプレイ中の状態。`playerPos`, `switchStates`, `inventory`, `party`
- `BattleState` — 戦闘中のみ存在。ターン数、各ユニットの現在HP/MP、行動キュー

## validate の観点（段階的に強化）

- Phase 1: JSON構造がスキーマに一致するか。タイル配列の長さが width×height と一致するか。スタート地点が通行可能マスか。
- Phase 2以降: ID参照がすべて解決するか（存在しない `itemId` 等がないか）。場所移動先のマップ・座標が有効か。
- Phase 5: 到達不能マップ、未使用スイッチ、ゲーム進行の破綻チェックなど。
