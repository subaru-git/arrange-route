# Design Doc: ダーツ「アレンジ辞書」SNS (MVP)

## 1. 目的

本ドキュメントは `docs/spec.md` を実装設計に落とし込むための設計書である。
MVPでは、点数ページ中心の閲覧・投稿・投票・コメントを実現する。

## 2. スコープ

- 対象: MVP機能（閲覧、投稿、投票、コメント、Googleログイン、RLS）
- 非対象: フォロー/タイムライン、画像動画投稿、高度検索、推薦

## 3. 技術構成

- Frontend: Next.js (App Router)
- Hosting: Vercel
- BaaS/DB/Auth: Supabase
- MVPの運用方針: ドメイン費用を除き無料枠/無料プランで運用
- 将来: AWS等への移行を見据えて、DBアクセスはアプリ層のRepository経由に限定

### 3.1 環境構成

- `local`: ローカル開発環境（`.env.local`）
- `staging`: Vercel Preview + Supabase staging
- `production`: Vercel Production + Supabase production

運用ルール:

- スキーマ変更は `staging` で検証後に `production` へ反映
- 環境変数は Vercel の `Preview` / `Production` で分離管理
- 詳細手順は `docs/deployment.md` を参照

## 4. 画面・ルーティング設計

- `/scores` (点数一覧ページ / アプリ入口)
- `/scores/[remaining_score]`
- `/new`
- `/auth/callback` (Supabase OAuth callback)

### 4.1 `/scores`

- 1-701 の点数を一覧表示
- 各点数カード/リンクから `/scores/[remaining_score]` へ遷移

### 4.2 `/scores/[remaining_score]`

クエリ:

- `out_rule` (optional): `double_out | master_out | single_out`
- `bull_mode` (optional): `separate | fat`
- `sort` (optional): `popular | latest`（未指定時 `popular`）

仕様:

- クエリ未指定時は全表示
- フィルター未指定状態に戻した場合、該当クエリをURLから削除
- `popular`: `vote_score desc, created_at desc`
- `latest`: `created_at desc`

### 4.2 `/new`

入力:

- `remaining_score` (1-701)
- `darts_left` (1-3)
- `out_rule`
- `bull_mode`
- ルート入力 (Tree View、右方向展開)
- コメント（任意）

## 5. ドメインモデル

### 5.1 列挙型

- `out_rule`: `double_out | master_out | single_out`
- `bull_mode`: `separate | fat`
- `vote_type`: `up | down`

### 5.2 トークン表記方針

- 一般記法は未統一だが、本プロダクト内でトークンを正規化
- `bull_mode=fat`: `BULL(50)` のみ
- `bull_mode=separate` かつ `out_rule=double_out`: PDC準拠表記（例 `Bull`, `25`）
- 上記以外の `separate`: 日本ダーツ協会準拠（例 `S-BULL`, `D-BULL`）

注: 表示表記と保存表記は分離し、保存は内部正規化トークンを使う。

## 6. データ設計（Supabase/PostgreSQL）

### 6.1 `profiles`

- `id uuid pk` (auth.users.id)
- `display_name text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 6.2 `posts`

- `id uuid pk default gen_random_uuid()`
- `author_user_id uuid not null` (fk -> profiles.id)
- `remaining_score int not null check (remaining_score between 1 and 701)`
- `darts_left int not null check (darts_left between 1 and 3)`
- `out_rule out_rule not null`
- `bull_mode bull_mode not null`
- `route_tree jsonb not null` (1投稿=1Tree)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

index:

- `(remaining_score, out_rule, bull_mode, created_at desc)`
- `(remaining_score, created_at desc)`

`route_tree` の保存方針:

- UIのTree構造をそのままJSONで保存する
- 途中ノードの入れ替え・再利用は行わない
- 表示/入力補助としてTreeを使い、投稿単位データとして扱う

### 6.3 `votes`

- `id uuid pk default gen_random_uuid()`
- `post_id uuid not null` (fk -> posts.id on delete cascade)
- `user_id uuid null` (ログイン時)
- `browser_id text null` (未ログイン時)
- `vote_type vote_type not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

unique制約（どちらかで1件）:

- `unique (post_id, user_id)` where `user_id is not null`
- `unique (post_id, browser_id)` where `user_id is null and browser_id is not null`

仕様:

- 未ログイン同一判定は `browser_id`（Cookie/LocalStorage、365日有効）
- 取り消しは該当voteレコード削除

index:

- `(post_id)`

### 6.4 `comments`

- `id uuid pk default gen_random_uuid()`
- `post_id uuid not null` (fk -> posts.id on delete cascade)
- `author_user_id uuid not null` (fk -> profiles.id)
- `body text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

index:

- `(post_id, created_at asc)`

### 6.5 `post_stats`（集計用、table or materialized view）

- `post_id uuid pk`
- `up_count int not null`
- `down_count int not null`
- `vote_score int not null` (`up_count - down_count`)
- `comment_count int not null`

更新:

- MVPはDBトリガーまたはRPC更新
- 将来はイベント駆動でも可

## 7. RLS設計

### 7.1 読み取り

- `posts`, `comments`, `post_stats`, `profiles`: 全員 `select` 可
- `votes`: 本人判定に必要な最小情報のみ返す（公開レスポンスは集計ベース推奨）

### 7.2 書き込み

- `posts`: 認証ユーザーのみ `insert`、`update` は `author_user_id = auth.uid()`
- `comments`: 認証ユーザーのみ `insert`、`delete` は `author_user_id = auth.uid()`
- `votes`:
  - 認証時: `user_id = auth.uid()` のみ許可
  - 未認証時: Server Action経由で `browser_id` 付与して upsert/delete（直接table公開しない）

## 8. Server Actions設計（MVP）

### 8.1 読み取り

- `/scores/[remaining_score]` のServer Componentで直接取得
  - query: `out_rule?`, `bull_mode?`, `sort=popular|latest`
  - response: 投稿カード配列（ルート、ミス分岐、vote情報、コメント含む）

### 8.2 書き込み

- `createPostAction`
- `editPostAction`（投稿者本人）
- `voteAction`（up/down）
- `removeVoteAction`（取り消し）
- `commentAction`
- `deleteCommentAction`（投稿者本人）

備考:

- 未ログイン投票の `browser_id` はCookieで発行/読取
- DB直接依存を避けるため、Action層からRepositoryを呼ぶ

## 9. UIコンポーネント設計

### 9.1 共通

- `ScoreHeader`
- `ScoreFilters` (out_rule / bull_mode)
- `SortToggle`
- `ShareUrlButton`

### 9.2 一覧

- `PostCard`
  - Main Route
  - Miss Route
  - vote_score / up/down / comment_count
  - コメント一覧（または最新コメント）
  - author / relative time

### 9.3 投稿作成

- `RouteTreeEditor`（右方向展開）
- `TokenPicker`（ボタン選択）
- `OptionalCommentField`

## 10. バリデーション

- `remaining_score`: 1..701
- `darts_left`: 1..3
- `out_rule`, `bull_mode`: enumのみ
- `RouteTree`:
  - 深さは `darts_left` 以内（JSON構造として検証）
  - トークンは許可トークンのみ
  - 終了条件: `darts_left` 到達 or 残点0
- コメント本文: 空文字不可（入力した場合）

## 11. 時刻・表示

- DB保存はUTC
- 画面表示はユーザー環境ローカル時刻
- 投稿カードは相対表記（例: 2時間前）

## 12. パフォーマンス

- 一覧はページネーション（cursor推奨）
- `vote_score` ソートは集計テーブル経由
- 初期MVP目標: `/scores/[remaining_score]` の初回表示 p95 < 1.5s

## 13. 監視・運用

- Vercel Analytics/Logs
- Supabase query metrics
- 失敗率、p95、投票API成功率を計測

## 14. Supabase置換方針（将来）

- DBアクセスを `Repository interface` に隠蔽
- Auth依存を `AuthProvider interface` に分離
- `browser_id` 管理はアプリ層で持ち、DBに閉じない
- 置換候補: AWS (Cognito + RDS + Lambda/API Gateway)

## 15. リリース順

1. DBスキーマ + RLS
2. 認証（Google）
3. `/scores` 一覧 + フィルター + ソート
4. `/new` Tree View投稿
5. 投票（未ログイン対応含む）
6. コメント
