export const languages = ["en", "es", "zh"] as const;

export type Language = (typeof languages)[number];

export const languageLabels: Record<Language, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
};

export const pageSlugs = ["intro", "changelog", "references", "technical-decisions", "user-manual"] as const;

export type PageSlug = (typeof pageSlugs)[number];

export const navLabels: Record<Language, Record<PageSlug, string>> = {
  en: {
    intro: "Intro",
    changelog: "Changelog",
    references: "References",
    "technical-decisions": "Technical decisions",
    "user-manual": "User manual",
  },
  es: {
    intro: "Introducción",
    changelog: "Changelog",
    references: "Referencias",
    "technical-decisions": "Decisiones técnicas",
    "user-manual": "Manual",
  },
  zh: {
    intro: "介绍",
    changelog: "更新日志",
    references: "参考资料",
    "technical-decisions": "技术决策",
    "user-manual": "用户手册",
  },
};

export const homeContent: Record<Language, { title: string; description: string; lead: string; cards: Record<PageSlug, string> }> = {
  en: {
    title: "Human documentation",
    description: "Visual documentation for DeepSeek Copilot users and developers.",
    lead: "DeepSeek Copilot is a third-party VS Code extension focused on DeepSeek: chat, streaming, tool calls, workspace context, and controlled execution.",
    cards: {
      intro: "Scope, principles, and main capabilities.",
      changelog: "Current beta state and relevant changes.",
      references: "DeepSeek API, VS Code API, and project links.",
      "technical-decisions": "Architecture decisions and maintenance rules.",
      "user-manual": "Configuration and daily use inside VS Code.",
    },
  },
  es: {
    title: "Documentación humana",
    description: "Documentación visual para usuarios y desarrolladores de DeepSeek Copilot.",
    lead: "DeepSeek Copilot es una extensión de VS Code de tercero centrada en DeepSeek: chat, streaming, tool calls, contexto del workspace y ejecución controlada.",
    cards: {
      intro: "Alcance, principios y capacidades principales.",
      changelog: "Estado beta actual y cambios relevantes.",
      references: "DeepSeek API, VS Code API y enlaces del proyecto.",
      "technical-decisions": "Decisiones de arquitectura y reglas de mantenimiento.",
      "user-manual": "Configuración y uso diario dentro de VS Code.",
    },
  },
  zh: {
    title: "用户文档",
    description: "面向 DeepSeek Copilot 用户和开发者的可视化文档。",
    lead: "DeepSeek Copilot 是一个第三方 VS Code 扩展，专注于 DeepSeek：聊天、流式响应、工具调用、工作区上下文和受控执行。",
    cards: {
      intro: "范围、原则和主要功能。",
      changelog: "当前 beta 状态和重要变更。",
      references: "DeepSeek API、VS Code API 和项目链接。",
      "technical-decisions": "架构决策和维护规则。",
      "user-manual": "VS Code 内的配置和日常使用。",
    },
  },
};

export const pageContent: Record<Language, Record<PageSlug, { title: string; description: string; lead: string; sections: Array<{ title: string; items: string[] }> }>> = {
  en: {
    intro: {
      title: "Introduction",
      description: "Introduction to DeepSeek Copilot.",
      lead: "DeepSeek Copilot is DeepSeek-only by design. It provides a focused assistant inside VS Code without provider switching.",
      sections: [
        {
          title: "Current beta scope",
          items: [
            "Sidebar chat with streaming responses.",
            "Thinking mode can be enabled or disabled without disabling tools.",
            "Workspace tools can read files, list directories, search content, create files, and run terminal commands.",
            "Path autocomplete appears in the input after typing ./ or ../.",
            "Pending tool calls remain visible when switching between Chat, History, and Settings.",
          ],
        },
        {
          title: "Non-affiliation",
          items: ["This is an independent third-party extension. It is not affiliated with, endorsed by, sponsored by, or officially maintained by DeepSeek."],
        },
      ],
    },
    changelog: {
      title: "Changelog",
      description: "Relevant changes and beta status.",
      lead: "This page summarizes the human-facing changes for the first Marketplace beta.",
      sections: [
        {
          title: "0.0.1-beta",
          items: [
            "Migrated the extension to the layered src architecture.",
            "Removed Ollama and all provider selection from the product surface.",
            "Added React webview chat, History, Settings, and tool configuration.",
            "Added path autocomplete in the chat input with VS Code-style file icons.",
            "Improved cancellation so stopped prompts return to the input and are not kept in conversation context.",
            "Added global webview tooltips styled with VS Code theme variables.",
            "Prepared Marketplace metadata, MIT license, README, VSIX packaging, and documentation.",
          ],
        },
      ],
    },
    references: {
      title: "References",
      description: "Main technical references.",
      lead: "Use these references when validating API behavior, extension packaging, or project support channels.",
      sections: [
        {
          title: "Primary links",
          items: [
            "DeepSeek API docs: https://api-docs.deepseek.com/",
            "DeepSeek API keys: https://platform.deepseek.com/api_keys",
            "Repository: https://github.com/YarCrasy/deepseek-copilot",
            "Technical wiki: https://github.com/YarCrasy/deepseek-copilot/wiki",
          ],
        },
      ],
    },
    "technical-decisions": {
      title: "Technical decisions",
      description: "Architecture decisions for DeepSeek Copilot.",
      lead: "The extension is structured to keep VS Code APIs, DeepSeek API code, core tool logic, and React UI separated.",
      sections: [
        {
          title: "Rules",
          items: [
            "core must not import vscode, React, or concrete HTTP clients.",
            "deepseek-api owns DeepSeek protocol details, streaming, models, and tool-call requests.",
            "vscode-api owns activation, commands, webviews, workspace, files, and terminal adapters.",
            "ui/chat owns the React webview and communicates only through the shared message contract.",
            "web-doc uses Astro and must support English, Spanish, and Chinese.",
          ],
        },
      ],
    },
    "user-manual": {
      title: "User manual",
      description: "How to configure and use DeepSeek Copilot.",
      lead: "The basic workflow is configure the API key, choose model settings, then ask questions from the sidebar.",
      sections: [
        {
          title: "Daily workflow",
          items: [
            "Open the DeepSeek Copilot activity bar item.",
            "Set the API key in Settings. The key is stored in VS Code Secret Storage.",
            "Choose model, thinking mode, reasoning effort, and tool execution modes.",
            "Type ./ or ../ in the input to autocomplete workspace paths.",
            "Review pending tool calls before execution unless a tool is configured for safe auto approval.",
            "Use Stop generation to cancel. The cancelled prompt returns to the input and is not kept in history.",
          ],
        },
      ],
    },
  },
  es: {
    intro: {
      title: "Introducción",
      description: "Introducción a DeepSeek Copilot.",
      lead: "DeepSeek Copilot es DeepSeek-only por diseño. Ofrece un asistente enfocado dentro de VS Code sin selector de proveedores.",
      sections: [
        {
          title: "Alcance beta actual",
          items: [
            "Chat lateral con respuestas en streaming.",
            "Thinking mode puede activarse o desactivarse sin desactivar tools.",
            "Las tools pueden leer archivos, listar directorios, buscar contenido, crear archivos y ejecutar comandos de terminal.",
            "El autocompletado de rutas aparece en el input al escribir ./ o ../.",
            "Las tool calls pendientes se conservan al cambiar entre Chat, History y Settings.",
          ],
        },
        {
          title: "No afiliación",
          items: ["Esta es una extensión independiente de tercero. No pertenece a DeepSeek, ni está patrocinada, avalada o mantenida oficialmente por DeepSeek."],
        },
      ],
    },
    changelog: {
      title: "Changelog",
      description: "Cambios relevantes y estado beta.",
      lead: "Esta página resume los cambios visibles para la primera beta del Marketplace.",
      sections: [
        {
          title: "0.0.1-beta",
          items: [
            "Migración de la extensión a la arquitectura por capas bajo src.",
            "Eliminación de Ollama y del selector de proveedores en la superficie del producto.",
            "Añadido chat React webview, History, Settings y configuración de tools.",
            "Añadido autocompletado de rutas en el input con iconos estilo VS Code.",
            "Mejorada la cancelación: el prompt cancelado vuelve al input y no queda en el contexto.",
            "Añadidas tooltips globales del webview usando variables de tema de VS Code.",
            "Preparados metadatos de Marketplace, licencia MIT, README, empaquetado VSIX y documentación.",
          ],
        },
      ],
    },
    references: {
      title: "Referencias",
      description: "Referencias técnicas principales.",
      lead: "Usa estas referencias para validar API, empaquetado o canales de soporte del proyecto.",
      sections: [
        {
          title: "Enlaces principales",
          items: [
            "DeepSeek API docs: https://api-docs.deepseek.com/",
            "DeepSeek API keys: https://platform.deepseek.com/api_keys",
            "Repositorio: https://github.com/YarCrasy/deepseek-copilot",
            "Wiki técnica: https://github.com/YarCrasy/deepseek-copilot/wiki",
          ],
        },
      ],
    },
    "technical-decisions": {
      title: "Decisiones técnicas",
      description: "Decisiones de arquitectura de DeepSeek Copilot.",
      lead: "La extensión separa VS Code API, DeepSeek API, lógica core de tools y UI React.",
      sections: [
        {
          title: "Reglas",
          items: [
            "core no debe importar vscode, React ni clientes HTTP concretos.",
            "deepseek-api contiene protocolo DeepSeek, streaming, modelos y requests de tool calls.",
            "vscode-api contiene activación, comandos, webviews, workspace, archivos y terminal.",
            "ui/chat contiene la webview React y comunica solo mediante el contrato compartido.",
            "web-doc usa Astro y debe soportar inglés, español y chino.",
          ],
        },
      ],
    },
    "user-manual": {
      title: "Manual de usuario",
      description: "Cómo configurar y usar DeepSeek Copilot.",
      lead: "El flujo básico es configurar la API key, elegir modelo y preguntar desde el sidebar.",
      sections: [
        {
          title: "Flujo diario",
          items: [
            "Abre el item de DeepSeek Copilot en la Activity Bar.",
            "Configura la API key en Settings. La key se guarda en VS Code Secret Storage.",
            "Elige modelo, thinking mode, reasoning effort y modo de ejecución de tools.",
            "Escribe ./ o ../ en el input para autocompletar rutas del workspace.",
            "Revisa las tool calls pendientes antes de ejecutarlas salvo que una tool esté en auto approval seguro.",
            "Usa Stop generation para cancelar. El prompt cancelado vuelve al input y no queda en historial.",
          ],
        },
      ],
    },
  },
  zh: {
    intro: {
      title: "介绍",
      description: "DeepSeek Copilot 介绍。",
      lead: "DeepSeek Copilot 设计上只支持 DeepSeek，在 VS Code 中提供专注的助手体验，不提供多供应商切换。",
      sections: [
        {
          title: "当前 beta 范围",
          items: [
            "侧边栏聊天和流式响应。",
            "Thinking mode 可以开启或关闭，但不会禁用工具。",
            "工作区工具可以读取文件、列出目录、搜索内容、创建文件和运行终端命令。",
            "在输入框输入 ./ 或 ../ 后会显示路径自动补全。",
            "在 Chat、History、Settings 之间切换时，待确认的工具调用会保留。",
          ],
        },
        {
          title: "非官方关系",
          items: ["这是一个独立的第三方扩展，不隶属于 DeepSeek，也不由 DeepSeek 赞助、认可或官方维护。"],
        },
      ],
    },
    changelog: {
      title: "更新日志",
      description: "重要变更和 beta 状态。",
      lead: "本页总结 Marketplace 首个 beta 版本的用户可见变更。",
      sections: [
        {
          title: "0.0.1-beta",
          items: [
            "扩展迁移到 src 下的分层架构。",
            "移除 Ollama 和产品界面中的供应商选择。",
            "新增 React webview 聊天、History、Settings 和工具配置。",
            "新增输入框路径自动补全，并使用 VS Code 风格文件图标。",
            "改进取消逻辑：被取消的提示会回到输入框，不会进入上下文。",
            "新增使用 VS Code 主题变量的全局 webview tooltip。",
            "准备 Marketplace 元数据、MIT 许可证、README、VSIX 打包和文档。",
          ],
        },
      ],
    },
    references: {
      title: "参考资料",
      description: "主要技术参考。",
      lead: "验证 API 行为、扩展打包或项目支持渠道时使用这些链接。",
      sections: [
        {
          title: "主要链接",
          items: [
            "DeepSeek API 文档: https://api-docs.deepseek.com/",
            "DeepSeek API keys: https://platform.deepseek.com/api_keys",
            "仓库: https://github.com/YarCrasy/deepseek-copilot",
            "技术 Wiki: https://github.com/YarCrasy/deepseek-copilot/wiki",
          ],
        },
      ],
    },
    "technical-decisions": {
      title: "技术决策",
      description: "DeepSeek Copilot 架构决策。",
      lead: "扩展将 VS Code API、DeepSeek API、核心工具逻辑和 React UI 分离。",
      sections: [
        {
          title: "规则",
          items: [
            "core 不得导入 vscode、React 或具体 HTTP 客户端。",
            "deepseek-api 负责 DeepSeek 协议、流式响应、模型和工具调用请求。",
            "vscode-api 负责激活、命令、webview、工作区、文件和终端适配。",
            "ui/chat 负责 React webview，并且只通过共享消息契约通信。",
            "web-doc 使用 Astro，并且必须支持英文、西班牙文和中文。",
          ],
        },
      ],
    },
    "user-manual": {
      title: "用户手册",
      description: "如何配置和使用 DeepSeek Copilot。",
      lead: "基本流程是配置 API key、选择模型设置，然后从侧边栏提问。",
      sections: [
        {
          title: "日常流程",
          items: [
            "打开 Activity Bar 中的 DeepSeek Copilot。",
            "在 Settings 中设置 API key。密钥保存在 VS Code Secret Storage。",
            "选择模型、thinking mode、reasoning effort 和工具执行模式。",
            "在输入框输入 ./ 或 ../ 来补全工作区路径。",
            "执行工具前先检查待确认的工具调用，除非该工具处于安全的自动批准模式。",
            "使用 Stop generation 取消。被取消的提示会回到输入框，不会保存在历史中。",
          ],
        },
      ],
    },
  },
};

export function isLanguage(value: string | undefined): value is Language {
  return languages.includes(value as Language);
}

export function localizedPath(lang: Language, slug?: PageSlug): string {
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
}

export function anchorId(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
