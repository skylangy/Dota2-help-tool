# Legal, Safety & Privacy Notice / 法律、安全与隐私说明

> This document is a product notice, not legal advice. Laws and platform rules can change. If you distribute this software commercially or at scale, obtain advice from qualified counsel in the relevant jurisdictions.
>
> 本文件属于产品说明，不构成法律意见。法律法规和平台规则可能变化。如进行商业化或大规模分发，建议由相关法域的专业律师进行正式审查。

## English

### Independent project

Dota 2 Help Tool is an independent, community-developed learning assistant. It is not affiliated with, sponsored by, endorsed by, or part of Valve Corporation, Steam, Dota 2, or Dota Plus. Product names and trademarks belong to their respective owners.

### Read-only learning assistant — not game automation

The project is intentionally designed around a conservative technical boundary. It uses Dota 2 Game State Integration (GSI) data that the game voluntarily sends to a local endpoint, manual user input, and public data sources.

The project does **not**:

- read Dota 2 or Steam process memory;
- inject DLLs or code into Dota 2 or Steam;
- hook DirectX, Vulkan, Steam, or the Dota 2 renderer;
- capture or parse game network packets;
- automate keyboard, mouse, camera, movement, spells, item purchases, or macros;
- access hidden enemy information or fog-of-war information;
- scan the Dota 2 process to discover hidden state;
- modify Dota 2 executable or core game files;
- create an injected in-game overlay.

The optional edge mini-window is a normal desktop window. The optional phone view is a separate read-only view. AI features provide explanations only and do not execute actions in the game.

No third-party project can honestly guarantee zero account or enforcement risk. Valve and anti-cheat enforcement criteria are not fully public and may change. Users remain responsible for complying with the Dota 2, Steam, tournament, platform, and local rules that apply to them.

### Anonymous usage statistics

Anonymous usage statistics are optional and must not be sent before the user makes an explicit choice. Declining does not disable app features.

When enabled, the intended telemetry payload is limited to:

- event name (for example `app_open`);
- app version;
- event time;
- a randomly generated installation ID used only to estimate anonymous unique installations.

The app is designed not to send Steam IDs, Dota account IDs, Match IDs, heroes, items, match state, machine name, hardware identifiers, or gameplay content as telemetry.

The random installation ID is not a hardware fingerprint. The recommended collector should hash it immediately with a server-side secret and store only the resulting hash. Statistics should be reported as **anonymous unique installations**, not as identified people.

Users can refuse telemetry. If consent is withdrawn, the local random installation ID is deleted by the app's telemetry state logic.

### China-related privacy caution

If this software is offered to users in the People's Republic of China, the operator should review applicable privacy, cybersecurity, data-security, network-data and cross-border transfer requirements before enabling any remote telemetry. Data minimization and explicit notice/choice are intentional design goals, but this technical design alone does not guarantee regulatory compliance.

For a China-focused release, a conservative deployment is to keep telemetry disabled by default, obtain explicit consent before transmission, avoid gameplay/account/device data, document the exact purpose and fields, provide a withdrawal path, and avoid exporting any information that could qualify as personal information unless the applicable cross-border requirements have been assessed.

## 中文

### 独立项目声明

Dota 2 Help Tool 是独立开发的社区学习辅助工具，与 Valve Corporation、Steam、Dota 2、Dota Plus 不存在隶属、合作、授权、赞助或官方背书关系。相关产品名称、商标及其他权利归各自权利人所有。

### 只读学习辅助工具——不进行游戏自动化

本项目从技术架构上主动维持保守边界，只使用 Dota 2 主动发送到本机地址的 Game State Integration（GSI）数据、用户主动输入的信息以及公开数据源。

本项目**不会**：

- 读取 Dota 2 或 Steam 进程内存；
- 向 Dota 2 或 Steam 注入 DLL 或代码；
- Hook DirectX、Vulkan、Steam 或 Dota 2 渲染层；
- 抓取或解析游戏网络封包；
- 自动执行键盘、鼠标、镜头、移动、技能、购买或宏操作；
- 访问战争迷雾外信息或其他隐藏敌方信息；
- 扫描 Dota 2 进程以获取隐藏状态；
- 修改 Dota 2 可执行文件或核心游戏文件；
- 创建注入式游戏内 Overlay。

可选的边缘小窗属于普通桌面窗口；手机查看属于独立的只读视图；AI 功能只负责解释和建议，不会替用户在游戏中执行操作。

任何第三方项目都不应承诺“绝对零封号风险”或“100% VAC Safe”，因为 Valve 和反作弊系统的全部判定标准并不公开，且可能变化。用户仍需自行遵守适用于其所在地区、比赛、平台、Steam 及 Dota 2 的规则。

### 匿名使用统计

匿名使用统计属于可选功能，必须在用户明确作出选择之前保持不发送。不同意统计不会影响软件核心功能。

用户同意后，计划中的最小上报字段仅包括：

- 事件名称（例如 `app_open`）；
- 应用版本；
- 事件时间；
- 一个随机生成、仅用于估算“匿名独立安装数”的安装 ID。

遥测设计不会上报 Steam ID、Dota 账号 ID、Match ID、英雄、装备、比赛状态、机器名、硬件标识或其他游戏内容。

随机安装 ID 不是硬件指纹。推荐的统计接收端应在收到后立即使用服务器端密钥进行哈希，并只保存哈希结果。对外和后台应将该指标称为**匿名独立安装数**，不应表述为已识别的“自然人人数”。

用户可以拒绝统计；如用户撤回同意，本地遥测状态逻辑会删除随机安装 ID。

### 面向中国用户的合规提示

如果软件面向中华人民共和国境内用户提供，应在启用任何远程遥测前评估适用的个人信息保护、网络安全、数据安全、网络数据处理以及数据跨境相关要求。当前项目采用“最小化收集、事前说明、明确选择”的保守设计，但单纯依靠技术设计并不能自动保证法律合规。

面向中国用户发布时，建议维持以下更保守的产品策略：遥测默认关闭；传输前取得明确同意；不收集游戏、账号和设备数据；清楚说明目的与字段；提供撤回方式；在未完成相应跨境合规评估前，不将任何可能构成个人信息的数据传输至境外。

## Safety boundary summary / 安全边界摘要

Dota 2 Help Tool is designed as a **read-only, explainable coaching and learning tool**, not an automation, injection, hidden-information, or anti-cheat bypass tool.

Dota 2 Help Tool 的产品定位是**只读、可解释的学习与教练工具**，而不是自动化、注入、隐藏信息获取或反作弊绕过工具。
