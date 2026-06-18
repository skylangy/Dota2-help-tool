# Security Policy / 安全策略

## English

### Safety Model

Dota 2 Help Tool is a local-only learning assistant.

Allowed data sources:

- Dota 2 Game State Integration JSON sent by the game to `127.0.0.1`.
- Manual context tags selected by the user.
- Public OpenDota constants data.
- Optional user-configured AI endpoint for explanation only.

The app does not:

- Read Dota 2 or Steam process memory.
- Inject DLLs.
- Hook DirectX, Vulkan, Steam, or Dota 2.
- Capture or parse network packets.
- Modify Dota 2 executable files or core game files.
- Automate keyboard, mouse, item purchases, spell casts, movement, camera, or macros.
- Access hidden enemy information or fog-of-war information.

### AI Safety

AI is optional and disabled by default. The default coach response is generated locally by deterministic rules.

If the user enables AI, the app sends only the current recommendation summary to the endpoint configured by the user. The repository does not include API keys.

The AI system prompt explicitly forbids:

- Cheat development
- Anti-cheat bypass
- Memory reading
- Injection
- Hooking
- Packet capture
- Gameplay automation
- Hidden-information claims

### Reporting Issues

Please open a GitHub issue for security concerns. Do not attach private Steam account data, API keys, match data, or local filesystem screenshots unless required.

## 中文

### 安全模型

Dota 2 Help Tool 是一个只在本机运行的学习辅助工具。

允许的数据来源：

- Dota 2 主动发送到 `127.0.0.1` 的 Game State Integration JSON。
- 玩家手动选择的局势标签。
- OpenDota 公开常量数据。
- 用户主动配置的 AI endpoint，仅用于解释建议。

应用不会：

- 读取 Dota 2 或 Steam 进程内存。
- 注入 DLL。
- Hook DirectX、Vulkan、Steam 或 Dota 2。
- 抓包或解析网络封包。
- 修改 Dota 2 可执行文件或核心游戏文件。
- 自动键鼠、自动买装备、自动放技能、自动移动、自动镜头或宏操作。
- 读取敌方隐藏信息或战争迷雾外信息。

### AI 安全

AI 是可选功能，默认关闭。默认教练解释由本地确定性规则生成。

如果用户开启 AI，应用只会把当前建议摘要发送到用户自己配置的 endpoint。仓库不包含任何 API key。

AI 系统提示明确禁止：

- 外挂开发
- 绕过反作弊
- 读取内存
- 注入
- Hook
- 抓包
- 游戏自动化
- 声称读取隐藏信息

### 报告问题

如发现安全问题，请在 GitHub 开 issue。除非必要，不要附带 Steam 私人账号信息、API key、比赛隐私数据或本地文件系统截图。
