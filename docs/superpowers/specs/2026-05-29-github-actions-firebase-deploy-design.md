# GitHub Actions による Firebase Hosting 自動デプロイ 設計書

- 作成日: 2026-05-29
- 対象リポジトリ: `yoichiro/zero-knowledge-pitch-builder`
- 対象プロジェクト: Firebase `zero-knowledge-pitch-builder`

## 1. 目的・背景

`main` ブランチにマージされたタイミングで、ビルド成果物を Firebase Hosting に
自動デプロイできるようにする。現状は手元で `npm run build` → `firebase deploy`
を手動実行しており、デプロイ忘れや環境差異（手元 Windows / WSL のネイティブ
バイナリ差など）のリスクがある。CI（Linux ランナー）上でクリーンにビルド・
デプロイすることで、この手動運用をなくす。

## 2. 要件

- `main` への push（= PR マージ）を契機に自動デプロイする。
- デプロイ先は本番 (live) チャンネルのみ。PR プレビューチャンネルは対象外。
- 認証は Firebase 公式が推奨するサービスアカウント方式を用いる。
- 既存の `firebase.json`（`public: dist` / SPA rewrite）をそのまま利用する。

## 3. 採用方針

- GitHub Action: Firebase 公式の `FirebaseExtended/action-hosting-deploy@v0`。
- 認証セットアップ: `firebase init hosting:github` を利用し、サービスアカウント
  作成・鍵の暗号化・GitHub Secret 登録を自動で行う（鍵がローカルに残らず安全）。
- ワークフローは本番デプロイ用の 1 ファイルのみとする。`init` が PR プレビュー用
  ワークフローも生成した場合は削除する。

### 採用しなかった案

- 手動でサービスアカウント鍵を生成し `gh secret set` で登録する案: 鍵 JSON を
  一時的にローカル生成する必要があり機密管理の負担が増えるため不採用。
- `FIREBASE_TOKEN`（CI トークン）方式: Google が非推奨方向のため不採用。

## 4. 全体フロー

```
main に push（PR マージ）
   └─> GitHub Actions 起動
         ├─ actions/checkout
         ├─ actions/setup-node (Node 22, npm キャッシュ)
         ├─ npm ci          # lockfile 通りに依存インストール
         ├─ npm run build   # dist/ 生成
         └─ FirebaseExtended/action-hosting-deploy (channelId: live)
               └─> https://zero-knowledge-pitch-builder.web.app 更新
```

## 5. ワークフロー定義

`.github/workflows/firebase-hosting-merge.yml`

```yaml
name: Deploy to Firebase Hosting on merge
on:
  push:
    branches:
      - main
permissions:
  contents: read
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_ZERO_KNOWLEDGE_PITCH_BUILDER }}
          channelId: live
          projectId: zero-knowledge-pitch-builder
```

設計上の判断:

- 本番デプロイのみのため、PR コメント用の `repoToken` は指定しない。
- `permissions` は `contents: read` のみ（PR への書き込みが不要なため）。
- Node バージョンはローカル開発環境 (v22) に合わせる。
- Secret 名は `firebase init hosting:github` が生成する
  `FIREBASE_SERVICE_ACCOUNT_<プロジェクトID大文字スネーク>` 形式に合わせる。
  実際の登録名はセットアップ後に確認し、差異があればワークフロー側を合わせる。

## 6. セットアップ手順

1. 洋一郎さんがローカルで `npx -y firebase-tools@latest init hosting:github` を
   実行し、サービスアカウントと GitHub Secret を登録する。
2. Claude が本ワークフロー（`main` 用 1 本）を整備する。`init` が PR プレビュー用
   ワークフローを生成していた場合は削除し、Secret 名を実登録名に合わせる。

## 7. 検証方法

- ワークフローを `main` に反映後、実際の push（または PR マージ）で Actions が
  起動し、ジョブが成功することを確認する。
- 本番 URL (https://zero-knowledge-pitch-builder.web.app) が更新されることを確認する。
- 前提: Secret 未登録だとデプロイ step で失敗するため、手順 1（init）を先に行う。

## 8. リスク・留意点

- Secret 名の不一致でデプロイが失敗しうる → セットアップ後に名前を突き合わせる。
- `action-hosting-deploy@v0` のメジャー更新時は破壊的変更に注意する。
