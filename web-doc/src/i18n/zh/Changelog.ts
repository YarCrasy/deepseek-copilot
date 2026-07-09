import type { PageContent } from "../Types";

export const changelog: PageContent = {
  navTitle: "更新日志",
  title: "更新日志",
  description: "重要变更和预览状态。",
  lead: "本页总结 Marketplace 首个预览版本的用户可见变更。",
  sections: [
    {
      title: "0.1.0 preview",
      items: [
        "扩展迁移到 src 下的分层架构。",
        "移除 Ollama 和产品界面中的供应商选择。",
        "新增 React webview 聊天、History、Settings 和工具配置。",
        "新增输入框路径自动补全，并使用 VS Code 风格文件图标。",
        "改进取消逻辑：被取消的提示会回到输入框，不会进入上下文。",
        "新增使用 VS Code 主题变量的全局 webview tooltip。",
        "准备 Marketplace 元数据、MIT 许可证、README、VSIX 打包和文档。",
        "采用唯一 Marketplace 标识 yarcrasy.yrs-dpsk-copilot 和描述性显示名称 Yar's Deepseek copilot - A VS Code copilot specialized on Deepseek。",
      ],
    },
  ],
};
