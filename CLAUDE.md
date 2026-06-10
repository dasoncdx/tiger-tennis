# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. 项目专属规则（Tiger网球俱乐部）

### 文档同步要求（强制）

**每次改动代码后，必须同步更新相关文档，确保文档与实际应用完全吻合。**

- **功能/交互变更** → 更新 `prd-v1.0.md` 对应章节
- **样式/组件/布局变更** → 更新 `design/design-system-v1.0.md`
- **架构/数据库/API变更** → 更新 `tech-design-v1.0.md`
- **运营策略调整** → 更新 `tennis-op.md`

判断依据：改了什么，就更新描述那件事的文档。若不确定，宁可多更新也不要漏更新。

### 项目文档清单

| 文件 | 用途 |
|------|------|
| `tennis-op.md` | 机构运营蓝图 |
| `prd-v1.0.md` | 产品需求文档 |
| `tech-design-v1.0.md` | 技术设计文档 |
| `design/design-system-v1.0.md` | 设计规范 |

### 前端构建规则

- 前端构建必须在 `apps/frontend` 目录下运行，使用根目录的 taro：
  ```
  cd apps/frontend && /path/to/tennis/node_modules/.bin/taro build --type h5
  ```
- `dist/index.html` 和 `dist/Caddyfile` 不会被 taro 生成，每次构建后需手动确认存在
- 构建产物需 `git add -f apps/frontend/dist` 强制提交

### 多端适配规则

- 所有顶部彩色背景区域必须加 `padding-top: env(safe-area-inset-top)`
- 页面底部必须加 `padding-bottom: calc(56px + env(safe-area-inset-bottom))`
- TabBar 组件在 `src/components/TabBar.tsx`，所有页面必须引入

