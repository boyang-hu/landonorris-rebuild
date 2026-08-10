# REBUILD_PLAN — landonorris.com 1:1 工程化重建

沿用 rogierdeboeve → oryzo → samsyninja → careers-kimi → storytellingnoomo 的方法论。

## §0 纪律（宪法级）

1. 源站代码是唯一裁决：每个改动先归属到 `legacy-mirror/_pretty/*.pretty.js` 行号（或镜像 HTML/CSS 位置）再落地。
2. 源站有的都要有，没有的不做；bug 与死代码照抄不修，登记为怪癖（§Q）。
3. 有意偏差必须登记在 §6；未登记的差异一律视为 bug。
4. 不自创补偿性 CSS/JS。
5. 每个里程碑过浏览器实测取证（scripts/probe.mjs），全新加载验证。
6. 代码与文档同一次提交。

## §1 里程碑

- [x] M0 镜像（508 文件 37MB，见 README）
- [x] M0.5 镜像本地断网跑通（serve.mjs + probe.mjs，7 页 + 404 全 CLEAN）
- [x] M1 逆向主 bundle → docs/engine-notes/（6 份行号取证笔记）
- [x] M2 工程骨架（Vite + 钉死依赖 + 页面外壳流水线）
- [x] M3 站点 chrome 层（Lenis/导航/SplitText/marquee/全部 data-* 组件）
- [x] M4 Rive 层（8 riv + 页面过渡 + taxi 路由）
- [x] M5 Three GL 层（六场景 + 流体/噪声/idle + bloom 链）
- [x] M6 各页专属逻辑（calendar 同步/404 切换器/heroflip）
- [x] M7 三重验证 + 收尾（verify.mjs 全路由×双端门 + 真机对拍）

## §2 源站技术栈（Phase 0 结论，详见 README；M1 后补充行号）

Webflow（静态导出 + jQuery 3.5.1 + webflow.js，未用 IX2）+ OFF+BRAND 自定义 bundle
`lando.OFF+BRAND.gold-android-fix-03.js`（1.3MB min → `_pretty/` 47,120 行）：
Three r174 / GSAP 3.13.0（ScrollTrigger/SplitText/Observer/MotionPath）/ Lenis 1.1.20 /
@rive-app/canvas-lite 2.26.4。

## §5 难度评级

总评 ★★★☆☆（3/5），careers-kimi 同档。分项见 README。

## §6 有意偏差登记

| # | 偏差 | 理由 |
|---|---|---|
| 6.1 | GA/Webflow 反代 blob（/nvhc*、/avljl*）不复刻，本地 serve 返回 stub | 遥测非站点行为；私有部署不应上报 |
| 6.2 | 镜像服务层把外部 host 改写为 /ext/<host>/ 路径 | 磁盘镜像保持纯净；仅服务层行为 |
| 6.3 | iubenda badge CSS 在本地镜像服务下 404（脚本从自身 src 反推 base 所致）；legal 页正文依赖 iubenda 线上 API | 源站本身即三方运行时行为，无法离线化；badge 纯装饰 |
| 6.4 | dist/ext 为指向 legacy-mirror/assets 的符号链接，重资产不复制入 dist | careers-kimi 同策；部署时 rsync -L 解引用 |
| 6.5 | gen-shells 对首页一处畸形 SVG 属性边界（`"stroke=`）插入空格 | 浏览器 DOM 等价；vite/parse5 严格解析所需（怪癖 Q5 保留在镜像中） |
| 6.6 | Rive WASM 从本地镜像 /ext/unpkg.com/... 提供而非 unpkg CDN | 字节相同；使复刻可离线自包含 |
| 6.7 | @unseenco/taxi@1.8.0 npm 替代 vendored 拷贝（bundle 无版本标记） | 行为经探针验证（拦截/预取/pushState/removeOldContent 语义一致） |
| 6.8 | three-msdf-text-utils@1.5.0 npm 替代 vendored 同库（peer 声明要求 three>=0.178，实际与 r174 兼容——源站即此组合打包） | samsyninja 同策（vendored 库改同版 npm） |
| 6.9 | lil-gui/stats-gl 仅作 ?debug 桩，不复刻完整调试面板 | 非站点功能；?debug 为开发者通道 |
| 6.10 | 镜像 serve.mjs 在改写 HTML 时剥离 SRI integrity 属性 | 改写后的字节无法匹配原哈希，Chrome 会静默拦截主 CSS（本地服务层行为，镜像磁盘文件保持原样） |
| 6.11 | shells 剥离 GA 反代脚本与 gtag 内联（同 6.1 的构建期实现） | 遥测非站点行为 |

## §Q 怪癖登记（源站 bug/死代码，照抄不修）

| # | 现象 | 证据 |
|---|---|---|
| Q1 | HTML head 内保留大量注释掉的历史脚本（localhost:6645、Klaviyo、iubenda banner、旧版 bundle 列表） | index.html head 注释块 |
| Q2 | `--nav-height: calc(3.75rem (var(--gap) * 2))` 缺少运算符，非法 calc | index.html 内联 `<style>` css-root |
| Q3 | 已停用的 transitions-rive-isolate.js 仍部署在 assets.itsoffbrand.io（HTML 中注释引用） | index.html 注释块 |
| Q4 | riv 资产在 lando.itsoffbrand.io/rive/ 与 assets.itsoffbrand.io/lando/rive/ 双份部署，page-transition 用前者、其余 7 个用后者 | pretty 10258/41743 |
| Q5 | 首页一处 SVG `"stroke=` 属性间缺空格（畸形 HTML，浏览器容错） | index.html L1202 |
| Q6 | 线上 /partnerships 已下架（返回 404 模板），但 nav/footer 链接仍在（带 display-none 类） | 线上实测 + 镜像 md5 与 404.html 相同 |
| Q7 | dR() 的断点三元两分支同值 "body"；QV.createLenisInstance 两分支配置相同 | pretty 9408/47034 |
| Q8 | 死代码/无效引用：canvas 参数 "canvas.gl" 未使用、textures.helmet.mask 无 manifest 条目、models.sotd/head 声明不加载、window.riveInstances 只读未建、reveal 恒 1（REVEAL 通道退化）、helmetScroll setOrbitControls 引用未定义符号、iridescence 设在 StandardMaterial 上无效 | pretty 41447/31166/41627/44123/31531/34346/31324 |
| Q9 | 4 参 timeline.to() 调用（第 4 参被 GSAP 忽略）；yL 清理时重建 _L 再立即 cleanup；b\$ 里 j\$(debug=!1) 隐式全局赋值 | pretty 44230/45812/46113 |
| Q10 | heroflip 第二段贝塞尔把 bounds.height 写成宽度（正方形平面） | pretty 45700 |
| Q11 | isDebug 时 shadow.default 被重复加载一次 | pretty 41360 |
| Q12 | 桌面用 webp / ≤991px 用 ktx2 纹理（分叉在 innerWidth，非 UA） | pretty 41538/41296 |
| Q13 | World.destroy 的 traverse 里 `scene.remove(Q.name)` 传字符串（three 中为 no-op）——该"bug"是承重的：真删除会破坏遍历。复刻曾"修好"导致转场崩溃，已按怪癖回抄 | pretty 35740 |

## §7 里程碑日志（倒序）

### 2026-08-10 M7 关闭
- scripts/verify.mjs：全 7 路由 × 桌面/移动回归门（probe 含 Log 域安全报错监听）。
- 真机 Chrome 三方对拍：线上 = 镜像（SRI 修复后）= 复刻，首页 hero 视觉一致。
- 修复：镜像 serve.mjs SRI 剥离（6.10）——此前镜像 CSS 被 Chrome 静默拦截，
  探针未见（安全报错走 Log.entryAdded），M0.5 的"CLEAN"存在盲区，已补监听。
- 已知残留：无头环境下 SplitText "fonts loaded" 警告（时序差异，字体就绪后重切分
  由源站同款 revert/re-split 兜底）；wireframe 扫描层浓淡与源站有细微差（uTime 相位）。

### 2026-08-10 M5/M6 关闭
- GL 引擎全量移植（六场景 + 流体六 pass + 噪声场 + idle + MSDF + bloom）：
  home hero（头像位移视差 + 头盔线框扫描 + 合成 shader）、calendar 3D 赛道
  （荧光墙带 + UnrealBloom 1.5/0.5/0.25 + DOM 打点 + sprint 标签 + 当前站自动选中）、
  on-track heroflip 金头盔、404 轨道头盔 + 双 4。GLSL 全部逐字提取。
- 验收：全页面探针 CLEAN；截图见 docs/compare/。

### 2026-08-10 M3/M4 关闭
- DOM chrome 层 + Rive 层 + taxi 生命周期全量移植（~30 个 data-* 组件、
  8 riv 接线、页面过渡、SPA 导航实测 /→/calendar 转场完成）。
- 全部函数带 pretty 行号溯源注释；源站怪癖照抄（Q7-Q10）。

### 2026-08-10 M2 关闭
- Vite 骨架 + 钉死依赖 + shells 流水线（4 项登记变换）+ dist 构建全通。

### 2026-08-10 M1 关闭
- 六份逆向笔记（docs/engine-notes/00-05）：boot/taxi、Rive、GL core、GL scenes、
  DOM 组件、Webflow+HTML 契约；bundle 全区段地图；所有结论带行号。

### 2026-08-10 M0.5 关闭
- scripts/serve.mjs：零依赖静态服务器，/ext/<host>/ 响应层映射（磁盘镜像纯净）；
  GA 反代 stub；iubenda 图标目录映射；404 走源站 404.html 模板（HTTP 404 状态）。
- scripts/probe.mjs：零依赖 CDP 无头探针（console/pageerror/网络失败 + 截图 + eval + scroll）。
- 实跑补录（静态解析盲区，方法论预期内）：head/helmet/glass 全套 PBR 纹理 13 件
  （disco/gold 变体在 bundle 里由纹理集拼接，正则不可见）、riv ×7 的 assets.itsoffbrand.io
  运行时副本、iubenda owner.png。
- 验收：7 页 + 404 探针全 CLEAN（首页含全滚动）；唯一残留 iubenda badge css（§6.3）。

### 2026-08-10 M0 关闭
- 见 README（镜像方式、防盗链、动态资产求解）。
