# 公式X（@toiro_shrine）自動投稿の設定手順

毎朝8時（日本時間）に、`x-posts.json` の投稿文が自動でXに投稿されます。
動かすには、XのAPIキー4つをこのリポジトリに登録する作業が **1回だけ** 必要です（約15分）。

## 1. X開発者アカウントの登録（無料）

1. **@toiro_shrine でXにログインした状態で** https://developer.x.com を開く
2. 「Sign up for Free Account」から無料プランで登録
   - 利用目的を英語で聞かれたら例: `Automated daily posts for my original web service's official account.`
3. 無料プランの投稿上限は月500件。毎朝1件（月約30件）なので余裕があります

## 2. アプリの権限設定とキーの発行

1. ダッシュボードでプロジェクト内のアプリを開く
2. 「User authentication settings」を **Set up** →
   - App permissions: **Read and write** を選ぶ
   - Type of App: Web App など（どれでも可）
   - Callback URI / Website URL: `https://chainonjoli.github.io/poupelle.mie/shrine.html`
   - 保存
3. 「Keys and tokens」タブで以下の4つを発行してメモする
   - **API Key** と **API Key Secret**（Consumer Keys）
   - **Access Token** と **Access Token Secret**
   - ⚠️ Access Token は「Read and write」に権限を変えた **あとで** 発行（先に発行済みなら Regenerate）

## 3. GitHubにキーを登録

このリポジトリの **Settings → Secrets and variables → Actions → New repository secret** で、
以下の名前で4つ登録します（名前は正確にこの通りに）：

| Name | 値 |
|---|---|
| `X_API_KEY` | API Key |
| `X_API_SECRET` | API Key Secret |
| `X_ACCESS_TOKEN` | Access Token |
| `X_ACCESS_SECRET` | Access Token Secret |

## 4. 動作確認

1. リポジトリの **Actions → X自動投稿（毎朝8時） → Run workflow** を開く
2. まず「投稿せずに本文の確認だけする」に **チェックを入れて** 実行 → ログで本文を確認
3. 問題なければチェックを **外して** 実行 → @toiro_shrine に実際に投稿されれば成功
4. あとは毎朝8時に自動で投稿されます

## 投稿文の変え方

`social/x-posts.json` を編集するだけです。曜日ごとに3本あり、週替わりで順番に使われます。
毎月1日は `tsuitachi`（朔日参り）の投稿が優先されます。

## 注意

- リポジトリに60日間コミットがないと、GitHubが自動実行を停止します（普段どおり更新していれば問題ありません。止まったらActionsページのボタンで再開できます）
- 当落日など特別な日の投稿は自動化せず、手動で投稿するのがおすすめです（`social/../` のX運用キット参照）
