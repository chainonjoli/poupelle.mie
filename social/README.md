# 公式X（@toiro_shrine）自動投稿の設定手順

毎朝8時（日本時間）に、`x-posts.json` の投稿文が自動でXに投稿されます。
動かすには、XのAPIキー4つをこのリポジトリに登録する作業が **1回だけ** 必要です。

## 料金について（2026年2月に変更あり）

XのAPIは無料プランが廃止され、**従量課金制（pay-per-use）** になりました。

- リンクなしの投稿: **$0.015/件**
- リンク入りの投稿: **$0.20/件**（13倍高い）
- この自動投稿はリンク入りを月1回（朔日）だけに抑えてあるため、
  **月額の目安は約 $0.65（約100円）** です
- 利用にはクレジットカードでのチャージ（クレジット購入）が必要です
- 使いすぎ防止に **spending limit（利用上限）** を必ず設定してください（例: 月$5）

## 1. X API Console での登録（console.x.com）

1. **@toiro_shrine でXにログインした状態で** https://console.x.com を開く
2. アカウント（開発者登録）を作成し、**Project と App** を作成する
3. 支払い設定でクレジットをチャージし、**spending limit を設定**（例: $5/月）

## 2. アプリの権限設定とキーの発行

1. 作成したAppの設定（Settings / User authentication settings）を開く
2. **App permissions: Read and write** を選ぶ（投稿に必須。初期値はReadのみ）
   - Type of App: Web App, Automated App or Bot
   - Callback URI / Website URL: `https://chainonjoli.github.io/poupelle.mie/shrine.html`
3. 「Keys and tokens」で以下の4つを発行してメモする
   - **API Key** と **API Key Secret**（Consumer Keys）
   - **Access Token** と **Access Token Secret**
   - ⚠️ Access Token は権限を「Read and write」に変えた **あとで** 発行
     （「Created with Read and Write permissions」と表示されていればOK。
     Read onlyと出ていたら Regenerate する）

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
※ URLを本文に入れると料金が13倍（$0.20/件）になるので、毎日の投稿には入れないのがおすすめです。

## お金をかけたくない場合の代替（無料）

Xの通常の投稿画面にある **予約投稿** 機能（無料）で、週1回まとめて7日分を予約する方法もあります。
`x-posts.json` の文面をコピペすれば同じ内容を運用できます。

## 注意

- リポジトリに60日間コミットがないと、GitHubが自動実行を停止します（普段どおり更新していれば問題ありません。止まったらActionsページのボタンで再開できます）
- 当落日など特別な日の投稿は自動化せず、手動で投稿するのがおすすめです（X運用キット参照）
