import type { PageContent } from "../Types";

export const userManual: PageContent = {
  navTitle: "用户手册",
  title: "用户手册",
  description: "配置和使用聊天、工具、权限、上下文及工作区历史记录。",
  lead: "配置 API key，选择权限模式，然后从侧边栏使用 DeepSeek，并明确控制每一项工作区操作。",
  sections: [
    {
      title: "开始使用",
      items: [
        "从 Activity Bar 打开 Yar's DeepSeek Copilot，并在 Settings 中输入 API key。密钥保存在 VS Code Secret Storage 中。",
        "选择模型、thinking mode、reasoning effort、响应上限和最大工具轮数。",
        "输入 ./ 或 ../ 可自动补全工作区路径，也可以通过资源管理器和编辑器上下文菜单附加文件和精确选区。",
        "使用 Stop generation 可取消请求和正在运行的终端进程树。被取消的提示会返回输入框，不会作为已完成轮次保存。",
      ],
    },
    {
      title: "权限和工具状态",
      items: [
        "chat 不提供工作区工具；read-only 提供 read_file、list_directory 和 search_content；workspace 还允许创建和编辑文件；full-access 进一步允许执行终端命令。",
        "每个工具都可设为禁用、手动批准或自动批准。危险操作始终需要额外确认。",
        "工具调用依次经过 awaiting confirmation、running，并最终进入 completed、rejected、cancelled 或 error 中的一种状态。",
        "扩展宿主会先确认执行或拒绝操作，然后 webview 才会提交可见状态。",
        "同一轮内的工具调用按顺序执行。重复的同名同参数调用会被跳过，可配置的轮数上限会阻止执行循环。",
      ],
    },
    {
      title: "终端执行",
      items: [
        "终端命令以非交互方式运行，无法回答提示，也不提供 TTY。",
        "结果会记录 stdout、stderr、退出码、信号、超时、取消状态、实际工作目录和 shell。",
        "输出有大小限制；发生截断时会保留开头和结尾，并标记被省略的中间部分。",
        "未知命令需要谨慎处理。执行前会分析 Bash、PowerShell 和 cmd 命令链，以及发布、部署、远程更改、包管理器、重定向和破坏性操作。",
      ],
    },
    {
      title: "历史记录和隐私",
      items: [
        "设置保存在 ~/.yrs-dpsk-copilot/settings.json 中。API key 仍保存在 VS Code Secret Storage 中。",
        "历史记录以每个会话一个 JSON 文件的形式全局保存在 ~/.yrs-dpsk-copilot/history/ 中，每条记录都会显示其来源工作区。",
        "可以禁用历史记录，也可以将保留期设为 0 天（仅手动删除）到 3650 天；默认值为 30 天。",
        "历史列表直接从经过验证的会话文件重建。存储上限为 100 个会话和 24 MiB。",
        "删除单个会话或所有可见会话时会使用 VS Code 原生确认，并提供撤销。删除当前会话也会清空 Chat 视图。",
        "中断时处于 pending 或 running 的工具会恢复为 cancelled。损坏的记录会隔离到 history/corrupt 目录。",
      ],
    },
    {
      title: "上下文和斜杠命令",
      items: [
        "自动上下文会在时间和大小限制内包含当前编辑器以及 Git 的 staged 和 unstaged 更改。",
        "引用文件和 AGENTS.md 指令有大小限制，使用工作区相对标签，并作为不受信任的数据进行分隔。",
        "会话上下文会裁剪到固定预算；大型工具结果、推理和文件内容会从中间缩短。",
        "使用 /context 可检查普通请求将发送的内容。其他命令包括 /status、/tools、/mode、/auto-context、/review、/goal、/summarize 和 /clear-context。",
      ],
    },
  ],
};
