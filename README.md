## Period
アスリートとトレーナーが繋がるアプリ

### セットアップ

1. **依存関係のインストール**
```bash
pnpm install
```

2. **Pusherの設定**
リアルタイムチャット機能を使うには、Pusherのセットアップが必要です。
詳細は[PUSHER_SETUP.md](./PUSHER_SETUP.md)を参照してください。

3. **環境変数の設定**
```bash
cp .env.local.example .env.local
# .env.local を編集してPusherの認証情報を設定
```

4. **開発サーバーの起動**
```bash
pnpm dev
```

### 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma
- **Authentication**: Better Auth
- **Realtime**: Pusher (WebSocket alternative)
- **Styling**: CSS Modules
- **Deployment**: Vercel / Render.com

### 主な機能

- アスリート/トレーナーのロール管理
- パートナー連携システム
- **リアルタイムチャット**（Pusher使用）
- ワークアウト管理
- カレンダー機能