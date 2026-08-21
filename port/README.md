# port/ — 逐字移植（阶段 ②，机器读，永不手改）

| 文件 | 是什么 |
|---|---|
| `_gen/app.gen.js` | `scripts/skill/extract-source.mjs --slices scripts/slices.config.mjs` 从 `mirror/_pretty/lando.OFF+BRAND.gold-android-fix-03.js` 按钉死行号切出的 30 段字节：esbuild 运行时助手（L1-32）+ 全部应用区段（9,580 行，sha256 守卫）。`--check` 守字节一致，`--balance-check` 守可解析 |
| `vendor-globals.js` | §2.2 三件套之三：压缩 vendor 标识符 → 钉死 npm 包的别名表（每行带品牌/行号证据），以**全局赋值**形式提供，因为源 bundle 是 classic script（sloppy：`debug = !1` 隐式全局，Q9），逐字移植必须在同一模式下运行 |
| `_build/vendor-globals.js`（生成物） | `esbuild --bundle --format=iife` 打出的别名前奏（未压缩，可读） |
| `site/`（生成物） | `build-site.mjs --config scripts/shell-config.port.mjs` 从镜像按登记变换表生成的外壳 + 上面两个文件；`verify-shell.mjs` 逐 hunk 回放门。**没有打包器碰外壳**，直接伺服：`serve.mjs --side rebuild --root port/site --fallback-root mirror`（资产不复制） |

```bash
npm run port:shells    # 生成 site/ 并按逐条下限校验；npm run shell:verify:port 跑字节门
npm run port:build     # esbuild 前奏 + build-site 外壳 -> port/site
npm run port:serve     # serve.mjs --side rebuild --root port/site --fallback-root mirror
node scripts/run-gates.mjs offline --target port   # CLEAN + 零外联
node scripts/run-gates.mjs pixel   --target port   # 对镜像的像素门
```

`port/` 是等价性的另一端：`src/` 的每个声明都能经 `docs/rename-map.json` 指回这里（`scripts/verify-decls.mjs`），这里的每一行都指回 `mirror/_pretty/` 的行号。`src/` 里发现行为不对，答案在这里或镜像里，不在 `src/`。
