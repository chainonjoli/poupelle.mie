/* =========================================================
   PIXEL OFFICE - データ定義
   AI社員のプロフィール・タスクプール・セリフなどの静的データ。
   ========================================================= */
(function (global) {
  'use strict';

  /* AI社員 6名。deskIndex はマップの座席番号(1〜6)に対応する */
  const AGENTS = [
    {
      id: 'claude', name: 'クロード', role: 'フルスタック開発',
      desk: 1, accessory: 'headphones',
      colors: { hair: '#4a3728', skin: '#f2c9a0', shirt: '#e8734a', pants: '#2b3a55' },
      tasks: [
        'APIエンドポイントを実装中',
        'PR #{n} をレビュー中',
        'auth.js をリファクタリング中',
        'DBマイグレーションを作成中',
        'バグ修正中: 500エラーを調査',
        'WebSocketの再接続処理を実装中'
      ]
    },
    {
      id: 'sonnet', name: 'ソネット', role: 'フロントエンド',
      desk: 2, accessory: 'none',
      colors: { hair: '#7a4b8f', skin: '#f7d7b6', shirt: '#e05a8a', pants: '#33334d' },
      tasks: [
        'ダークモード対応を実装中',
        'コンポーネントを分割中',
        'CSSアニメーションを調整中',
        'アクセシビリティを改善中',
        'レスポンシブ崩れを修正中',
        'Storybookを整備中'
      ]
    },
    {
      id: 'haiku', name: 'ハイク', role: 'QAテスト',
      desk: 3, accessory: 'glasses',
      colors: { hair: '#20313f', skin: '#eebf94', shirt: '#3aa06a', pants: '#3a2f28' },
      tasks: [
        'E2Eテスト {n}件を実行中',
        '回帰テストを消化中',
        'バグ再現手順を作成中',
        'テストカバレッジを計測中',
        'flakyテストを退治中',
        'リリース前チェックリスト確認中'
      ]
    },
    {
      id: 'opus', name: 'オーパス', role: 'アーキテクト',
      desk: 4, accessory: 'glasses',
      colors: { hair: '#8a8f98', skin: '#f2c9a0', shirt: '#4a6fd8', pants: '#26262e' },
      tasks: [
        'システム設計書を執筆中',
        'ADR(設計判断記録)を作成中',
        '技術負債の棚卸し中',
        'マイクロサービス分割を検討中',
        'スケール戦略をシミュレーション中',
        'コードベース全体を解析中'
      ]
    },
    {
      id: 'pixel', name: 'ピクセル', role: 'デザイナー',
      desk: 5, accessory: 'cap',
      colors: { hair: '#d8862a', skin: '#f7d7b6', shirt: '#f0b429', pants: '#4d3a66' },
      tasks: [
        'ドット絵アイコンを作成中',
        'UIモックを {n}案 制作中',
        'カラーパレットを調整中',
        'ロゴのピクセルを打ち中',
        'デザインシステムを更新中',
        'スプライトシートを整理中'
      ]
    },
    {
      id: 'debug', name: 'デバッグくん', role: 'SRE / インフラ',
      desk: 6, accessory: 'headphones',
      colors: { hair: '#2e6e4e', skin: '#eebf94', shirt: '#38b2ac', pants: '#2b3a55' },
      tasks: [
        '本番ログを解析中',
        'CI/CDパイプラインを高速化中',
        'アラート {n}件をトリアージ中',
        'コンテナイメージを軽量化中',
        '監視ダッシュボードを整備中',
        'コスト最適化レポート作成中'
      ]
    }
  ];

  /* 作業中にたまに出る心の声（絵文字エモート） */
  const WORK_EMOTES = ['💡', '🔥', '🤔', '⚙️', '📈', '✨'];

  /* タスク完了時のログに添える一言 */
  const DONE_FLAVORS = [
    'テスト全件パス！',
    'ビルド成功 (2.3s)',
    'レビューOKもらった',
    'コミットしてプッシュ済み',
    '想定より早く終わった',
    'ドキュメントも更新した'
  ];

  /* 休憩・移動系アクティビティの定義（重み付き抽選用） */
  const BREAKS = [
    { type: 'coffee',     weight: 30, label: '☕ コーヒー休憩中',       minutes: [6, 12] },
    { type: 'vending',    weight: 10, label: '🥤 ドリンク購入中',       minutes: [4, 8] },
    { type: 'chat',       weight: 25, label: '💬 相談中',               minutes: [8, 14] },
    { type: 'whiteboard', weight: 15, label: '🖊️ ホワイトボードで設計中', minutes: [10, 18] },
    { type: 'wander',     weight: 20, label: '🚶 考えごと散歩中',       minutes: [5, 10] }
  ];

  const OfficeData = { AGENTS, WORK_EMOTES, DONE_FLAVORS, BREAKS };

  if (typeof module !== 'undefined' && module.exports) module.exports = OfficeData;
  else global.OfficeData = OfficeData;
})(typeof window !== 'undefined' ? window : globalThis);
