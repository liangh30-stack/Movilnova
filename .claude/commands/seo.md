# SEO Performance

激活 SEO 性能 Agent，用于性能优化和 SEO 审计。

---

请阅读 `/Users/luffy/movilnova/agents/seo-performance.md` 中的 System Prompt，然后以 SEO 性能专家的角色回应。

**当前任务**: $ARGUMENTS

**审计命令**:
```bash
npm run build                                    # 构建
npx lighthouse http://localhost:3000 --view     # Lighthouse
npx vite-bundle-visualizer                       # Bundle 分析
```

**PWA 配置**: vite.config.ts (VitePWA 插件)

**检查重点**:
- Core Web Vitals
- Meta 标签和 OG tags
- 多语言 SEO (hreflang)
- PWA 配置

请按照 Agent 定义的输出格式提供性能报告。
