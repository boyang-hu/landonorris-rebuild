# tools/ — 源码化阶段的重构器

⭐ **依赖纪律按阶段划：源码化之前，整条流水线零依赖。** 复刻项目从 Step 0 到 M(n)
不装任何东西；**到 M(n+1) 才获得 devDependencies**，因为作用域安全的分析需要真正的
parser（`@babel/parser` / `@babel/traverse`）。这里放的就是那个阶段的工具。

⛔ 前面的阶段需要 parser 时，**外挂而不是 import**：spawn 一个钉死版本的 npx
（见 `scripts/beautify-bundle.mjs`、`scripts/module-map.mjs`）。

⛔ **`scripts/` 里的任何门都不许 import 这里的任何文件**——检查者不能是生产者
（`references/verification-gates.md` §2.1.2）。两条纪律都由 `scripts/verify-zerodep.mjs` 守。

| 工具 | 用途 |
|---|---|
| `name-modules.mjs` | 按 0–4 级证据给模块提名，并记下依据的那句话；无证据保留哈希 id |

⚠ 复制到复刻项目时放在项目的 `tools/` 下，与项目 `package.json` 的 devDependencies 一起走。
