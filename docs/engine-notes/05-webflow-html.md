# Webflow 平台层 + 页面 HTML 契约

## A. Webflow 运行时
- loader（57 行）= rspack 1.3.9 webpack-runtime，等 chunk "985"（schunk）后执行模块 919 → require 461,624,286,334,338,695,322。
- schunk 模块：487 tram（jQuery 插件）；756 underscore 1.6.0-Webflow；461 brand 徽章（本站不注入 + CSS 双保险）；322 editor 探测（死代码）；338 focus-visible polyfill；334 focus 修复（no-op）；949 Webflow 核心（define/require/push/env/ready/load/destroy/resize/scroll/redraw）；624 links（w--current + hash 高亮）；286 scroll（a[href*=#] 平滑滚动；**a[href="#"] 一律 preventDefault** L1272）；695 touch（swipe/tap 合成）。
- **不含**：forms/navbar/dropdown/slider/tabs/lightbox/ix2/commerce。HTML 无任何 w-nav/w-form 等类。
- w-mod-js/w-mod-touch 来自每页 head 第一个内联脚本（必须保留）。
- jQuery 3.5.1 唯一消费者是 webflow.js 自身；gold bundle 0 处 jQuery。
- **必须保留 webflow 三连（jQuery→schunk→entry）**：gold 的 ED()（L41-44）在 taxi 换页后调 window.Webflow.destroy()+ready()；href="#" 拦截靠模块 286；w--current 重算靠 949+624。
- transitions-rive-isolate.js 被注释停用（index.html L1166-1168 HTML 注释内）。

## B. 页面骨架（body 顶层顺序，全站一致）
```
body[data-edit]
  .css-main（14 个 .css-* 内联 style 块）
  .nav [data-nav-wrap][data-nav-theme=light|dark]
  .mob-landscape-block [data-mob-landscape]
  .scroll-indicator > .scroll-indicator-bar（404/partnerships 无）
  .top-marker（404/partnerships 无；off-track 在 nav 前）
  .transition-w
  .page-w [data-start="hidden"] [overflow-clip="x"]
    main.main-w [data-taxi]（404 用 div）
      div.taxi-w [data-taxi-view] [data-page=...]
        sections…
末尾：jQuery → schunk → entry → 内联 removeEditMode()（+legal 页 iubenda）
```

## C. 各页 sections 摘要
- home：home-title-w（screen-reader h1/h2）→ sticky-track home-hero [data-sticky-hero=track][data-gl-track=head]（.gl-canvas[data-gl=head]、next-race 卡+circuits rive zandvoort、reef helmet-reef_play、data-hero-anim img/mob1/mob2/msg、home-swipe）→ home-marquee（signature_scroll target .hero-rive-tracker）→ horiz 前置 + reef → is-horizontal-track [data-horizontal-section][data-h-color-from=dark-green][data-h-color-to=white]（内嵌 is-otot-home [data-otot-top]、phrases phrase_on、2 arrow）→ is-otot-end [data-otot-bottom] → home-helmets（16 [data-helmet-item] + [data-helmet-grid]）→ is-callout [data-nav-theme-target=light]（reef helmet-reef_scroll target .c.is-callout）→ is-lando-exe [data-exe-section]（[data-exe-visor]、CSS 跑马灯 [data-css-marquee]）→ is-home-collabs（.gl-carousel[data-gl=carousel]、phrases collabs/page_home）→ is-callout-socials（reef off-icons、7 Vimeo [data-video-stream]）→ is-footer [data-footer-theme=white][data-nav-theme-target=dark]。另 .gl-background[data-gl=background]。
- calendar：is-calendar-hero（h1+signature）→ is-on-t-calendar .c.is-calendar-gl（赛历交互 + circuits monaco hover=true）→ .c.is-f1-highlight-outer（[data-cal-wrap] 24 场 + [data-calendar-history=wrap] 2019-2025 手风琴）→ [data-countdown-wrap]（date-target "23/8/2026 14:00"、circuits + phrases race-day）→ is-footer black。含 .lando-gl__point style 块。
- on-track：hero .c.is-on-track-home（h1、phrases phrase_on、circuits mogyorod/zandvoort、reef、signature、heroflip pos1-3/track、podium wrap/text/media、car-counter、stats mask）→ impact reef 3d-helmet-reef_scroll（target .on-track-impact-reef-rive-w）→ phrases phrase_p1 + arrow → f1-highlight + horizontal-track + 8 reef 行（img-highlight、oval-scroll）→ countdown → is-on-t-calendar（5 cal-item）→ otot-end → home-helmets → callout-socials dark-mode → is-callout reef → footer black。
- off-track：唯一 data-nav-theme="dark" 页；top-marker 在 nav 前。hero（off-icons、signature color_dark-green-tint-2、heroflip img/pos1/pos2/track）→ is-off-t-hero-scroll-media（off-icons-reef_play、signature_scroll target .base-helmet-rive.off-track-impact、oval-scroll、mask-case-left）→ horizontal-track → callout-socials light（7 Vimeo）→ footer white。
- partnerships ≡ 404.html（md5 相同）：data-page="not-found"；body data-start 在 body 上；无 scroll-indicator/top-marker；.utility__page--w[data-gl=background] → 两个 "4" + .utility__gl[data-gl=not-found] → 文案 → .utility__switcher--w.display-none（4 个 [data-gl-switcher=lime|dark|google|grid]）→ 回首页按钮。GA 反代路径 /nvhc…（其余页 /avljl…）。
- legal ×2：CMS 模板（data-wf-collection/item-slug）；body 无 data-edit；.legal-content-w > .rich-text > w-embed：iubenda 嵌入（a.iubenda-embed + **data-taxi-reload** loader script）→ footer green。

## D. 共享部分
- nav：a.nav-brand-link[data-nav-group=brand]（LANDO NORRIS 双色 SVG，nav-brand-path 1/2）；.btn-layout.is-nav[data-nav-group=btns]（Store → store.landonorris.com + button.nav-ham[data-nav-ham] > canvas[data-rive-nav-hamburger]）；.page-ln4-pos > a.nav-middle > canvas[data-rive-ln4]；.nav-menu-w[data-nav-m]（5 图 data-nav-img=1|2|3|5（4 隐藏）、链接列表（Home/On Track/Off Track/[Partnerships 隐藏]/Calendar，data-anim=text-hover + split-text=chars + w--current 波浪 SVG）、canvas[data-rive-nav-object]、[data-nav-link-highlight] "mclaren f1 since 2019"、social 列（business@landonorris.com + tiktok/instagram/youtube/twitch））；.nav-menu-bg。
- footer section.s.is-footer[data-footer-theme=white|black|green]：links 两列（pages / Follow On + [data-signup-trigger] Sign Up is-hidden）、signature rive signature_play color_lime、h2 "Always bringing the fight."、360 头盔 + mailto 按钮、footer-marquee（duplicate 3/left/speed 30/scroll-speed 5）。
- .transition-w：.transition-rive > canvas[data-rive-primary]；.transition-btn > a.btn-w[href="#"] "Load Norris"（split-text=chars）；注释掉的 transitions-rive-isolate script。head L61 强制 display flex。
- .css-root 流式缩放：--fluid-font = clamp(992,100vw,1920)/1728*16；≤991: 768-991/unit 20；≤767: 480-767；≤479: 320-479/unit 48。html{font-size:var(--fluid-font)}。--cubic-default cubic-bezier(0.65,0.05,0,1)；--duration-default 0.75s；--nav-height calc 缺运算符（Q2 照抄）。
- [data-hide="d|t|ml|m"] 响应式隐藏。css 块：root/utils/split-type/lenis/nav/buttons/home/on-track/off-track/partnerships/breakpoints/editmode/safari（is-safari/is-iphone 由 gold BD() 加）。

## E. head 契约
共同：charset/viewport → title/og → 同步 CSS 043b62fef（integrity）→ favicon/webclip → w-mod 内联 → GA first-party（剥离对象）→ preconnect → preload MonaSans 变量字体 → **preload as=style onload 换 rel 的第二份 CSS 4f53262f0（异步双 CSS）** → 注释坟场（lando-by-OFF+BRAND.js、localhost:6645、Klaviyo XWvzdS、iubenda banner 配置 siteId 2095750）→ Gold bundle → .w-webflow-badge 隐藏 + .transition-w display flex。
titles：home "2025 McLaren Formula 1 Driver — Lando Norris"；calendar "2026 F1 Calendar – Race Dates, Sessions & Results – Lando Norris"；on-track "On-Track – Live F1 Results, Stats & Career Wins"；off-track "Off-Track – Lifestyle, Gaming & Personal Projects"；legal "Privacy Policy | / Terms & Conditions |"；404 "Not Found"。

## F. Calendar 数据（100% 静态烘焙，无 API）
- [data-cal-item][data-stat-item].f1-highlight-grid.w-dyn-item ×24（is-previous 13 / is-schedule 11，2026 赛历）。
- 每条内 .on-t-stat-track-dash-stats[data-nosnippet][aria-hidden][inert] 隐藏数据字典：22 组 [data-cal-list=字段]：circuit-id/name/lap-amount/lap-length/distance/about(富文本)/first-competed-date/date-actual("8/3/2026 4:00")/date-from-to-num/-month/prac1|2|3-date,-time/qual-date,-time/race-date,-time/各 -time-result,-pos/[data-cal-sprint]。
- 空绑定 w-dyn-bind-empty（315）、条件隐藏 w-condition-invisible（351）。
- 倒计时目标写死 "23/8/2026 14:00"。

## G. 表单
全站 0 form/0 input/0 w-form。Klaviyo 全停用（脚本注释 + CSS 强杀 + Sign Up is-hidden）。唯一"提交"是 mailto。legal iubenda 嵌入带 data-taxi-reload。

## H. 命名体系
Webflow：w-embed/w-script/w-iframe/w-inline-block/w-dyn-*/w-richtext/w--current/w-variant-<hash>+data-wf--*--variant/w-node-*/w-mod-*。
自定义：.s+.is-*、.c+.is-*、.spacer._Nrem、nav-*/footer-*/btn-*/text-*(-mona/-brier)/c-<color>、页面前缀 home-/on-t-/off-t-/part-i-/utility__/f1-highlight-/calendar-/marquee-/helmet-grid-/gl-/lando-gl__、状态 is-*；行为全走属性（data-* 约 120 种 + split-text/nav-brand-path/overflow-clip）。
