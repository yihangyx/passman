# PassMan — 密码管理器

部署在 Vercel + Vercel KV 的加密密码管理工具。

## 功能

- 🔐 主密码保护访问（ACCESS_PASSWORD）
- 🔑 AES-256-GCM 加密存储密码
- 📋 按编号快速查询（输入数字 → 显示对应密码）
- ➕ 添加 / 删除账号密码
- 🌐 部署在 Vercel，数据存 Vercel KV

## 本地开发

### 1. 安装依赖

```bash
cd passman
npm install
```

### 2. 生成加密密钥

```bash
node scripts/generate-key.js
```

复制输出的 `ENCRYPTION_KEY=` 值，填入 `.env.local`。

### 3. 设置访问密码

在 `.env.local` 中设置：

```
ACCESS_PASSWORD=你的访问密码
ENCRYPTION_KEY=上一步生成的64位hex字符串
```

### 4. 配置 Vercel KV

在 Vercel 控制台创建 KV 数据库，将连接变量复制到 `.env.local`：

```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_URL=...
```

### 5. 启动开发服务器

```bash
npm run dev
# 打开 http://localhost:3000
```

## 部署到 Vercel

### 方式一：通过 Git 推送自动部署

1. 创建 GitHub 仓库，推送代码
2. 在 Vercel 控制台 → Import Project → 选择该仓库
3. 在 Settings → Environment Variables 中设置：
   - `ENCRYPTION_KEY`
   - `ACCESS_PASSWORD`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_URL`
4. Deploy

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel env add ENCRYPTION_KEY
vercel env add ACCESS_PASSWORD
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add KV_URL
vercel --prod
```

## 使用说明

1. 打开网站，输入访问密码解锁
2. 主界面显示所有已保存的密码条目（带编号）
3. **输入编号**（如 `3`）→ 立即显示第 3 条密码详情
4. **输入文字** → 按网站名/账号名搜索过滤
5. 点击条目 → 显示账号和密码
6. 点击「+ 添加」→ 填写信息保存

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 14 App Router + React + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes |
| 数据库 | Vercel KV (Redis) |
| 加密 | Node.js crypto (AES-256-GCM) |
| 部署 | Vercel |

## 安全说明

- 密码在服务器端用 AES-256-GCM 加密后存入 KV，私钥存在 Vercel 环境变量 `ENCRYPTION_KEY` 中
- 主密码（`ACCESS_PASSWORD`）用于 Web 界面解锁，与加密密钥分开
- 传输过程依赖 HTTPS（Vercel 自动提供）
- 密钥丢失则无法解密已存储的密码，请妥善保管 `ENCRYPTION_KEY`
