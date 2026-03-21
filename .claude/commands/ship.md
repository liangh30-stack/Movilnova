# Ship (端到端交付)

一条命令完成从需求到代码的全流程。

---

请阅读 `/Users/luffy/movilnova/agents/orchestrator.md` 中的 System Prompt，然后以总控调度的角色回应。

**用户需求**: $ARGUMENTS

## 第一步：确认信息

在开始之前，请向我确认以下 5 类信息：

### 1. 定位/目标
- 这个功能的核心目标是什么？
- 目标用户是谁？

### 2. 范围边界
- 包含哪些子功能？
- 不包含什么？

### 3. 设计偏好
- 参考风格？（Apple/Stripe/Linear/现有页面）
- 颜色偏好？（使用品牌色还是自定义）

### 4. 数据/接口
- 需要哪些数据？
- Mock 数据还是 Firebase？

### 5. 优先级
- MVP 先做什么？
- 什么可以后续迭代？

---

确认后，我将按以下顺序调度专业 Agent：

```
strategist → architect → [ui-design + copywriter] → engineer → qa → seo
```

请回答以上问题，或直接说"按默认执行"让我根据需求自动推断。
