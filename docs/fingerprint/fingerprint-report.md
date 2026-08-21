# fingerprint report — https://landonorris.com/

- 探测时间：2026-08-21T16:51:33.840Z
- UA：协议钉死串（Chrome/126 桌面）；请求间隔 ≥1s；单会话
- ⛔ 本报告只提供证据与"信号提示"。判级按 references/scope-and-fingerprint.md §3 判定树人工执行；
  全部计数为出现次数（非行数），且未做 vendor 归属剔除——进评级表前先过 §2《计数硬约束》。

## 步骤 1：存活性（GET，路径粒度）
- code=200 final=https://landonorris.com/ redirects=0 time=987ms bytes=218897

## 步骤 2：双抓 diff（间隔 3000ms）
- BYTE-IDENTICAL（理想镜像对象；apple/noomo 型）

## 步骤 3：物种/年代校验（防"HTTP 200 的尸体"）
- generator meta：无
- wp-content 出现次数：0
- 版权/年份字串（前 8 条）：
  - © 2026
- 商店主题替身 grep（shopify|Prestige|Dawn|elementor，忽略大小写）：0
- Shopify 平台指纹：cdn/shop/=0  Shopify.theme=0  cdn.shopify.com=0  myshopify.com=0（命中 → B 类路由候选，见 references/shopify-platform.md）
- 人工核对项：技术栈年代 vs 获奖年份是否矛盾；generator/license 年份晚于获奖期 + 获奖期技术栈残留为零 → 隐性下线判 X（§2 步骤 3）。

## 步骤 4：技术指纹（HTML 层，已剥注释；计数=出现次数）
- <script src> 枚举（5 条）：
  - /avljl2rk9q5pNjdiNWEwMmRjNWQzMzg5NjBiMTdhN2U5/7ZblqsTeeE5q7zjxhGjeEUmRx4o
  - https://lando.itsoffbrand.io/dev-js/lando.OFF+BRAND.gold-android-fix-03.js
  - https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=67b5a02dc5d338960b17a7e9
  - https://cdn.prod.website-files.com/67b5a02dc5d338960b17a7e9/js/lando-offbrand.schunk.7321a5097fb66f41.js
  - https://cdn.prod.website-files.com/67b5a02dc5d338960b17a7e9/js/lando-offbrand.751e0867.148dc658e77a3916.js
- 内联动态 import()（0 条；现代站可能没有任何 <script src>）：
- 维度① 框架模式标记（单独命中一律不判级，见 §3/§4 二维表）：
  - self.__next_f（Next RSC flight）        = 0
  - __reactRouterContext（RR framework 模式）= 0
  - __NUXT__（Nuxt）                         = 0
  - data-v-xxxxxxxx（Vue scoped 密度）       = 0
  - <!--[-->（Vue3 SSR fragment 注释，剥注释前计数）= 0
- 维度② 引擎范式标记：
  - theatre|@react-three（声明式引擎 → C 信号）= 0

## 步骤 5：bundle 可逆向性初检
### bundle 1: https://lando.itsoffbrand.io/dev-js/lando.OFF+BRAND.gold-android-fix-03.js
- ⚠ 响应 32B <1KB，疑似拒绝页——补 Referer(https://landonorris.com/) 重试
- code=200 bytes=1323177 content-type=text/javascript（带 Referer）
- 形态预检：lines=5479 longest_line=113672
  → 单行 113672 字符：minified，走 beautify 建行号坐标系
- sourceMappingURL：无
- three 强签名（弱字符串 "three" 不算）：
  - WebGLRenderer        = 38
  - THREE.WebGLRenderer  = 31（vendor 自带报错串份额 = 污染量）
- /api/ = 2（>0 ⇒ 镜像阶段强制做运行时 API 快照，B 信号）
- ⚠ 以上计数含 vendor 未剔除——进难度评级表前必须回上下文确认真实使用点（§2 计数硬约束第 2/3 条）。

## 下载物账本（sha256）
- a.html  218897B  sha256=d6f9016416ce2bbe8f12e7e3d1a978fa2a7fdb8804bb8e78beff9c889d57ae56
- b.html  218897B  sha256=d6f9016416ce2bbe8f12e7e3d1a978fa2a7fdb8804bb8e78beff9c889d57ae56
- bundle-1.js  1323177B  sha256=11cdda6fbe61e9bc1b868f474627489663878a2874f2d15aa773a397fba4e44e

## 下一步
1. 按 references/scope-and-fingerprint.md §3 判定树逐条走（命中即停），落判级写 probe/verdict.md；
2. 框架标记命中时必答 §4 三判据（框架模式 × 引擎范式二维表）；
3. 判级 A/B → 立即进 M0 镜像（历年获奖站消失率约 29%，镜像是抢救行为）。
