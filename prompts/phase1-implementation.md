# Phase 1 実装プロンプト

次回のClaude Codeセッションで、以下をそのまま貼って使う。
（このファイルの保存時点では、まだ実装は行っていない。）

---

ASRSプロジェクトのPhase 1を実装してください。
作業ディレクトリ: C:\Users\hp\Desktop\asrs

## 前提

まず CLAUDE.md と docs/ 配下の設計書（特に concept.md / roadmap.md / data-schema.md / ui-layout.md）を読み、それに従ってください。設計書と矛盾する判断が必要になったら、実装前に指摘してください。

## 技術スタック

- Vite + React + TypeScript（strict mode）
- 状態管理: Zustand
- マップ描画: Canvas（タイル32px）、UI: React/DOM
- 保存: JSON + localStorage
- 外部API・画像素材なし。タイルは色付き矩形＋記号で表現

## Phase 1で実装する機能

1. マップエディタ
   - 16×12マスのグリッド。タイル: 床・壁・草・水（各タイルは色で区別）
   - 配置物: 宝箱・NPC・イベント玉・主人公スタート地点
   - 左: パレット / 中央: マップCanvas / 右: 設定パネル の3ペインUI
   - クリックまたはドラッグで塗る。パレットで選択中のものを配置
   - 配置物をクリックすると右パネルに情報（名前・座標）を表示・編集できる
2. テストプレイモード
   - ボタン1つでエディタ⇔テストプレイを切替
   - 矢印キーとWASDで主人公（色付き矩形）をグリッド移動
   - 壁と水は通行不可。配置物のマスも通行不可
   - テストプレイ終了でエディタの状態に戻る
3. 保存・読み込み
   - プロジェクト全体を1つのJSONに（formatVersion: 1 を必ず含める）
   - localStorageへの保存/読み込み、JSONファイルのエクスポート/インポート
   - 読み込み時にvalidate（不正JSONはエラーメッセージ表示、クラッシュしない）

## アーキテクチャ要件

- src/core/ はReact非依存の純TSロジック（型定義・通行判定・シリアライズ・validate）
- src/editor/ がエディタUI、src/player/ がテストプレイUI
- 全データ型は src/core/types/ に集約し、docs/data-schema.md と一致させる
- 「マップ定義データ」と「テストプレイ中の実行時状態」を型で分離する
- IDは人間可読なslug文字列
- core/ の通行判定とvalidateにはユニットテスト（Vitest）を書く

## オリジナリティ制約

- docs/originality-policy.md に従う
- 既存RPG作品・既存ツールの名称・UI・素材・固有用語を使わない
- 見た目はASRS独自（色タイル＋記号ベースでよい）

## スコープ制限

- Phase 2以降の機能（イベントコマンド実行・戦闘・複数マップ）は実装しない
- undo/redo は実装しない

## 完了条件

「マップを作る → localStorageに保存 → リロードして復元 → テストプレイで壁を避けて歩ける」が通しで動作し、npm run dev で起動確認できること。
最後に docs/decisions.md に主要な実装判断を追記してください。
