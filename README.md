# Dota 2 Help Tool

> Local-only Dota 2 item suggestion desktop app for beginners.  
> 面向 Dota 2 新手的本地装备建议桌面工具。

[Latest Release](https://github.com/skylangy/Dota2-help-tool/releases) · [Security Policy](SECURITY.md) · [Contributing](CONTRIBUTING.md)

## English

### What It Does

Dota 2 Help Tool gives beginner-friendly item suggestions while you play. It runs on your own computer, listens only on `127.0.0.1`, and receives read-only Dota 2 Game State Integration data.

Current features:

- Electron desktop app for Windows.
- Local GSI receiver at `http://127.0.0.1:3008/gsi`.
- Real-time hero, time, level, gold, and item display.
- Automatic next-item recommendation from your current GSI state.
- Dedicated rules for selected heroes.
- Generic recommendation rules for all heroes.
- OpenDota public constants sync for latest hero/item metadata and hero roles.
- Manual match-context tags such as heavy control, magic burst, evasion, healing, illusions, silence, armor need, and dispel need.
- Manual enemy lineup selection. The app infers tags only from heroes you choose manually.
- Basic post-match review from a public OpenDota Match ID, with local coach diagnostics for deaths, economy, XP, farm, item timing, damage, and objective conversion.
- Optional edge mini-window. This is a normal always-on-top desktop window, not an injected game overlay.
- Optional AI coach:
  - Local rule fallback works without AI setup.
  - Optional Ollama local model support.
  - Optional OpenAI-compatible endpoint support if the user provides their own endpoint and key.

### Safety Boundary

No third-party tool can honestly promise absolute zero account risk, because VAC/security product internals are not public. This project reduces risk by intentionally avoiding cheat-like capabilities.

It does **not**:

- Read Dota 2 or Steam process memory.
- Inject DLLs.
- Hook DirectX, Vulkan, Steam, or Dota 2.
- Capture or parse network packets.
- Modify Dota 2 executable/game files.
- Automate input, camera, movement, spell casts, item purchases, or macros.
- Access hidden enemy information or fog-of-war information.
- Scan Dota 2 processes to auto-detect launch.
- Draw inside the Dota 2 render surface or attach an injected overlay.

The app only uses:

- Dota 2 Game State Integration JSON sent by the game to localhost.
- Manual user-selected context tags.
- Public OpenDota constants data.
- Optional user-configured AI endpoint for explanation only.
- Public OpenDota match data for post-match review.

The edge mini-window is a normal Electron window placed near the screen edge after the user clicks the button. It does not attach to Dota 2, does not modify the game, and does not use an in-game overlay hook.

“Automatic” means the app automatically analyzes read-only GSI data that Dota 2 sends to localhost. It does not automatically inspect the Dota 2 process, screen pixels, memory, packets, or enemy hidden information.

Sources:

- OpenDota API documentation: https://docs.opendota.com/
- Dota 2 GSI reference: https://docs.rs/dota-gsi
- Dota 2 updates: https://www.dota2.com/news/updates
- Steam VAC support: https://help.steampowered.com/en/faqs/view/571A-97DA-70E9-FF74

### Player Setup

1. Download the Windows installer or zip from GitHub Releases.
2. Open the app.
3. Click `Install GSI Config`.
4. In Steam, open Dota 2 Properties and add this launch option:

```text
-gamestateintegration
```

5. Start Dota 2 and enter a match.
6. Optional: click `Sync Public Data` so generic rules can use latest OpenDota hero role metadata.
7. Optional: manually choose enemy heroes to infer match-context tags.
8. Optional: enter a Match ID after the game to fetch a basic OpenDota review.
9. Optional: click `Edge Mini-Window` to move the app into a small normal desktop window near the screen edge.

### Developer Setup

```bash
npm install
npm run desktop
```

Self-test:

```bash
npm run self-test
```

Release build:

```bash
npm run dist
```

## 中文

### 这个工具做什么

Dota 2 Help Tool 是一个面向新手的本地装备建议桌面应用。它只在玩家自己的电脑上运行，只监听 `127.0.0.1`，通过 Dota 2 Game State Integration 接收游戏主动发送的只读状态数据。

当前功能：

- Windows Electron 桌面应用。
- 本地 GSI 接收地址：`http://127.0.0.1:3008/gsi`。
- 实时显示英雄、时间、等级、金钱、已有物品。
- 根据当前 GSI 状态自动给出下一件装备建议。
- 部分英雄有专属规则。
- 所有英雄都有通用推荐规则。
- 从 OpenDota 同步公开英雄/物品常量数据，用于识别最新英雄和角色定位。
- 手动局势标签：控制多、魔法爆发高、闪避、回复强、幻象多、沉默多、缺护甲、需要驱散等。
- 手动选择敌方阵容。应用只根据你手动选择的英雄推断局势标签。
- 基础战后复盘：输入公开 Match ID，从 OpenDota 拉取比赛数据，并用本地规则总结死亡、经济、经验、补刀、装备节奏、伤害和推塔转化问题。
- 可选屏幕边缘小窗。它是普通置顶桌面窗口，不是注入式游戏内 overlay。
- 可选 AI 教练：
  - 默认不需要 AI，使用本地规则解释。
  - 可选本地 Ollama 模型。
  - 可选 OpenAI-compatible 接口，由用户自己填写 endpoint 和 key。

### 安全边界

任何第三方工具都不能诚实承诺“绝对 0 封号风险”，因为 VAC 和安全软件的内部判定机制并不公开。这个项目的做法是从架构上避免任何外挂式能力。

它不会：

- 读取 Dota 2 或 Steam 进程内存。
- 注入 DLL。
- Hook DirectX、Vulkan、Steam 或 Dota 2。
- 抓包或解析网络封包。
- 修改 Dota 2 可执行文件或游戏核心文件。
- 自动键鼠、自动买装备、自动放技能、自动移动、自动镜头或宏操作。
- 读取战争迷雾外的信息或敌方隐藏信息。
- 扫描 Dota 2 进程来自动检测游戏启动。
- 绘制到 Dota 2 游戏画面内部或附着注入式 overlay。

它只使用：

- Dota 2 主动发送到 localhost 的 GSI JSON。
- 玩家手动选择的局势标签。
- OpenDota 公开常量数据。
- OpenDota 公开比赛数据。
- 用户主动配置的 AI 接口，仅用于解释建议。

边缘小窗是用户点击按钮后移动到屏幕边缘的普通 Electron 窗口。它不附着到 Dota 2，不修改游戏，也不使用游戏内 overlay Hook。

这里的“自动”指自动分析 Dota 2 主动发送到 localhost 的只读 GSI 数据；不代表自动检查 Dota 2 进程、屏幕像素、内存、封包或敌方隐藏信息。

参考来源：

- OpenDota API 文档：https://docs.opendota.com/
- Dota 2 GSI 参考：https://docs.rs/dota-gsi
- Dota 2 更新页面：https://www.dota2.com/news/updates
- Steam VAC 支持页面：https://help.steampowered.com/en/faqs/view/571A-97DA-70E9-FF74

### 玩家如何使用

1. 从 GitHub Releases 下载 Windows 安装包或 zip。
2. 打开应用。
3. 点击 `安装 GSI 配置`。
4. 在 Steam 的 Dota 2 启动项里加入：

```text
-gamestateintegration
```

5. 启动 Dota 2 并进入比赛。
6. 可选：点击 `同步公开数据`，让通用规则使用 OpenDota 最新英雄角色数据。
7. 可选：手动选择敌方英雄，让工具推断局势标签。
8. 可选：赛后输入 Match ID，查看基础 OpenDota 复盘。
9. 可选：点击 `边缘小窗`，把应用移动成屏幕边缘的普通桌面小窗。

### 开发

```bash
npm install
npm run desktop
```

自测：

```bash
npm run self-test
```

发布构建：

```bash
npm run dist
```
