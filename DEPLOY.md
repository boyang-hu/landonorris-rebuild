# DEPLOY — 私有预览部署说明

**结论先行：本项目不公开部署。** F1/McLaren/人物肖像/商标/字体等素材均不可再分发；
替换素材则背离 1:1 复刻目的。与五个前作同策：私有仓库 + 本地/私有预览。

## 本地运行

```bash
npm install --legacy-peer-deps   # three-msdf-text-utils 的 peer 声明过严（偏差 6.8）

# 复刻站（dev）
npm run dev                      # http://localhost:5180（vite 默认端口随配置）

# 源站镜像（对拍基准）
npm run serve:mirror             # http://localhost:5177

# 生产构建 + 本地验收
npm run build                    # dist/（含 ext -> legacy-mirror/assets 软链）
npm run serve:dist               # http://localhost:5178
```

## 验证

```bash
node scripts/verify.mjs                          # 全 7 路由 × 桌面/移动 回归门
node scripts/verify.mjs --origin http://localhost:5178   # 验 dist
node scripts/probe.mjs <url> --shot out.png --scroll 0.5 # 单页探针
```

## 若需私有服务器预览（1Panel/nginx 参考）

1. `npm run build` 后 `rsync -avL dist/ server:/path/`（`-L` 解引用 ext 软链，约 37MB）。
2. nginx 要点：
   - 未知路径回落 `404.html` 并返回 404 状态（Webflow 语义）；
   - `location /` 下干净 URL → `$uri/index.html`；
   - MIME 补充：`.riv`/`.hdr` → `application/octet-stream`，`.glb` → `model/gltf-binary`，
     `.wasm` → `application/wasm`（KTX2/DRACO 解码器与 Rive 依赖正确 MIME）；
   - `add_header X-Robots-Tag "noindex, nofollow";` 全站；
   - 建议 Basic Auth 门。
3. 已知外部运行时依赖（无法离线化，见偏差 6.3）：legal 页正文来自 iubenda 线上 API；
   home/off-track 的 Vimeo 流按需加载 player.vimeo.com（源站行为一致，且 init 在源站
   bundle 中本就无调用点——见 04-dom-components.md）。

## 断点与设备注意

- 992px 是行为断点：跨越会整页 reload（源站行为）；>991 桌面组件与 webp 纹理，
  ≤991 移动组件与 ktx2 纹理。
- WebGL2 不可用的浏览器：html 加 `gl-fallback` class，GL 场景不渲染（源站行为）。
