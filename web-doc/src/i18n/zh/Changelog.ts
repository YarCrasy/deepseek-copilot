import type { PageContent } from "../Types";

export const changelog: PageContent = {
  navTitle: "更新日志",
  title: "更新日志",
  description: "重要变更和预览状态。",
  lead: "0.1.1 版本强化了按时间排序的工具执行、终端进程、API 流式传输、上下文和工作区历史记录。",
  sections: [
    {
      title: "0.1.1 可靠性和安全性",
      items: [
        "以原生的推理、内容和工具组时间线替换文本控制标记。",
        "统一工具状态，并修复拒绝、取消、宿主确认、过期 pending 调用、重复调用和最大轮数终止。",
        "加入真正的进程树取消和结构化非交互终端结果，并提供有界输出及平台感知的危险分析。",
        "强化 SSE、响应验证、URL 拼接、超时、遵守 Retry-After 的重试，以及 React 流批处理。",
        "将设置和历史记录迁移到 ~/.yrs-dpsk-copilot/。历史记录每个会话使用一个经过验证的 JSON 文件，不再依赖单独索引。",
        "加入多根工作区会话关联、上下文裁剪、Git staged 上下文、二进制检测、分隔引用、AGENTS.md 限制和乐观文件哈希。",
        "修复历史删除：删除当前会话会清空 Chat 视图，删除其他会话则保留当前聊天。",
        "完成无障碍和 UX 改进：模态框焦点管理、可控自动滚动、流式生成期间的草稿、本地化 UI、工作区权限、可恢复设置和分页历史记录。",
      ],
    },
    {
      title: "0.1.0 预览版",
      items: [
        "引入分层源代码架构、React 聊天 webview、History、Settings、工具配置、路径自动补全和 Marketplace 打包。",
        "产品专注于 DeepSeek，并将 API key 保存到 VS Code Secret Storage。",
      ],
    },
  ],
};
