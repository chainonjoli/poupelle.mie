# 推し活レーダーOS API（Cloudflare Workers + D1）

Phase 2a: データ基盤。フロント（`/oshi-radar.html`）のクラウドモードの接続先。

## 構成

```
wrangler.toml            Workers設定（D1バインディング・cron予約枠）
migrations/0001_init.sql D1スキーマ
src/index.js             API本体（認証・CRUD・移行・変更履歴・上書き優先順位）
```

## 本番デプロイ手順（あづさのCloudflareアカウントで実行）

```bash
cd workers/oshi-radar-api
npm install                       # wranglerが入る

# 1. ログイン（ブラウザが開く）
npx wrangler login

# 2. D1データベース作成
npx wrangler d1 create oshi-radar-db
#    → 出力される database_id を wrangler.toml の database_id に貼り付ける

# 3. スキーマ適用（本番D1へ）
npx wrangler d1 migrations apply oshi-radar-db --remote

# 4. APIトークンを設定（長いランダム文字列を自分で決める。これがアプリの合言葉になる）
npx wrangler secret put API_TOKEN

# 5. デプロイ
npx wrangler deploy
#    → https://oshi-radar-api.<subdomain>.workers.dev が発行される
```

## フロント側の移行手順（データを消さない）

1. スマホ/PCで `oshi-radar.html` を開く → 設定タブ
2. 「☁ クラウドへ移行」に API URL とトークンを入力
3. **① バックアップ**（ブラウザ内コピー＋JSONファイルのダウンロード）
4. **② 接続テスト** → **③ 移行実行** → **④ 検証**（ローカルとサーバーの件数比較）
5. 検証が ✅ になったら **⑤ クラウドモードへ切替**

- 移行後も localStorage のローカルデータ（`oshiRadar.v1`）とバックアップは残る
- 「ローカルモードに戻す」でいつでも戻せる（クラウド側データも消えない）
- 2台目以降の端末は ②接続テスト→④検証→⑤切替 だけでよい（移行不要）

## ローカル開発

```bash
cp .dev.vars.example .dev.vars       # API_TOKEN=dev-token
npx wrangler d1 migrations apply oshi-radar-db --local
npx wrangler dev --local --port 8788
```

## API（すべて `Authorization: Bearer <API_TOKEN>` 必須。/api/health のみ認証不要）

| Method | Path | 用途 |
|---|---|---|
| GET | /api/health | 死活確認 |
| GET | /api/state | 全状態（Phase 1のJSON形式で返す） |
| GET | /api/export | バックアップ（stateと同形式） |
| POST | /api/oshi | 推しupsert |
| DELETE | /api/oshi/:id | 推し削除 |
| POST | /api/events | イベントupsert（identity重複は409） |
| DELETE | /api/events/:id | イベント削除 |
| GET | /api/events/:id/changes | 変更履歴 |
| POST | /api/schedules | 予定upsert |
| DELETE | /api/schedules/:id | 予定削除 |
| PUT | /api/settings | 設定更新 |
| POST | /api/migrate | Phase 1エクスポートJSONの一括取込（冪等） |

## 設計メモ（Phase 2bへの引き継ぎ）

- **上書き優先順位**: `applyEventUpdate(db, event, changeSource)` が一元管理。
  changeSource は `user / migration / collector_L1 / collector_L2 / collector_L3`。
  - ユーザー編集したフィールドは `events.manual_fields` に記録され、collectorは上書き不可
  - `collector_L3`（未確認ソース）は空フィールドを埋めることしかできない
  - 収集エンジンは同じ関数を changeSource='collector_*' で呼ぶだけでよい
- **verification**: 公式(L1/L2)ソースが1つ以上→ `verified`、なければ `unverified`（UIで【要確認】）
- **identity**: `norm(名前)|norm(会場)|開始日|norm(主催者)` にUNIQUE制約。表記揺れはnorm()で吸収
- **変更履歴**: 全フィールド変更が `event_change_logs` に残る（変更通知の元データ）
- 2bで使う受け皿を作成済み: `source_registry`（巡回ソース管理・差分ハッシュ）、
  `event_scores`（通知判定キャッシュ）、`notifications`
- cronは wrangler.toml のコメントアウトを外して scheduled ハンドラを実装する
