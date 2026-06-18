# Dota 2 Help Tool

> Local-only Dota 2 item suggestion desktop app for beginners.  
> 面向 Dota 2 新手的本地装备建议桌面工具。

[Download v0.2.0](https://github.com/skylangy/Dota2-help-tool/releases) · [Security Policy](SECURITY.md) · [Contributing](CONTRIBUTING.md)

## English

### What It Does

Dota 2 Help Tool gives beginner-friendly item suggestions while you play. It runs on your own computer, listens only on `127.0.0.1`, and receives read-only Dota 2 Game State Integration data.

Current features:

- Electron desktop app for Windows.
- Local GSI receiver at `http://127.0.0.1:3008/gsi`.
- Real-time hero, time, level, gold, and item display.
- Rule-based next-item recommendations with reasons.
- Manual match-context tags such as heavy control, magic burst, evasion, and healing.
- OpenDota public constants sync for hero/item metadata.
- Optional AI coach:
  - Local rule fallback works without any AI setup.
  - Optional Ollama local model support.
  - Optional OpenAI-compatible endpoint support if the user provides their own endpoint and key.
- One-click GSI config installation where the Dota 2 config directory can be detected.

### Safety Boundary

This project is designed to avoid cheat-like capabilities.

It does **not**:

- Read Dota 2 or Steam process memory.
- Inject DLLs.
- Hook DirectX, Vulkan, Steam, or Dota 2.
- Capture or parse network packets.
- Modify Dota 2 executable/game files.
- Automate input, camera, movement, spell casts, item purchases, or macros.
- Access hidden enemy information or fog-of-war information.

The app only uses:

- Dota 2 Game State Integration JSON sent by the game to localhost.
- Manual user-selected context tags.
- Public OpenDota constants data.
- Optional user-configured AI endpoint for explanation only.

Sources:

- OpenDota API documentation: https://docs.opendota.com/
- Dota 2 GSI launch option reference: https://docs.rs/dota-gsi
- Steam VAC support: https://help.steampowered.com/en/faqs/view/571A-97DA-70E9-FF74
- Dota 2 GSI setup used by Overwolf apps: https://support.overwolf.com/support/solutions/articles/9000212745-how-to-enable-game-state-integration-for-dota-2

### Player Setup

1. Download the Windows installer or zip from GitHub Releases.
2. Open the app.
3. Click `Install GSI Config`.
4. In Steam, open Dota 2 Properties and add this launch option:

```text
-gamestateintegration
```

5. Start Dota 2 and enter a match.

The GSI endpoint is:

```text
http://127.0.0.1:3008/gsi
```

### AI Coach

AI is optional and off by default.

Default mode uses local rule explanations. If you enable AI, the app sends only the current recommendation summary to the endpoint you configure. No API key is included in this repository.

Supported modes:

- `Ollama local`: default endpoint `http://127.0.0.1:11434/api/chat`
- `OpenAI compatible`: any chat-completions compatible endpoint and user-provided key

The AI prompt explicitly forbids memory reading, injection, packet capture, input automation, hidden-information claims, and anti-cheat bypass guidance.

### Developer Setup

```bash
npm install
npm run desktop
```

Web dev mode:

```bash
npm run dev
```

Self-test:

```bash
npm run self-test
```

Release build:

```bash
npm run dist
```

Artifacts are written to:

```text
release/
```

## 中文

### 这个工具做什么

Dota 2 Help Tool 是一个面向新手的本地装备建议桌面应用。它只在玩家自己的电脑上运行，只监听 `127.0.0.1`，通过 Dota 2 Game State Integration 接收游戏主动发出的只读状态数据。

当前功能：

- Windows Electron 桌面应用。
- 本地 GSI 接收地址：`http://127.0.0.1:3008/gsi`。
- 实时显示英雄、时间、等级、金钱、已有物品。
- 基于规则的下一件装备建议，并解释原因。
- 手动局势标签：控制多、魔法爆发高、闪避、回复强等。
- 从 OpenDota 同步公开英雄/物品常量数据。
- 可选 AI 教练：
  - 默认不需要 AI，使用本地规则解释。
  - 可选本地 Ollama 模型。
  - 可选 OpenAI-compatible 接口，由用户自己填写 endpoint 和 key。
- 如果检测到 Dota 2 目录，可以一键安装 GSI 配置文件。

### 安全边界

这个项目的设计目标是避免任何类似外挂的能力。

它不会：

- 读取 Dota 2 或 Steam 进程内存。
- 注入 DLL。
- Hook DirectX、Vulkan、Steam 或 Dota 2。
- 抓包或解析网络封包。
- 修改 Dota 2 可执行文件或游戏核心文件。
- 自动输入、自动移动、自动买装备、自动放技能、宏操作。
- 读取战争迷雾外的信息或敌方隐藏信息。

它只使用：

- Dota 2 主动发送到 localhost 的 GSI JSON。
- 玩家手动选择的局势标签。
- OpenDota 公开常量数据。
- 用户主动配置的 AI 接口，仅用于解释建议。

参考来源：

- OpenDota API 文档：https://docs.opendota.com/
- Dota 2 GSI 启动项参考：https://docs.rs/dota-gsi
- Steam VAC 支持页面：https://help.steampowered.com/en/faqs/view/571A-97DA-70E9-FF74
- Overwolf 的 Dota 2 GSI 设置说明：https://support.overwolf.com/support/solutions/articles/9000212745-how-to-enable-game-state-integration-for-dota-2

### 玩家如何使用

1. 从 GitHub Releases 下载 Windows 安装包或 zip。
2. 打开应用。
3. 点击 `安装 GSI 配置`。
4. 在 Steam 的 Dota 2 启动项里加入：

```text
-gamestateintegration
```

5. 启动 Dota 2 并进入比赛。

GSI 接收地址：

```text
http://127.0.0.1:3008/gsi
```

### AI 教练

AI 默认关闭。

默认模式会使用本地规则生成解释，不会调用外部模型。只有你主动开启 AI 并填写模型接口时，应用才会把“当前建议摘要”发送到你配置的 endpoint。本仓库不会内置任何 API key。

支持模式：

- `Ollama local`：默认 endpoint 为 `http://127.0.0.1:11434/api/chat`
- `OpenAI compatible`：用户自己提供兼容 chat-completions 的 endpoint 和 key

AI 系统提示中明确禁止内存读取、注入、抓包、自动操作、隐藏信息声称和绕过反作弊的指导。

### 开发

```bash
npm install
npm run desktop
```

网页开发模式：

```bash
npm run dev
```

自测：

```bash
npm run self-test
```

发布构建：

```bash
npm run dist
```

构建产物会输出到：

```text
release/
```
