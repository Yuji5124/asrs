# AGENTS.md — ASRS リポジトリ作業ルール

ASRS（AIDA Simple RPG Studio）は、HTML5ベースのシンプルRPG制作ツールです。
このファイルは、Codex がこのリポジトリで作業するときのルールを定めます。

## 作業の基本ルール

1. **まず設計書を確認する。** 実装や変更の前に `docs/` 配下の設計書を読み、方針に従うこと。設計書と矛盾する実装をしない。矛盾に気づいたら実装より先に指摘する。
2. **勝手に実装を広げない。** 依頼されたPhase・機能の範囲だけを実装する。ロードマップ（`docs/roadmap.md`）の先のPhaseの機能を先取りしない。「ついでに」の機能追加をしない。
3. **意思決定を記録する。** 実装中に設計判断をしたら `docs/decisions.md` に1行追記する。
4. **破壊的操作は確認する。** git push、ファイル削除、スキーマの後方互換を壊す変更はユーザーに確認してから行う。

## オリジナリティ制約（必須）

- 既存のRPG作品・RPG制作ツールのキャラクター、モンスター、呪文名、技名、職業名、UIデザイン、素材、固有用語を使わない。
- README・コメント・UI文言など公開されうる文章では、特定の既存ゲーム名・既存ツール名を前面に出さない。「クラシックRPG風」「フロントビュー戦闘」「小さなRPG制作ツール」と表現する。
- 詳細は `docs/originality-policy.md` を参照。

## アーキテクチャ方針

- **core / editor / player を分離する。**
  - `src/core/` — React非依存の純TypeScriptロジック（型定義・通行判定・イベント解釈・戦闘計算・シリアライズ・validate）。ユニットテスト対象。
  - `src/editor/` — エディタUI（React）。
  - `src/player/` — テストプレイ・ゲーム実行UI（React + Canvas）。
- **定義データと実行時状態を型レベルで分ける。** プロジェクトJSONに保存されるのは定義データのみ。テストプレイ中の状態（現在HP、スイッチ状態、位置など）は別の型で持ち、混ぜない。
- **JSON first。** ゲームの全データは人間が読めるJSONで表現する。スキーマは `docs/data-schema.md` が正であり、`src/core/types/` と常に一致させる。
- **AI連携しやすいJSON設計を最優先する。**
  - ルートに `formatVersion` を必ず含める。
  - IDは人間可読なslug文字列（例: `npc-village-elder`）。
  - 参照はすべてID文字列で持つ（オブジェクト埋め込みにしない）。
  - 外部から来たJSON（手入力・ファイル・AI出力）はすべて同じvalidate関数を通す。

## 技術スタック（実装Phaseで使用）

- Vite + React + TypeScript（strict mode）+ Zustand
- マップ描画はCanvas（32pxタイル）、UIはReact/DOM
- 保存は JSON + localStorage。外部APIなし。画像素材なしでも動く（色タイル＋記号表現）。

## ドキュメント一覧

| ファイル | 内容 |
|---|---|
| `docs/concept.md` | コンセプト・設計原則・スコープ外 |
| `docs/roadmap.md` | Phase 1〜5 ロードマップと完了条件 |
| `docs/data-schema.md` | JSONスキーマ設計（最重要） |
| `docs/ui-layout.md` | 画面レイアウト・モード切替 |
| `docs/event-commands.md` | イベントコマンド仕様（Phase 2） |
| `docs/battle-spec.md` | 戦闘仕様（Phase 3） |
| `docs/ai-integration.md` | AI連携方針（Phase 5） |
| `docs/originality-policy.md` | オリジナリティ規約 |
| `docs/decisions.md` | 意思決定ログ |
| `prompts/phase1-implementation.md` | Phase 1実装用プロンプト |
