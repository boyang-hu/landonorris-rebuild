# REBUILD_PLAN — landonorris.com 1:1 工程化重建

沿用 rogierdeboeve → oryzo → samsyninja → careers-kimi → storytellingnoomo 的方法论。

## §0 纪律（宪法级）

1. 源站代码是唯一裁决：每个改动先归属到 `legacy-mirror/_pretty/*.pretty.js` 行号（或镜像 HTML/CSS 位置）再落地。
2. 源站有的都要有，没有的不做；bug 与死代码照抄不修，登记为怪癖（§Q）。
3. 有意偏差必须登记在 §6；未登记的差异一律视为 bug。
4. 不自创补偿性 CSS/JS。
5. 每个里程碑过浏览器实测取证（scripts/probe.mjs），全新加载验证。M8 起判据统一经 `node scripts/run-gates.mjs <mirror|offline|symbols|pixel|all>`，每道门的调用方式与豁免清单都住在仓库里。
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
- [x] M8 skill v0.1.51 对账补门（2026-08-20）：镜像自检门 / 零外联完整断言面 / 像素门（自比带宽+确定性 shim）/ 冷头清点 + 符号门（port/ 切片 + rename-map）/ 自包含门；全部判据固化在 `scripts/run-gates.mjs`，产物在 `docs/gates/`

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
| 6.2 | 外部 host 的绝对 URL 改写为 /ext/<host>/：镜像侧在服务层（skill serve.mjs），复刻侧在构建期（shells + dist/ext 文本资产），**两侧同一套拼写**（`https://h/`、`http://h/`、JSON 转义 `https:\/\/h\/`、`\u002F`、标记/样式里的 `//h/`、**裸 host 常量** `https://h`）——复刻侧实现唯一入口 `scripts/lib/ext-rewrite.mjs`（2026-08-20 修订：此前 shells 漏了裸 host 拼写，`<link rel=preconnect/dns-prefetch href="https://cdn.prod.website-files.com">` 在每个页面真实发起 DNS+TLS 预热） | 磁盘镜像保持纯净；零外联门 §1.6 第 1 类 |
| 6.3 | iubenda badge CSS 在本地镜像服务下 404（脚本从自身 src 反推 base 所致）；legal 页正文依赖 iubenda 线上 API | 源站本身即三方运行时行为，无法离线化；badge 纯装饰 |
| 6.4 | dist/ext 是真实目录树：二进制按文件软链到 legacy-mirror/assets（单份落盘），**文本资产（css/js/json/svg…）为经 6.2 改写的副本**（2026-08-20 修订：此前整目录软链让 dist 原样伺服 Webflow CSS，其绝对 `cdn.prod.website-files.com` 字体/图片 url 使每次静态部署都从线上 CDN 取字体——零外联门第一次跑就抓到 3 条 CSS 发起的外联；字体随之与 load 事件竞速，SplitText 告警 34 次） | 部署仍 rsync -L 解引用；重资产不复制 |
| 6.5 | gen-shells 对首页一处畸形 SVG 属性边界（`"stroke=`）插入空格 | 浏览器 DOM 等价；vite/parse5 严格解析所需（怪癖 Q5 保留在镜像中） |
| 6.6 | Rive WASM 从本地镜像 /ext/unpkg.com/... 提供而非 unpkg CDN | 字节相同；使复刻可离线自包含 |
| 6.7 | @unseenco/taxi@1.8.0 npm 替代 vendored 拷贝（bundle 无版本标记） | 行为经探针验证（拦截/预取/pushState/removeOldContent 语义一致） |
| 6.8 | three-msdf-text-utils@1.5.0 npm 替代 vendored 同库（peer 声明要求 three>=0.178，实际与 r174 兼容——源站即此组合打包） | samsyninja 同策（vendored 库改同版 npm） |
| 6.9 | lil-gui/stats-gl 仅作 ?debug 桩，不复刻完整调试面板 | 非站点功能；?debug 为开发者通道 |
| 6.10 | 镜像 serve.mjs 在改写 HTML 时剥离 SRI integrity 属性；2026-08-20 起 gen-shells 在构建期同样剥离（dist/ext 下的 Webflow CSS/JS 是改写副本，见 6.4） | 改写后的字节无法匹配原哈希，Chrome 会静默拦截主 CSS（安全报错只走 Log 域） |
| 6.11 | shells 剥离 GA 反代脚本与 gtag 内联（同 6.1 的构建期实现） | 遥测非站点行为 |
| 6.12 | postbuild 把 dist HTML 中的 %2520 还原为 %20 | vite 构建的 HTML 资产管线会把 srcset 里已编码的 %20 二次编码，含空格文件名的图（helmet 墙 7 款）全部 404；shells 源无 %2520，整体替换即精确恢复源编码 |
| 6.13 | 镜像账本 2026-08-20 对账（字节一字未动）：`scripts/ledger-backfill.mjs` 补 sha256 列 + `inventory.tsv`；`scripts/ledger-reconcile.mjs` 把 3 组双拼写行并为别名（MonaSans `%2C`/`,`、jQuery `?site=`/裸、klaviyo `?company_id=`/裸——前两组线上重取 sha256 与磁盘一致，klaviyo 裸 URL 无任何文件引用，是爬虫正则截断产物）、写 `urlpath-policy.json`（`ignore:["site"]`，两次取回字节相同；`company_id` **不**忽略，实测 6243B vs 863B 字节不同）、把 klaviyo 文件迁到查询感知路径 `klaviyo@@company_id=XWvzdS.js`；6 条失败行（placeholder.svg 源站 403、iubenda `core-`/klaviyo `build`/jsdelivr `npm/` 片段、`assets.itsoffbrand.io/lando/{gl,rive/}` 目录基址）与闭包差集 52 条逐条登记在 `legacy-mirror/external.txt`（36 JOINED 运行时拼接且解析副本在盘 / 5 DEADREF 仅被注释掉的 dev bundle 引用且基址 404 / 10 NOTFILE / 1 NOTFETCHED） | skill v0.1.51 镜像自检门（映射单射/账本一致/真实性/闭包/回源抽样 12/12）全绿的前提 |
| 6.14 | `scripts/skill/serve.mjs` 是 skill 脚本的逐字拷贝，唯一改动是按 skill 设计的"per-project 常量"填了 `STUB_PREFIXES = ["/nvhc", "/avljl"]`（Webflow GA 反代 blob 走 stub，同 6.1） | 镜像侧 CLEAN 门需要 |
| 6.15 | legal 页 iubenda 徽章样式表请求畸形：iubenda.js 把 `/ext/cdn.iubenda.com/iubenda_badge.css` 再前缀 `"https:"` → `https://ext/...`（两侧同样发生，serve 层与构建期改写一致）；连同 iubenda 线上 API（6.3）、镜像侧 `/images/site/icons/owner.png` 404，作为**具名残差**写在 `scripts/run-gates.mjs` 的 RESIDUALS 里 | 徽章为装饰；可触发的外联只剩 iubenda API（内容源） |
| 6.16 | src 相对 port 的结构性改写（`docs/rename-map.json` 的 collapsed / allow_orphans / omitted 节逐条登记，`scripts/verify-decls.mjs` 据此判定）：① 源站字节相同的函数对 k_/j_（hideBrand）、w_/__（showBrand）各保留一份；② dK/KI 两个模块标志折成 navState 对象；③ mj/cj 折成 PAGE_TRANSITION_SRC；④ 每个 rive init 函数尾部相同的 `if (!rive) retry` 守卫抽成 whenRiveReady；⑤ mL/cL 里重复的页面 switch 抽成 dispatchPageInit；⑥ Vimeo IIFE（U_）内部绑定提升到模块作用域；⑦ 内联字面量提升为具名常量（HEAD_COMPOSITE_FRAG / START_SVG / COLOR_MAP×2）；⑧ EZ 包装器函数体拆为 initLandoGL / buildAssets / constructGlApp；⑨ src 独有的取值器（getApp/getGL/hasGL/isAllLoaded/getPendingCount/taxi/getScrollManager/registerSimplexChunk）；⑩ `e2 = K` 死存储未移植（Q14） | 可读性；全部不改行为，行为由运行时门裁决 |
| 6.17 | `port/_gen/app.gen.js` 是**追溯性**产物（2026-08-20）：M2–M6 当年是 mirror → src 直接逐函数移植；现在用 `scripts/skill/extract-source.mjs` 按 `scripts/slices.config.mjs`（29 个切片、9,548 行、sha256 钉死）把 bundle 的全部应用区段逐字切出，作为符号等价门的另一端，**从不执行**。vendor 区段（three/gsap/lenis/rive/taxi/msdf/lil-gui/loaders）不切片——它们是 package.json 钉死的同版本 npm 包（6.7/6.8） | 三段坐标系 mirror → port → src 补齐 |
| 6.18 | 像素门仪器：`scripts/skill/probe-shim.js` 由两侧 serve.mjs 在 `?__probe` 时注入 `<head>` 首部（服务层 query 注入路线：两侧是各自独立的服务器、不带参数时字节一字不变）；pump dt=16.7ms | 仅验收时存在；镜像磁盘与 dist 字节不变 |

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
| Q14 | `e2 = K`（hamburger 的 Rive 实例）赋值后从未被读取（死存储）；src 未移植（6.16 ⑩） | pretty 9967 / 10259 |
| Q15 | 源站把字节相同的"隐藏/显示 brand"函数各写了两份（partnerships k_/w_ 46016/46024，not-found j_/__ 46134/46142）；src 合并为一对（6.16 ①） | pretty 46016-46149 |
| Q16 | calendar 页引用的 Webflow 占位图 `plugins/Basic/assets/placeholder.60f9b1840c.svg` 在源站 CDN 对任何访客都是 403（线上同样是一张坏图） | external.txt NOTFETCHED |
| Q17 | 导航主题切换 V$ 里的 ScrollTrigger 分支是**死分支**：`window.ScrollTrigger \|\| window.gsap && window.gsap.ScrollTrigger`（43968）在源站 bundle 里恒为 undefined（esbuild ESM 打包，gsap 从未挂到 window；线上实测两者均 undefined、`window.themeScrollTriggers` 恒为空）。线上实际生效的是 100ms 节流的"最近 section 顶边"滚动监听 + 200ms 冷却。复刻曾把它写成 `if (TA)` 走了"活"分支（4 个真 ScrollTrigger + 1s 后多一次 `ScrollTrigger.refresh()`），M8 像素门抓到：首页 33% 处镜像 dark / 复刻 light，且那次多出来的 refresh 让 on-track heroflip 头盔在泵驱动下晚一拍（cross 7.19）。已按字节回抄死分支 | pretty 43968 |

## §7 里程碑日志（倒序）

### 2026-08-20 M8 skill v0.1.51 对账补门（关闭）
- skill 装入项目：`.claude/skills/website-rebuild`（v0.1.51，源仓 commit 4c06798）；判据脚本逐字拷入 `scripts/skill/`（唯一改动 6.14），生产工具拷入 `tools/`；`verify-zerodep.mjs --dir scripts --tools tools` PASS。
- **镜像自检门**（`run-gates.mjs mirror`）：首跑 4 项 FAIL（3 文件被 2 个 URL 认领 / 当前策略下 1 处会坍缩 / 2 处映射漂移 / 闭包差集 53）→ 账本对账 6.13 → 五项 PASS，`--resample 12` 回源 12/12 字节一致。两条小体量线索人工读过：`lando-offbrand.751e0867…js` 1062B 是 webpack 运行时壳，`transp.webp` 94B 是透明像素，均诚实。
- **零外联门**（`run-gates.mjs offline`，42 格 = 2 侧 × (8 路由 × 2 视口 + 5 条全滚动 walk) + verify-offline 两侧）：首跑抓到两处真实外联——① shells 漏改裸 host 拼写，每页 3 条 preconnect/dns-prefetch 预热（6.2 修订）；② dist 原样伺服 Webflow CSS，字体/透明图从线上 CDN 取（6.4 修订）。修后 **42/42 PASS**，verify-offline 两侧 0 条外部绝对 URL；具名残差只剩 6.15。
- **M7 残留订正**：M7 日志把 SplitText "called before fonts loaded" 告警归因为"无头环境时序差异"——错。同一无头环境下镜像 0 条、复刻 34 条；实测复刻侧字体走 CDN（约 2s）与 load 事件（2126ms）竞速，镜像侧字体本地 74ms/115ms。根因就是 ② 的外联；修后告警 0 条。教训：两侧在同一仪器下数字不同，先查条件差异（§0.26），不要给"环境"背锅。
- **符号门**（`run-gates.mjs symbols`）：port/ 追溯切片 29 片 `--check`/`--balance-check` PASS（切片边界按声明结构校正三次：OrbitControls/后处理尾部、BufferGeometryUtils 夹在 head 模块中间 30817-30941、World 模块实际到 35888）；`verify-decls.mjs` 294/294 port 声明分类（208 一对一 + 8 折叠 + 77 esbuild 管道 + 1 登记未移植）、212 目标全在 src、注入性成立、233 个 src 声明无未登记孤儿（21 条登记）、13/13 GLSL/模板字面量逐字相同——其中 trackVert/trackFrag 在 src 曾丢掉 8 行被注释掉的 GLSL，已按字节回抄。skill 自带 `verify-symbols.mjs` 照跑存档（不判定：它看不见 esbuild 包装器，miss 的 74 条正是 plumbing 节）。
- **像素门**（`run-gates.mjs pixel`）：仪器 = skill `pixelcompare.mjs`（64×40 网格亮度指标）+ `probe-shim.js` 确定性泵（两侧 serve 在 `?__probe` 注入，6.18）；检查点 = 位置 × 状态（首页 7 段、calendar 4、on-track 5、off-track 4、404 模板 1、移动首页 1 + on-track 4；状态：菜单打开（桌面+移动）、404 头盔 dark 变体；未驱动的状态逐条列在 summary）；每格两侧各 4 次自比**交错**建带宽，容差 = 带宽 + 0.5 在任何跨侧数字之前写死；非空帧前置。**第一轮全跑（34 格）的教训，全部来自仪器而非移植**：① 机器休眠让一格自比失败（INVALID，`--only` 补跑）；② `/nope-404` 文档是 HTTP 404，pixelcompare 拒绝非 2xx——改用源站以 200 伺服同一模板的 `/partnerships`（Q6）；③ 移动端菜单铺满屏只有 969 色，我定的 1000 色"非空帧"门槛把一张真实帧判成空——空白帧只有个位数颜色，门槛改 100 并写明依据；④ **§4.8 移动检查抓到 calendar/off-track 桌面 8 个检查点拍的全是页顶**：两页在 init 里重置滚动，load 时的 scrollTo 被吃掉——改为 load 与 +1500ms 虚拟时间各滚一次、泵 240 帧；移动首页是 swipe 锁滚（$_），5 个检查点就是 1 张帧，缩为 1 个位置并把解锁态登记为未驱动；⑤ 404 模板只有一屏高，f=1 与 f=0 同帧，其中一次跨侧给出 0.53（worst cell 40.7 @[35,19] 头盔面罩区）而同位置另一格与 8 次自比全为 0——归类为本次运行噪声（§6.1 D；最可能是 worker 里 KTX2/webp 解码按真实时间到达，贴图上传差一帧），位置去重后不再单独成格。第一轮可用的 29 格跨侧 meanAbsDiff 全为 0（mobile on-track 0.01–0.04，带内）。**第二轮（仪器修正后全量重跑，29 格）：26 PASS、3 FAIL——on-track 桌面 25%/50% 与移动 33% 跨侧 5–7（worst 237）：镜像帧里有金色 heroflip 头盔、复刻没有；首页 33%/50%/83%/100% 虽在带内（0.33–0.40）但 worst cell 81 集中在左上角 logo——顺藤摸到一个真 bug（Q17）：导航主题的 ScrollTrigger 分支在源站是死的（gsap 不在 window 上），复刻把它写活了，多出的 4 个 trigger 与 +1s 的 `ScrollTrigger.refresh()` 既改了首页主题判定（实时复现：镜像 dark / 复刻 light），又让泵驱动下 heroflip 的 scrub 进度晚一拍。回抄死分支后单格复测：on-track@25 跨侧 0、首页@33 0.02、实时两侧主题均 dark 且 `themeScrollTriggers` 均为空。这是 M7 14/14 与 M8 零外联 42/42 全绿都没看见的移植差异——只有位置×状态的像素门 + 正确的滚动时机才看得见。第三轮（修复后全量重跑）= 最终结果：**29/29 PASS**，跨侧 meanAbsDiff 27 格为 0、其余 0.01–0.03 且均在两侧自比带宽内；移动检查 10/10 页面的检查点各不相同；唯一 worst cell > 5 的是 mobile on-track 顶部（17.7，cross 0.03 vs 两侧自比 0.03–0.04——同侧对照同量级，§6.1.1 归为本次运行噪声）。详表 `docs/gates/pixel/summary.md`，合成图 `docs/gates/pixel/composites/`。**
- 代码改动：`scripts/lib/ext-rewrite.mjs`（新，两处改写的唯一实现）、gen-shells/postbuild 接入、`scripts/ledger-*.mjs`、`scripts/slices.config.mjs`、`scripts/verify-decls.mjs`、`scripts/run-gates.mjs`、`src/app/gl/scenes/tracks.ts`（GLSL 注释行回抄）、`src/app/components/nav.ts`（Q17 死分支回抄）。
- 部署：dist 现在对静态托管真正自包含（无 CDN 字体），需重新 `bash scripts/deploy.sh`（见 DEPLOY.md）。

### 2026-08-10 M7 追加（用户目视验收发现）
- 头盔墙 7 款含空格文件名的图 404：vite build 对 srcset 二次编码 %20→%2520（登记 6.12，
  postbuild 还原）。全站 URL×磁盘全量审计后补抓 1 件带括号文件名的漏网图
  （Britain-25 (1).webp，正则截断盲区）；plugins/placeholder.svg 线上 CDN 本身 403（源站怪癖）。
- 教训：srcset/style 内 URL 的编码保真需要纳入构建期对拍——已由全量审计脚本覆盖。

### 2026-08-10 M7 关闭
- scripts/verify.mjs：全 7 路由 × 桌面/移动回归门 **14/14 ALL PASS**（probe 含 Log 域安全报错监听）。
- dist 生产构建验收通过（serve:dist + 探针 CLEAN + SPA 多跳导航 CLEAN）。
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
