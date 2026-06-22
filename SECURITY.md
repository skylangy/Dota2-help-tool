# Security Policy / 安全策略

## English

No third-party assistant can honestly guarantee absolute zero account risk, because VAC and security product internals are not public. Dota 2 Help Tool reduces risk by using only local, read-only, public, and user-provided data sources.

Allowed data sources:

- Dota 2 Game State Integration JSON sent by the game to `127.0.0.1`.
- Official Dota 2 GSI `allplayers` / `draft` fields when the game provides them.
- Manual context tags selected by the user.
- Public OpenDota constants data.
- Public OpenDota match data entered by Match ID.
- Optional user-configured AI endpoint for explanation only.

The app does not:

- Read Dota 2 or Steam process memory.
- Inject DLLs.
- Hook DirectX, Vulkan, Steam, or Dota 2.
- Capture or parse network packets.
- Modify Dota 2 executable files or core game files.
- Automate keyboard, mouse, item purchases, spell casts, movement, camera, or macros.
- Access hidden enemy information or fog-of-war information.
- Scan Dota 2 processes to auto-detect game launch.
- Draw inside the game render surface or attach an injected overlay.

The edge mini-window is a normal always-on-top Electron window. It is deliberately not transparent click-through, not injected, and not attached to the Dota 2 render pipeline.

AI is optional and disabled by default. If the user enables AI, the app sends only the current recommendation summary to the endpoint configured by the user. The repository does not include API keys.

Post-match diagnostics are inferred from public OpenDota match statistics only. They cannot identify exact mouse/keyboard mistakes or hidden in-game decisions.

## 中文

任何第三方辅助工具都不能诚实保证“绝对 0 封号风险”，因为 VAC 和安全软件的内部机制并不公开。Dota 2 Help Tool 通过只使用本地、只读、公开和用户主动提供的数据源来降低风险。

允许的数据来源：

- Dota 2 主动发送到 `127.0.0.1` 的 Game State Integration JSON。
- Dota 2 官方 GSI 在允许时提供的 `allplayers` / `draft` 字段。
- 玩家手动选择的局势标签。
- OpenDota 公开常量数据。
- 用户输入 Match ID 后拉取的 OpenDota 公开比赛数据。
- 用户主动配置的 AI endpoint，仅用于解释建议。

应用不会：

- 读取 Dota 2 或 Steam 进程内存。
- 注入 DLL。
- Hook DirectX、Vulkan、Steam 或 Dota 2。
- 抓包或解析网络封包。
- 修改 Dota 2 可执行文件或核心游戏文件。
- 自动键鼠、自动买装备、自动放技能、自动移动、自动镜头或宏操作。
- 读取敌方隐藏信息或战争迷雾外信息。
- 扫描 Dota 2 进程来自动检测游戏启动。
- 绘制到游戏画面内部或附着注入式 overlay。

边缘小窗是普通 Electron 置顶窗口。它刻意不做透明穿透、不注入、不附着 Dota 2 渲染管线。

AI 是可选功能，默认关闭。如果用户开启 AI，应用只会把当前建议摘要发送到用户自己配置的 endpoint。仓库不包含任何 API key。

战后诊断只从 OpenDota 公开比赛统计中推断，不能识别真实鼠标键盘操作错误或隐藏的局内决策。
