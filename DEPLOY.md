# DEPLOY — 私有预览部署说明

**结论先行：本项目不公开部署。** F1/McLaren/人物肖像/商标/字体等素材均不可再分发；
替换素材则背离 1:1 复刻目的。与五个前作同策：私有仓库 + 本地/私有预览。

## 本地运行

```bash
npm install --legacy-peer-deps   # three-msdf-text-utils 的 peer 声明过严（偏差 6.8）

# 复刻站（dev）
npm run dev                      # http://localhost:5180（需先 npm run shells 生成外壳）

# 源站镜像（对拍基准）
npm run serve:mirror             # skill serve.mjs，端口由 lib/ports.mjs 分配（本机 22001）

# 生产构建 + 本地验收
npm run build                    # shells → vite → postbuild；dist/ext 物化（二进制软链 + 改写的文本资产）
npm run serve:dist               # 22002；dist 像 nginx 一样被原样伺服（无 ext 改写）
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

## 当前部署（2026-08-11）

- 预览地址：**https://landonorris-rebuild.boyang.hu**（noindex + HSTS）
- 服务器：V.PS 1Panel 静态站（与前作同机同约定）；站点目录
  `/opt/1panel/1panel/www/sites/landonorris-rebuild/index`（owner boyang，可直接 rsync）；
  nginx 配置 `/opt/1panel/1panel/www/conf.d/landonorris-rebuild.conf`（root 所有，
  改动经 ~/deploy-staging 暂存 + sudo cp + 容器内 nginx -t && reload）
- 重新部署：本地 `bash scripts/deploy.sh`（gitignored，含主机/端口/密钥约定；内部 `npm run build` + `rsync -avzL --delete`）
- 2026-08-20 起 dist 对静态托管**真正零外联**：Webflow CSS 里的字体/图片 url 与 preconnect 裸 host 都被改写到 /ext/（REBUILD_PLAN 6.2/6.4 修订）。此前线上版本每次加载都从 cdn.prod.website-files.com 取字体——要重新部署一次。
- 已知轻微偏差：/partnerships 线上源站返回 404 状态（页面已下架），我们因镜像落盘了
  该路径的 404 变体文件而返回 200——内容相同（not-found 模板），仅状态码不同

## 1Panel 部署（选「静态网站」，不是 Node.js）

站点是纯静态产物：无 SSR、无 API、无服务端逻辑（serve.mjs 仅本地开发用）。
1Panel 走 **网站 → 创建网站 → 静态网站**，与 careers-kimi/samsyninja 前作同策。

### 步骤

1. 本地构建并上传（`-L` 必须——dist/ext 是指向 legacy-mirror/assets 的软链，要解引用成真实文件，共约 40MB）：

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
