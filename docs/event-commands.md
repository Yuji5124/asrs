# ASRS イベントコマンド仕様（Phase 2）

## 基本設計

- イベント玉・NPC・宝箱などの `MapEvent` は `commands: EventCommand[]` を持ち、トリガー時に上から順に実行する。
- `EventCommand` は `type` フィールドで判別する判別可能ユニオン。AIに生成させる際も最も安全な形式。
- コマンド実行中はプレイヤーの移動を止める。メッセージは決定キーで送る。

## Phase 2 で実装する5コマンド

Phase 2Aでは `showMessage` のみ実装する。`giveItem` / `setSwitch` / `transferPlayer` / `startBattle` は型・validate・UI・実行処理のいずれもまだ有効にしない。

### 1. メッセージ表示 — `showMessage`
```json
{ "type": "showMessage", "text": "ようこそ、旅の人。" }
```
- 下部メッセージウィンドウにテキスト表示。決定キーで閉じて次のコマンドへ。
- 長文の自動改行・ページ送りは最小限でよい。

### 2. アイテム入手 — `giveItem`
```json
{ "type": "giveItem", "itemId": "item-herb", "amount": 1 }
```
- `PlaySession.inventory` に追加。入手メッセージを自動表示するかは実装時に決める。
- `itemId` はデータベースに存在するIDであること（validate対象）。

### 3. スイッチON/OFF — `setSwitch`
```json
{ "type": "setSwitch", "switchId": "switch-chest-opened", "value": true }
```
- `PlaySession.switchStates` を更新。
- スイッチは `MapEvent.conditions` の出現条件として参照される（例: 開封済み宝箱を非表示にする）。

### 4. 場所移動 — `transferPlayer`
```json
{ "type": "transferPlayer", "mapId": "map-cave-1", "x": 3, "y": 5 }
```
- 指定マップの指定座標へ移動。移動先が存在し通行可能であること（validate対象）。

### 5. 戦闘開始 — `startBattle`
```json
{ "type": "startBattle", "troopId": "troop-cave-entrance" }
```
- 指定した敵グループとの戦闘へ遷移（戦闘仕様は `battle-spec.md`）。
- 勝敗の結果分岐（負けたらゲームオーバー等）の扱いはPhase 3で確定する。

## トリガー種別

- `talk` — プレイヤーが隣接して決定キーを押したとき（NPC・宝箱の基本）
- `touch` — プレイヤーが接触したとき（ワープ床・トラップ向け）
- `auto` — 条件を満たしたら自動実行（Phase 2では最小限、多用しない）

## 将来の拡張候補（Phase 2では実装しない）

- 条件分岐（if）、選択肢表示、変数（数値）、待機、効果音再生
- 拡張時も「typeで判別するフラットなコマンド列」という構造を維持する
