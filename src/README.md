# src/ — 可读工程（阶段 ③：人写的、自包含的源码）

这是 landonorris.com 学习复刻的**可读源码层**，是三段坐标系 `mirror/ → port/ → src/` 的最后一段：

- `../mirror/` 是只读证据（源站字节），`../mirror/_pretty/lando.OFF+BRAND.gold-android-fix-03.js` 的**行号**是全项目唯一溯源坐标；
- `../port/_gen/app.gen.js` 是按行号逐字切出的、能运行的移植（机器读）；
- **这里**是按 `port/` 重写的 TypeScript：拆了模块、起了名字、写了注释。`../docs/rename-map.json` 把这里的每个顶层声明指回 `port/` 的压缩名（一对一 / 折叠 / esbuild 管道 / 孤儿逐条登记），`../scripts/verify-decls.mjs` 守着它。

**在这里发现行为不对，答案在 `port/` 或 `mirror/`，不在这里。** 就地"改到对"会把移植 bug 变成无法追溯的本地补丁。

## 怎么跑

```bash
npm install          # .npmrc 已设 legacy-peer-deps（three-msdf-text-utils 的 peer 声明过严，偏差 6.8）
npm run dev          # http://localhost:5180 — 干净 URL 映射到 site/ 下的外壳，未知路径回落 404 模板
npm run build        # vite build + postbuild.mjs -> dist/（自包含：外壳 + 应用 + public/ 下的全部资产）
npm run typecheck
```

自包含契约：把本目录整个复制到任何地方，`npm install --offline && npm run build` 就能出一份完整的站（`../scripts/skill/verify-standalone.mjs --src src --full` 每次收口都这样真跑一遍）。

## 目录

| 路径 | 是什么 |
|---|---|
| `app/` | 应用层源码（`main.ts` 启动链；`lifecycle.ts`/`router.ts` taxi 生命周期；`components/` data-* 组件；`pages/` 各页 init/cleanup；`rive/` Rive 预载与组件；`gl/` Three 引擎：core / scenes×6 / fluid / noise / world） |
| `site/` | 页面外壳（**生成物，已提交**）：`../scripts/skill/build-site.mjs --config ../scripts/shell-config.src.mjs` 从镜像按登记变换表生成（T-LOCALIZE / T-GA / T-ENTRY / T-SRI / T-SVG / T-NOINDEX），`verify-shell.mjs` 逐 hunk 回放。提交它是为了让本目录不依赖镜像就能构建 |
| `public/ext/<host>/…` | 源站资产（**盘上有、git 里没有**，35 MB）：`../mirror/assets` 的字节副本，文本资产经与外壳同一套本地化改写；账本 `ASSETS.md`。缺了就在仓库根跑 `npm run assets:restore` |
| `public/images/` | iubenda 徽章图标（徽章脚本按页面源解析 `/images/site/…`，偏差 6.3） |
| `ASSETS.md` | 资产账本（路径 / 字节 / 镜像 sha256 / 盘上 sha256 / 是否改写） |
| `vite.config.ts` `postbuild.mjs` | 构建：MPA 八页；postbuild 把 `dist/site/*` 提到 `dist/*` 并还原 vite 二次编码的 `%2520`（偏差 6.12） |

## 坐标系怎么读

每个文件头与每个顶层声明上方的注释都带 **pretty 行号**，形如 `/** mL 46166 — first load */`：`mL` 是 `port/` 里的压缩名，`46166` 是 `mirror/_pretty/lando.OFF+BRAND.gold-android-fix-03.js` 的行。行号区间写作 `41539-41680`。GLSL 字符串是逐字的（`verify-decls.mjs` 第 5 项逐字比对）。

## 注释三档（readable-source.md §5）

| 档 | 写法 | 含义 | 数量（2026-08-21 普查） |
|---|---|---|---|
| 事实 | 带 pretty 行号 / 压缩名的注释 | 从源码读出的事实，可按行号核对 | 195 条 |
| 复刻注记 | 提到 `deviation 6.x` / `quirk Qn` / `parity` / `stub` 的注释 | 我们的决定：为什么与源站不同、哪条怪癖被照抄 | 17 条 |
| 推测 | 以 `?` 开头（`// ? …`） | 对意图的猜测，不是源码事实 | **0 条**——当前没有任何推测性注释；新增推测必须用此前缀 |

命名依据见 `../docs/rename-map.json` 的 `evidence` 节（每个名字的证据档位）与 `../docs/rename-review.md`（人工抽查）。结构性改写（源站重复函数合并、IIFE 内部绑定提升、字面量提升为常量等）逐条登记在 `../REBUILD_PLAN.md` §6.16。

## 外部运行时依赖

legal 两页正文来自 iubenda 线上 API（6.3）；Vimeo 播放器按需从 player.vimeo.com 加载（源站行为，且 bundle 中本无调用点）。其余全部离线：`../scripts/run-gates.mjs offline` 两侧 × 8 路由 × 2 视口零外联。
