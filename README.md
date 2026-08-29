# 张暖阳 · Product Manager Portfolio

一个使用 Three.js 与 GSAP 构建的互动式产品经理作品集。通过三扇可交互柜门进入简历、五个完整项目、实习作品与联系方式。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

## 直接部署

### 方案 A：Vercel（推荐，包含真实水粉生图）

1. 将项目上传到 GitHub，在 Vercel 中导入该仓库。
2. 在 Vercel 项目 **Settings → Environment Variables** 中添加 `OPENAI_API_KEY`。
3. 可选：添加 `ALLOWED_ORIGIN`，值为你的正式站点域名。
4. 点击部署。Vercel 会同时构建 Vite 前端和 `api/generate-gouache.js` 安全服务端接口。

API Key 只保存在服务端环境变量中，不会进入浏览器代码或部署包。

### 方案 B：GitHub Pages（纯静态）

1. 在 GitHub 创建一个空仓库，默认分支使用 `main`。
2. 解压 `zhang-nuanyang-portfolio-deploy.zip`，把解压后的文件推送到仓库根目录。不要把 ZIP 文件本身当作网站源码上传。
3. 打开仓库的 **Settings → Pages**。
4. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
5. 推送到 `main` 后，工作流 `Deploy portfolio to GitHub Pages` 会自动构建并发布。

站点使用相对构建基址，因此仓库名可以自由设置，无需修改资源路径。

GitHub Pages 本身不能安全保存 API Key。如需在 GitHub Pages 中启用真实生图，请先部署 Vercel 接口，再在 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables** 中新建 `VITE_IMAGE_API_URL`：

```bash
VITE_IMAGE_API_URL=https://你的-vercel-域名.vercel.app/api/generate-gouache
```

未配置在线接口时，画板会自动切换到本地水粉质感引擎，页面其余功能不受影响。

### GitHub 上传注意事项

- 请上传完整源码包中的内容，确认仓库根目录能直接看到 `package.json`、`index.html`、`vite.config.js` 和 `.github`，不要再多套一层文件夹。
- `node_modules`、`dist`、`.env`、`.tools` 和 `release` 不需要提交；这些目录已写入 `.gitignore`。
- GitHub 网页端单文件限制为 25 MiB，而本项目的 VR 视频约 31 MB，因此请使用 GitHub Desktop 或 Git 命令行提交解压后的源码；普通 Git 仓库中的单个文件仍须小于 100 MiB。两个发布 ZIP 都超过 100 MB，只用于下载、解压和交付，不要直接提交进仓库。
- 不要把 `OPENAI_API_KEY` 写进源码、`.env.example` 或 GitHub 仓库。密钥只放在 Vercel 的 Environment Variables 中。
- 上传后在 **Actions** 页面等待绿色对勾；若部署失败，先检查仓库默认分支是否为 `main`，以及 **Settings → Pages → Source** 是否为 **GitHub Actions**。
- 更新素材后需要重新提交并等待工作流完成；浏览器仍显示旧版时可强制刷新或等待 GitHub Pages CDN 更新。

## 项目结构

- `src/main.js`：Three.js 场景、柜门和物件交互、GSAP 动画
- `src/styles.css`：页面与项目详情样式
- `public/assets`：简历和项目贴纸素材
- `public/project-pages`：五个项目的完整展示图片
- `public/assets/videos`：昆曲演示与灵馥 VR 概念视频（Web 优化、支持流式播放）
- `public/assets/internship`：信箱中的六份校园网页设计
- `api/generate-gouache.js`：GPT Image 2 水粉优化服务端接口
- `.github/workflows/deploy-pages.yml`：GitHub Pages 自动部署
- `vercel.json`：Vercel 一键部署配置
