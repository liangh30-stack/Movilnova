# MovilNova Agent System

## 一键交付

```bash
/ship 做一个 MovilNova 首页的 hero + features 区块，风格高端极简科技
```

`/ship` 命令会自动调度所有 Agent，按顺序完成：需求分析 → 架构设计 → UI + 文案 → 代码实现 → 质量审查 → SEO优化

---

## 所有命令

| 命令 | Agent | 用途 |
|------|-------|------|
| `/ship` | **Orchestrator** | **端到端交付，一条命令完成全流程** |
| `/architect` | Frontend Architect | 架构设计、组件结构、技术决策 |
| `/ui-design` | UI Design Engineer | Tailwind 样式、响应式布局、动效 |
| `/copywriter` | Tech Copywriter | 官网文案、多语言、CTA |
| `/strategist` | Product Strategist | 需求分析、用户故事、功能优先级 |
| `/engineer` | Claude Code Engineer | 代码实现、整合设计和文案 |
| `/qa` | QA Reviewer | 代码审查、安全检查、性能检查 |
| `/seo` | SEO Performance | Lighthouse 优化、SEO 审计 |

## 协作工作流

```
User Request
     │
     ▼
┌─────────────────┐
│ /strategist     │ ◄── 1. 明确需求和定位
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /architect      │ ◄── 2. 决定架构和文件结构
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│/ui-   │ │/copy-     │ ◄── 3. 并行：设计 + 文案
│design │ │writer     │
└───┬───┘ └─────┬─────┘
    │           │
    └─────┬─────┘
          ▼
┌─────────────────┐
│ /engineer       │ ◄── 4. 整合实现
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /qa             │ ◄── 5. 审查质量
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /seo            │ ◄── 6. 优化（发布前）
└─────────────────┘
```

## 使用示例

### 场景：创建新的定价页面

```bash
# 1. 分析定价策略
/strategist 我需要一个定价页面，有3个套餐方案

# 2. 设计组件结构
/architect 根据策略师的建议，设计 PricingPage 组件结构

# 3. 并行执行
/ui-design 设计定价卡片的 Tailwind 样式
/copywriter 撰写定价套餐的文案（ES/CN/EN）

# 4. 实现代码
/engineer 根据架构、设计和文案，实现 PricingPage 组件

# 5. 质量审查
/qa 审查 PricingPage 代码

# 6. 发布前优化
/seo 检查 PricingPage 的 SEO 和性能
```

### 场景：修复 Bug

```bash
# 直接使用工程师
/engineer 修复购物车数量更新不生效的 bug

# 审查修复
/qa 审查购物车相关的代码变更
```

### 场景：添加新语言

```bash
# 使用文案专家
/copywriter 将所有界面文案翻译成日语 (JA)
```

## Agent 文件位置

```
/movilnova/
├── agents/
│   ├── README.md                 # 本文件
│   ├── orchestrator.md           # 总控调度 System Prompt
│   ├── frontend-architect.md     # 架构师 System Prompt
│   ├── ui-design-engineer.md     # 设计师 System Prompt
│   ├── tech-copywriter.md        # 文案师 System Prompt
│   ├── product-strategist.md     # 策略师 System Prompt
│   ├── claude-code-engineer.md   # 工程师 System Prompt
│   ├── qa-reviewer.md            # QA System Prompt
│   └── seo-performance.md        # SEO System Prompt
│
└── .claude/
    ├── settings.json             # MCP 服务器配置
    └── commands/                 # 斜杠命令
        ├── ship.md               # 端到端交付
        ├── architect.md
        ├── ui-design.md
        ├── copywriter.md
        ├── strategist.md
        ├── engineer.md
        ├── qa.md
        └── seo.md
```

## MCP 服务器

已配置的 MCP 服务器（见 `.claude/settings.json`）：

| 服务器 | 用途 |
|--------|------|
| `filesystem` | 读写项目文件 |
| `memory` | 跨会话记忆 |
| `puppeteer` | 浏览器自动化、Lighthouse |
| `brave-search` | 网络搜索、竞品调研 |
| `github` | PR 和 Issue 管理 |
| `fetch` | HTTP 请求 |
| `sequential-thinking` | 复杂问题分解 |

## 环境变量

需要配置的环境变量（用于 MCP 服务器）：

```bash
# .env.local
BRAVE_API_KEY=your_brave_api_key
GITHUB_TOKEN=your_github_token
```

## 自定义 Agent

如需添加新 Agent：

1. 在 `agents/` 目录创建 `{agent-id}.md`
2. 在 `.claude/commands/` 创建对应的斜杠命令
3. 更新 `.claude/settings.json` 的 `agents.workflow`
