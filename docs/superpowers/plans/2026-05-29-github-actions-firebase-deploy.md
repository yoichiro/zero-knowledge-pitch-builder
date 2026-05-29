# GitHub Actions Firebase Hosting Auto-Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `main` へ push（PR マージ）されたら、ビルド成果物を Firebase Hosting の本番(live)チャンネルへ自動デプロイする。

**Architecture:** GitHub Actions の単一ワークフローで `npm ci` → `npm run build` → `FirebaseExtended/action-hosting-deploy@v0` を実行する。認証は `firebase init hosting:github` が自動登録するサービスアカウント JSON（GitHub Secret）を用いる。

**Tech Stack:** GitHub Actions, Node 22, Vite, Firebase Hosting, `FirebaseExtended/action-hosting-deploy@v0`

> ⚠️ Task 1 はブラウザでの GitHub 認可を伴う洋一郎さん本人の手作業です（サブエージェントに委譲不可）。Task 1 完了後に Task 2 以降を実施してください。

---

### Task 1: サービスアカウント & GitHub Secret のセットアップ（洋一郎さん手作業）

**Files:**
- 影響: `.github/workflows/`（`firebase init` がワークフローを生成する場合あり）

- [ ] **Step 1: init コマンドを実行**

Run（リポジトリルートで）:
```bash
npx -y firebase-tools@latest init hosting:github
```

プロンプトでの回答指針:
- "For which GitHub repository would you like to set up a GitHub workflow?" → `yoichiro/zero-knowledge-pitch-builder`
- "Set up the workflow to run a build script before every deploy?" → `Yes`、ビルドコマンドは `npm ci && npm run build`
- "Set up automatic deployment to your site's live channel when a PR is merged?" → `Yes`、live ブランチは `main`

Expected: ブラウザで GitHub 認可後、サービスアカウントが作成され、GitHub Secret が登録される。CLI に「Created service account ...」「uploaded secret ...」相当のログが出る。

- [ ] **Step 2: 登録された Secret 名を確認**

Run:
```bash
gh secret list
```
Expected: `FIREBASE_SERVICE_ACCOUNT_ZERO_KNOWLEDGE_PITCH_BUILDER`（または類似の `FIREBASE_SERVICE_ACCOUNT_*`）が一覧に表示される。**この正確な名前を Task 3 で使う。**

- [ ] **Step 3: 生成されたワークフローを確認**

Run:
```bash
ls -la .github/workflows/
```
Expected: `firebase-hosting-merge.yml` と（PR プレビュー用の）`firebase-hosting-pull-request.yml` が存在し得る。内容は次タスクで整える。

---

### Task 2: PR プレビュー用ワークフローを削除（本番のみにする）

**Files:**
- Delete: `.github/workflows/firebase-hosting-pull-request.yml`（存在する場合のみ）

- [ ] **Step 1: PR プレビュー用ワークフローの有無を確認**

Run:
```bash
test -f .github/workflows/firebase-hosting-pull-request.yml && echo "EXISTS" || echo "ABSENT"
```
Expected: `EXISTS` なら削除へ進む。`ABSENT` なら本タスクはスキップ。

- [ ] **Step 2: 削除**

Run:
```bash
git rm .github/workflows/firebase-hosting-pull-request.yml
```
Expected: ファイルが削除されステージされる。

---

### Task 3: 本番デプロイ用ワークフローを最終形に確定

**Files:**
- Create/Modify: `.github/workflows/firebase-hosting-merge.yml`

- [ ] **Step 1: Secret 名を確認して確定**

Run:
```bash
gh secret list | grep FIREBASE_SERVICE_ACCOUNT
```
Expected: 実際の Secret 名（例: `FIREBASE_SERVICE_ACCOUNT_ZERO_KNOWLEDGE_PITCH_BUILDER`）を控える。次の YAML の `firebaseServiceAccount` 行をこの名前に合わせる。

- [ ] **Step 2: ワークフローを最終形で記述**

`.github/workflows/firebase-hosting-merge.yml` の全文を以下にする（`<SECRET_NAME>` を Step 1 の実名に置換）:

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
          firebaseServiceAccount: ${{ secrets.<SECRET_NAME> }}
          channelId: live
          projectId: zero-knowledge-pitch-builder
```

- [ ] **Step 3: YAML 構文を確認**

Run:
```bash
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/firebase-hosting-merge.yml')); print('YAML OK')"
```
Expected: `YAML OK`（構文エラーがあれば例外が出るので修正する）。

---

### Task 4: コミット & push

**Files:**
- Commit: `.github/workflows/firebase-hosting-merge.yml`（および Task 2 の削除）

- [ ] **Step 1: 変更内容を確認**

Run:
```bash
git status && git diff --cached
```
Expected: 追加/変更が `.github/workflows/` 配下のみであること（不要ファイルが混ざっていないこと）。

- [ ] **Step 2: コミット**

```bash
git add .github/workflows/firebase-hosting-merge.yml
git commit -m "ci: Add GitHub Actions workflow to deploy to Firebase Hosting on merge to main"
```
Expected: コミット成功。

- [ ] **Step 3: push**

```bash
git push
```
Expected: `origin/main` に反映。push 自体がワークフローのトリガーとなり、初回のデプロイが走る。

---

### Task 5: 本番デプロイの動作確認

**Files:** なし（CI 実行の観測のみ）

- [ ] **Step 1: ワークフロー実行を確認**

Run:
```bash
gh run list --workflow="Deploy to Firebase Hosting on merge" --limit 3
```
Expected: 直近の push に対応する run が表示される（status: in_progress または completed）。

- [ ] **Step 2: 実行完了を待って結果を確認**

Run:
```bash
gh run watch
```
Expected: ジョブが `success` で完了する。失敗時はログを確認し、よくある原因（Secret 名不一致、ビルド失敗）を切り分ける。

- [ ] **Step 3: 本番 URL の更新を確認**

Run:
```bash
curl -sI https://zero-knowledge-pitch-builder.web.app | head -1
```
Expected: `HTTP/2 200`。ブラウザでも最新のビルド内容が反映されていることを確認する。

---

## Self-Review

- **Spec coverage:** 仕様の各要件（main トリガー / 本番のみ / 公式 action / サービスアカウント認証 / 既存 firebase.json 利用）に対応するタスクが存在する（Task 3 = トリガー・action・認証、Task 2 = 本番のみ化、firebase.json はそのまま利用）。
- **Placeholder scan:** `<SECRET_NAME>` は意図的なプレースホルダーで、Task 3 Step 1 で実名に確定する手順を明示済み。それ以外の TBD/TODO はなし。
- **Type consistency:** ワークフロー名「Deploy to Firebase Hosting on merge」は Task 3 の `name:` と Task 5 の `--workflow=` で一致。Secret 名は Task 1/3 で同一の確認手順に統一。
