# ASRS 意思決定ログ

設計・実装上の判断を1件ずつ追記する。形式: 日付 / 決定内容 / 理由（あれば）。

## 2026-07-04 初期決定（設計フェーズ）

- プロジェクト名は ASRS（AIDA Simple RPG Studio）。HTML5ベースのシンプルRPG制作ツール。
- 技術スタック: Vite + React + TypeScript（strict）+ Zustand。保存は JSON + localStorage。外部APIなし。
- 描画方式: マップはCanvas、UIはReact/DOM のハイブリッド。理由: タイル一括描画はCanvasが素直で、パネル類はReactが効率的。
- タイルサイズ: 32px。マップは16×12マス固定（Phase 1）。描画領域は512×384px。
- 移動方式: Phase 1は即時グリッド移動。補間アニメは後回し。
- 座標系: 左上原点 (0,0)。
- マップ構造: 地形レイヤー＋配置物（イベント含む）レイヤーの2層。後で増やせる形にする。
- JSONルートに `formatVersion` を必ず含める。初期値 1。
- ID規約: 人間可読なslug文字列（例: `npc-village-elder`）。理由: AIが読み書きしやすく、部分マージが安全。
- 参照はすべてID文字列で持つ。オブジェクト埋め込みにしない。
- 定義データ（Database）と実行時状態（PlaySession / BattleState）を型レベルで分離する。
- イベントコマンドは `type` フィールドで判別する判別可能ユニオン。
- undo/redo: Phase 1では実装しない。ただしstate設計はコマンドパターンを意識しておく。
- UI言語: 当面日本語のみ。文字列は定数ファイルに分離しておく。
- 戦闘はフロントビュー・コマンド式のターン制。サイドビューは採用しない。
- ダメージ計算は固定式＋パラメータ。自由数式のパースはPhase 5以降に検討。
- AI連携はPhase 5まで手動（JSONコピペ）。AI出力は validate → 差分プレビュー → 承認 のフローで取り込む。
- 公開向け文書では特定の既存ゲーム名・ツール名を前面に出さない（`originality-policy.md`）。
- アーキテクチャ: `src/core/`（React非依存の純TS）/ `src/editor/` / `src/player/` を分離。

## 2026-07-04 Phase 1 実装時の決定

- `GameDatabase` はPhase 1のプロジェクトJSONに含めない（Phase 2/3で追加時、必要なら formatVersion を上げて移行する）。
- validate は `errors`（読み込みを中止する）と `warnings`（読み込むが注意表示する）を分ける。「スタート地点が通行不可タイル上」「配置物の重なり」は警告扱い。理由: 編集途中の正当な状態を読み込み拒否すると保存データが開けなくなるため。
- 描画ヘルパは `src/render/drawMap.ts` に置き、editor / player の両方から使う（core はDOM描画を持たない、editor と player は互いに import しない）。
- エディタのクリック挙動: 配置物のあるマスをクリックすると常に選択（ツールに関わらず）。ドラッグはタイル塗りのみ。配置物・スタート地点はクリック配置のみ。
- 配置物のID: `chest-1` `npc-2` のような「種別-連番」slug。名前の初期値は「たからばこ1」のようにラベル+番号。
- 起動時に localStorage から自動読み込みする（保存は手動ボタン）。localStorage不可・データ破損時は新規プロジェクトで開始。
- タイル色: ゆか#b9a97e / かべ#4b4b57 / くさ#5f9350 / みず#3c6fa8。記号は # " ~ のASCII。プレイヤーは白い矩形+@（ジャンル一般の表現）。
- テスト環境は Vitest（node環境、core のみ対象）。UIの自動テストはPhase 1では書かない。

## 2026-07-04 Phase 1.2: Larger Map Support

- 新規マップの初期サイズを 16×12 → **32×24** に拡張（`DEFAULT_MAP_WIDTH` / `DEFAULT_MAP_HEIGHT` 定数）。タイルは32pxのまま。
- サイズの正は常に `GameMap.width` / `height`。validate・通行判定・描画は元からこの2フィールド基準だったため、コア側の変更は初期値定数のみ。既存の16×12プロジェクトJSONはそのまま読み込める（互換テスト追加）。
- マップCanvasエリアはスクロール表示に変更（`overflow: auto` + `margin: auto` で、小さいマップは中央寄せ・大きいマップはスクロール）。エディタ/テストプレイ共通。
- プレイヤー追従カメラ・ミニマップ・ズーム・範囲塗りは実装しない（48×36以上に拡張する時の課題として先送り）。

## 2026-07-04 Phase 1.1: Single HTML Export

- `npm run build:single` で、JS/CSSをすべてインライン化した単一HTML（`dist-single/index.html`）を出力できるようにした。`vite-plugin-singlefile` + 専用設定 `vite.single.config.ts` を追加。アプリ本体（src/）は無変更。
- `dist-single/` はgit管理に含めない（.gitignore）。配布したくなったらその都度ビルドする。GitHub Releasesでの配布は将来検討。
- 注意: `file://` で開いた単一HTML版のlocalStorageは `http://localhost:5173` とは別領域。開発中のプロジェクトを単一HTML版に持ち込むには「JSON書き出し→JSON読み込み」を使う。
- 出力ファイル名を `dist-single/index.html` → **`dist-single/asrs.html`** に変更。通常ビルドの `dist/index.html`（外部ファイル参照ありのため file:// では白画面になる）との取り違えを防ぐため。単一HTML自体は Chrome/Edge の file:// でアプリが正常にマウントされることをヘッドレスブラウザで確認済み。
- ユーザーが `index.html` のダブルクリックで起動しやすいよう、単一HTMLの出力名を **`dist-single/index.html`** に戻した。ルート `index.html` はVite用のまま維持し、`file://` で開いた時だけ `dist-single/index.html` へ移動する。
- リダイレクトの判定を「パス名が `/dist-single/index.html` で終わるか」から「`src` 付きモジュールscriptの有無」に変更。理由: パス判定だと単一HTMLを別フォルダへコピー（＝配布）した時に存在しない先へリダイレクトして壊れる。単一版はJSインライン化で `src` を持たないため、中身での判定ならどこへコピーしても動く（file://の4シナリオをヘッドレスブラウザで検証済み）。

## 2026-07-04 将来構想メモ（未実装）

- 「シード生成RPGワールド（自動生成ワールドモード）」を将来候補として検討する。当初は16×12マップ案だったが、Phase 1.2で新規マップ初期サイズを32×24にしたため、以後のSeed World Mode案も32×24を基準にする。生成後は通常のASRSマップとして編集・JSON保存できる。**Phase 1では実装しない。**

## 2026-07-04 Phase 1.5: Seed World Mode 設計追記

- `roadmap.md` に **Phase 1.5: Seed World Mode（シード生成ワールド）** を追加する。Phase 2のイベント実行へ進む前の制作補助として、seed文字列から32×24の2DタイルRPGマップを生成する位置づけ。
- 生成対象はASRSの既存タイル `floor` / `wall` / `grass` / `water` と、スタート地点・宝箱・NPC候補・イベント玉候補に限定する。無限ワールド、3D、ボクセル表現、大規模生成は対象外。
- 同じseedなら同じ生成結果になる決定的生成を目指す。ただし生成後に保存される正は通常の `GameMap` データであり、ユーザーが編集した結果を優先する。
- Seed World Modeは制作補助であり、全自動ゲーム生成ではない。生成結果は必ず人間が編集でき、Phase 2以降のイベントシステムとはイベント玉候補を通じて接続できるようにする。
- `data-schema.md` には将来案として `GameMap.generation`（`mode`, `seed`, `generatorVersion`, `generatedAt`）を追記する。現時点では未実装で、`src/core/types/` は変更しない。
- 公開向け表現は「Seed World Mode」「シード生成ワールド」「自動生成RPGマップ」「生成後に編集できるRPGマップ」とし、既存作品の名称・見た目・固有要素を使わない。

## 2026-07-04 Phase 2A: メッセージイベント

- Phase 2Aでは `EventCommand` を `showMessage` のみに限定し、`giveItem` / `setSwitch` / `transferPlayer` / `startBattle` は未実装のままvalidateでも拒否する。理由: Phase 2全体を先取りせず、メッセージ表示の縦切りだけを安全に確認するため。
- 旧Phase 1データ互換のため、読み込み時に `MapEvent.commands` が無い場合は `[]` を補う。新規配置物は空文字の `showMessage` を1件持ち、右パネルで編集すると保存JSONに反映する。
- テストプレイ中は、プレイヤーに隣接する配置物の最初の `showMessage` を Enter / Space / Z で開き、表示中は移動を止める。もう一度決定キーで閉じる。

## 2026-07-04 Phase 2B: メッセージイベントの磨き込み

- 隣接イベントの検出優先順は **上 → 右 → 下 → 左** とする。斜めは対象外。理由: 方向キーの視認順に近く、同じ状況で常に同じ対象を選べるため。
- テストプレイ中、隣接イベントがある時だけ「Enter / Space / Zで調べる」ヒントを表示し、メッセージ表示中は隠す。
- 新規配置物の初期 `showMessage` は、NPC「……。」、宝箱「古い箱がある。」、イベント玉「小さな気配がある。」とする。既存作品の固有表現は使わず、後でユーザーが編集する前提の短い仮文に留める。

## 未決事項

- 世界観・命名トーン（王道ファンタジー変形 / 和風 / SF混合など）— Phase 3までに決める
- 配色テーマ、タイル・配置物の具体的な色と記号の割り当て
- 戦闘敗北時の扱い、敵AIの行動パターン記述形式
