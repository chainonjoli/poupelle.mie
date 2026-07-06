# SNS運用チーム

『えんとつ町のプペル』ファンアカウント（[@ise.poupelle.likes](https://www.instagram.com/ise.poupelle.likes/)）と本業のエステサロンアカウント（[@chainonjoli](https://www.instagram.com/chainonjoli/)）、2つの Instagram / Threads アカウントを運用するためのチームとドキュメント一式です。

## チーム構成（AIサブエージェント）

`.claude/agents/` に定義された4名の分業体制です。Claude Code でこのリポジトリを開き、担当名を指定して依頼できます。

| 担当 | エージェント | 仕事 | 頼み方の例 |
|---|---|---|---|
| 企画 | `sns-planner` | 投稿カレンダー作成、キャンペーン企画 | 「7月の投稿計画を立てて」 |
| ライター | `sns-writer` | Instagram/Threadsの原稿執筆 | 「神社の参拝を促す投稿を書いて」 |
| 校閲 | `sns-reviewer` | 公開前チェック（トンマナ・権利・誤字） | 「このドラフトをレビューして」 |
| 分析 | `sns-analyst` | 月次レポート、改善提案 | 「先月のインサイトをまとめて」 |

担当を指定しなくても、依頼内容から適切なエージェントが選ばれます。

## ドキュメント

| ファイル | 内容 |
|---|---|
| [accounts.md](accounts.md) | 複数アカウントの設計と役割分担 |
| [guidelines.md](guidelines.md) | トンマナ・投稿頻度・禁止事項・権利上の注意 |
| [workflow.md](workflow.md) | 週次の運用フロー（企画→執筆→校閲→投稿→分析） |
| [templates/instagram.md](templates/instagram.md) | Instagram投稿テンプレート集（ファンアカウント用） |
| [templates/threads.md](templates/threads.md) | Threads投稿テンプレート集（ファンアカウント用） |
| [templates/salon.md](templates/salon.md) | サロンアカウント（@chainonjoli）用テンプレート集 |
| `calendar/` | 月別の投稿カレンダー（sns-planner が作成） |
| `drafts/` | 投稿原稿のドラフト置き場（sns-writer が作成） |
| `reports/` | 月次レポート（sns-analyst が作成） |

## 基本フロー

```
sns-planner（カレンダー作成）
   ↓
sns-writer（原稿執筆 → drafts/ に保存）
   ↓
sns-reviewer（公開前チェック）
   ↓
人間が各アプリから投稿（自動投稿はしない）
   ↓
sns-analyst（月末に数値を振り返り → 次月の企画へ）
```

## できないこと（重要）

- **自動投稿はできません。** Instagram/Threadsへの投稿は、必ず人間が公式アプリまたは Meta Business Suite から行います
- インサイト数値の自動取得もできません。分析時はアプリのインサイト画面から数値を転記してください
