# 十色神社を App Store に出すには

十色神社は PWA（インストール可能な Web アプリ）としてストア提出可能な品質に整えてあります。
実際に App Store へ出すための残り手順をまとめます。

## いますぐできること（ストア不要）

すでに **ホーム画面への追加（インストール）** に対応しています。

- iPhone: Safari で https://chainonjoli.github.io/poupelle.mie/shrine.html を開く → 共有 → 「ホーム画面に追加」
- Android: Chrome で開く → メニュー → 「アプリをインストール」

アイコン・スタンドアロン表示（ブラウザUIなし）・オフライン起動（Service Worker）が効きます。
まずはこの形で配って反応を見るのがおすすめです。

## App Store に出す手順

Web アプリをそのまま App Store には出せないため、ネイティブの「ガワ」で包みます。

### 1. Apple Developer Program に登録（必須）

- https://developer.apple.com/jp/programs/ — 年間 99 USD（個人でも可）
- 審査・署名・提出のすべてに必要です

### 2. ラッパーを作る（どちらか）

**A. PWABuilder（簡単・推奨）**
1. https://www.pwabuilder.com/ に本番URLを入れる
2. スコアを確認（manifest / Service Worker / icons は対応済み）
3. 「iOS」パッケージを生成 → Xcode プロジェクトがダウンロードされる

**B. Capacitor（自由度が高い）**
```bash
npm create @capacitor/app
# webDir にこのリポジトリの内容を配置し、
npx cap add ios && npx cap open ios
```

### 3. Xcode で仕上げて提出

- Bundle ID（例: `jp.toiroshrine.app`）、バージョン、アイコン（assets/icon-512.png から生成）
- App Store Connect でアプリ情報を登録し、TestFlight → 審査提出

### 4. 審査で求められるもの（対応状況）

| 要件 | 状況 |
|---|---|
| プライバシーポリシーのURL | ✅ サイト内「このアプリについて」節（`shrine.html#privacy-section`） |
| データ収集の申告（App Privacy） | ✅ 「収集なし」で申告できる設計（端末内保存のみ・解析なし） |
| 最低限の機能性（ガイドライン4.2: ただのWebサイトは不可） | ✅ 絵馬・御朱印生成・御朱印帳・みくじ・記念日・オフライン動作というアプリ的機能あり |
| 占いコンテンツの扱い | ✅ エンタメ目的であることをサイト内に明記済み |
| スクリーンショット（6.7" / 5.5"） | ⬜ 提出時に実機で撮影 |
| サポートURL | ⬜ 公式X（@toiro_shrine）や GitHub Pages を指定 |

### 5. 注意点

- **お賽銭**: アプリ内から外部決済（STORES）へ誘導する場合、Apple の In-App Purchase 規約に抵触する可能性があります。iOS 版ではお賽銭セクションを非表示にするか、寄付として External Link Account の要件を確認してください（`SAISEN_URL` が空の現状は表示が「準備中」なので問題ありません）。
- **X 共有**: 共有シート（`navigator.share`）はネイティブラッパー内でも動作しますが、実機で確認してください。

## Google Play に出す場合

PWABuilder の「Android」パッケージ（TWA）を使えば、ほぼ同じ手順で提出できます。
Google Play Developer 登録（25 USD・買い切り）が必要です。
