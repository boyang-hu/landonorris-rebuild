# deploypages/ — 部署到 Cloudflare Pages（私密预览）

这个目录就是 Cloudflare Pages 的"上传包"：`build.mjs` 把仓库里已过全部门的 `src/dist` 变成 `site/`（Pages 专用的两处适配 + 响应头），`wrangler` 直接把 `site/` 传上去，**Cloudflare 那边不跑任何构建**。

| 文件 | 作用 |
|---|---|
| `build.mjs` | `../src/dist` → `site/`：① 给每个 `route/index.html` 配一份 `route.html`（Pages 对目录索引会 308 加尾斜杠，源站是无斜杠 200，taxi 每次换页都 fetch 那个 URL，这样两种写法都 200、零重定向）；② 拷入 `_headers`；③ 校验 Pages 限额（20,000 文件 / 单文件 25 MiB，本站 516 文件 / 38 MB） |
| `_headers` | 全站 `X-Robots-Tag: noindex` + HSTS + nosniff；`/ext/*`、`/assets/*` 长缓存 |
| `wrangler.toml` | 项目名 `landonorris-rebuild`，`pages_build_output_dir = "site"` |
| `package.json` | 钉死 `wrangler@4.125.0`，封装登录 / 建项目 / 部署命令 |
| `site/`（生成物，不进 git） | 上传目录 |

## 第一次部署（约 5 分钟，只有登录和 Access 策略需要你在浏览器点）

```bash
# 0. 在仓库根：构建最新的 src/dist（首次先 npm run assets:restore），再生成上传包
npm run pages:build            # = npm run build && node deploypages/build.mjs

cd deploypages
npm install                    # 装 wrangler（已钉版本）

# 1. 登录（会打开浏览器让你授权；完成后回到终端）
npm run login
npm run whoami                 # 确认账号/账户 ID

# 2. 建 Pages 项目（一次性；生产分支名随便，我们是直传，不关联 git）
npm run project:create

# 3. 部署：上传 site/ 到 production
npm run deploy
#    结尾会打印 https://landonorris-rebuild.pages.dev 与一个带 hash 的本次部署 URL
```

之后每次重新部署：仓库根 `npm run pages:build` → `cd deploypages && npm run deploy`。

## 部署后先验收，再上锁

Access 一旦打开，无头探针进不去，所以验收在上锁之前做（在仓库根执行）：

```bash
node scripts/skill/probe.mjs https://landonorris-rebuild.pages.dev/ --no-external --scroll 0.5 --wait 9000
node scripts/skill/probe.mjs https://landonorris-rebuild.pages.dev/on-track --mobile --no-external --walk 8
node scripts/skill/verify-offline.mjs --base https://landonorris-rebuild.pages.dev --routes /,/calendar,/on-track,/off-track,/partnerships,/legal/privacy-policy,/legal/terms-conditions,/nope-404
curl -sI https://landonorris-rebuild.pages.dev/calendar | head -3        # 期望 200，不是 308
curl -sI https://landonorris-rebuild.pages.dev/nope-404 | head -1        # 期望 404
curl -sI https://landonorris-rebuild.pages.dev/ | grep -i x-robots        # noindex
```

期望：首页 / 各页 `RESULT: CLEAN`、`external requests (0)`；legal 两页只剩登记过的 iubenda 残差（`www.iubenda.com` API + 一条 `https://ext/…badge.css` 畸形请求，REBUILD_PLAN 6.3/6.15）；静态面 `PASS — 0 static outbound problem(s)`。

## 上锁：Cloudflare Access（免费档 50 个用户）

Pages 的"私密"靠 Zero Trust 的 Access 策略，有两层：

1. **预览部署**（带 hash 的 `*.landonorris-rebuild.pages.dev`）：Cloudflare 控制台 → Workers & Pages → `landonorris-rebuild` → Settings → **Access policy** → Enable。这是一键开关，默认只放行你账户里的成员。
2. **生产域名**（`landonorris-rebuild.pages.dev` 以及你之后绑的自定义域）：Zero Trust 控制台 → Access → Applications → **Add an application** → Self-hosted：
   - Application domain：`landonorris-rebuild.pages.dev`（绑了自定义域就再加一条）
   - Policy：Action **Allow**，Include → **Emails** 填你和要分享的人的邮箱（或 Emails ending in 你的域名）；登录方式默认 One-time PIN（邮箱验证码）就够，不用接 Google
   - Session duration 按喜好（例如 1 week）

   保存后访问域名会先到 Cloudflare 的登录页，名单内的邮箱收验证码进入；不在名单的人看到的是 Access 拒绝页，搜索引擎也同样进不去。

要临时分享给新的人：只改 Access 策略里的邮箱名单，不用重新部署。

## 自定义域（可选）

Workers & Pages → 项目 → Custom domains → Set up a domain。`boyang.hu` 若 DNS 在 Cloudflare，一键加 CNAME；不在的话按提示在你的 DNS 加 `CNAME <子域> landonorris-rebuild.pages.dev`。加完把这个域名也加进上面的 Access application。

## 与现有 1Panel 预览的关系

`scripts/deploy.sh` 仍然部署到 V.PS（nginx，只有 noindex、无访问控制）。两边的字节来源都是同一份 `src/dist`，Pages 多的只有 `route.html` 副本与 `_headers`。
