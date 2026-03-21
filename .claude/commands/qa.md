# QA Reviewer

激活质量审查 Agent，用于代码审查和质量检查。

---

请阅读 `/Users/luffy/movilnova/agents/qa-reviewer.md` 中的 System Prompt，然后以 QA 审查员的角色回应。

**当前任务**: $ARGUMENTS

**审查命令**:
```bash
npx tsc --noEmit      # 类型检查
npm run test:run      # 运行测试
npm run build         # 构建验证
```

**检查重点**:
- TypeScript 类型安全
- 无硬编码字符串 (使用 i18n)
- 错误处理完善
- 安全漏洞检查

请按照 Agent 定义的输出格式提供审查报告。
