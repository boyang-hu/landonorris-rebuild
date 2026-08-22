# DEPLOY — 私有预览部署说明

**结论先行：本项目不公开部署。** F1/McLaren/人物肖像/商标/字体等素材均不可再分发；
替换素材则背离 1:1 复刻目的。与五个前作同策：私有仓库 + 本地/私有预览。

## 本地运行

```bash
npm install --legacy-peer-deps   # three-msdf-text-utils 的 peer 声明过严（偏差 6.8）

# 复刻站 src/（自包含包）
npm run assets:restore           # 第一次：把 mirror/assets 复制进 src/public/ext（盘上 35MB，git 不收）
npm run dev                      # = npm --prefix src run dev → http://localhost:5180
npm run build                    # = src:shells（skill build-site 生成 src/site）+ src 内 vite build → src/dist（自包含，资产是真实文件）
npm run src:serve                # skill serve.mjs --root src/dist（22002，像 nginx 一样原样伺服）

# 逐字移植 port/
npm run port:build               # esbuild 别名前奏 + build-site 外壳 → port/site
npm run port:serve               # serve.mjs --root port/site --fallback-root mirror（资产不复制）

# 源站镜像（对拍基准）
npm run serve:mirror             # 22001
```

## 验证（M8 起）

```bash
npm run gates                    # 四道门全跑（像素门约 90 分钟，跑时别并行别的浏览器门）
npm run gate:mirror              # 镜像自检（加 -- --resample 12 做回源抽样）
npm run gate:offline             # CLEAN + 零外联，两侧 × 路由 × 视口 + 全滚动 walk
npm run gate:symbols             # port/ 切片在位 + 声明对账
npm run gate:pixel               # 自比带宽 + 跨侧像素对拍
node scripts/skill/probe.mjs <url> --no-external --shot out.png --scroll 0.5   # 单页探针
node scripts/skill/verify-offline.mjs --base https://landonorris-rebuild.boyang.hu --routes /,/calendar  # 线上静态面
```
产物与判据说明见 `docs/gates/README.md`。旧的 `scripts/verify.mjs` 仍可用（它走项目自己的 serve/probe）。

## 当前部署（2026-08-22 起：Cloudflare Pages）

- 预览地址：**https://landonorris-rebuild.boyang.hu**（Pages 自定义域，`boyang.hu` 的 DNS 在 Cloudflare，CNAME 由 Pages 自动写入；`landonorris-rebuild.pages.dev` 为同一部署）
- 重新部署：仓库根 `npm run pages:build` → `cd deploypages && npm run deploy`（直传 `deploypages/site`，Cloudflare 侧不构建；详见 `deploypages/README.md`）
- 响应层：`deploypages/_headers`（noindex / HSTS / nosniff / `/ext` `/assets` 长缓存）；`/calendar` 与 `/calendar/` 都 200（`route.html` 副本消掉了 Pages 的目录索引 308）；未知路径 404 + 源站模板
- 访问控制：Cloudflare Access（Zero Trust）按主机名生效——**自定义域要单独加进 Access application**，否则只有 noindex 没有锁
- 2026-08-22 线上验收：首页 / calendar 桌面全滚动 / on-track 移动全滚动 CLEAN、0 外联、0 SplitText 告警；legal 页只剩登记的 iubenda 残差（6.3/6.15）；静态面 0 条外部 URL

### 历史：1Panel 静态站（2026-08-11 → 2026-08-22，已下线）

曾部署在 V.PS 1Panel（`/opt/1panel/1panel/www/sites/landonorris-rebuild/index`，nginx 配置 `/opt/1panel/1panel/www/conf.d/landonorris-rebuild.conf`）。DNS 已改指 Pages，该站点目录与 nginx 配置未删除（可在 1Panel 里删站点）。下面的 1Panel 配置说明保留作参考。

## Cloudflare Pages 私密预览（推荐的"真私密"方案）

`deploypages/` 是完整的上传包与操作说明（`deploypages/README.md`）：`npm run pages:build` 生成 `deploypages/site/`，`cd deploypages && npm run deploy` 直传；上锁靠 Cloudflare Access（免费档 50 用户，邮箱验证码），URL 泄露出去也没人能看。Pages 专用适配只有两处：`route.html` 副本（消掉目录索引的 308）与 `_headers`。

## 1Panel 部署（选「静态网站」，不是 Node.js）

站点是纯静态产物：无 SSR、无 API、无服务端逻辑（serve.mjs 仅本地开发用）。
1Panel 走 **网站 → 创建网站 → 静态网站**，与 careers-kimi/samsyninja 前作同策。

### 步骤

1. 本地构建并上传（`-L` 必须——dist/ext 是指向 mirror/assets 的软链，要解引用成真实文件，共约 40MB）：

   ```bash
   npm run build
   rsync -avzL dist/ user@server:/opt/1panel/apps/openresty/openresty/www/sites/<站点名>/index/
   ```

2. 1Panel 网站设置里建议开 **Basic Auth（密码访问）** 与 HTTPS。

3. 进入该站点的 **配置文件** 追加（server 块内）：

   ```nginx
   # 干净 URL：/calendar -> /calendar/index.html；未知路径 -> 404 模板（Webflow 语义）
   location / {
     try_files $uri $uri/index.html =404;
   }
   error_page 404 /404.html;

   # GL/Rive 资产 MIME（nginx 默认表可能缺这几项）
   types {
     model/gltf-binary glb;
     application/wasm  wasm;
   }
   location ~* \.(riv|hdr|basis|ktx2)$ { default_type application/octet-stream; }

   # 私有预览：全站禁抓
   add_header X-Robots-Tag "noindex, nofollow" always;

   # 重资产长缓存（可选）
   location /ext/ { expires 30d; add_header Cache-Control "public, immutable"; }
   ```

4. 验收：浏览器打开域名根（站点必须挂在根路径，资产全部以 `/ext/...` 绝对路径引用，
   子路径部署会全挂）；或本地跑 `node scripts/verify.mjs --origin https://<域名>`。

### 常见坑

- **忘了 `-L`**：ext 上传成一个悬空软链，所有图片/模型 404。
- **子路径部署**：不支持，必须域名根（可用子域名）。
- **404 语义**：`try_files ... =404` + `error_page` 二者都要，未知路径才会返回
  404 状态码 + 404 模板页（与源站一致；SPA 路由是 taxi 客户端接管的，不需要
  把所有路径 rewrite 到 index.html——那是错误配法）。

### 已知外部运行时依赖（无法离线化，见偏差 6.3 / 6.15）

legal 页正文来自 iubenda 线上 API（`www.iubenda.com`，零外联门里唯一具名放行的外部 host）；
同页 iubenda 徽章样式表请求被 iubenda.js 自己拼成 `https://ext/...`（两侧一致，徽章装饰）。
home/off-track 的 Vimeo 流按需加载 player.vimeo.com（源站行为一致，且 init 在源站 bundle
中本就无调用点——见 04-dom-components.md）。服务器可出公网时功能才完整，纯内网也只影响这两处。

## 断点与设备注意

- 992px 是行为断点：跨越会整页 reload（源站行为）；>991 桌面组件与 webp 纹理，
  ≤991 移动组件与 ktx2 纹理。
- WebGL2 不可用的浏览器：html 加 `gl-fallback` class，GL 场景不渲染（源站行为）。
