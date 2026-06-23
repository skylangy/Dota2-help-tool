# Dota 2 Help Tool

> Local-only Dota 2 item suggestion desktop app for beginners.  
> 面向 Dota 2 新手的本地装备建议桌面工具。

[Latest Release](https://github.com/skylangy/Dota2-help-tool/releases) · [Security Policy](SECURITY.md) · [Contributing](CONTRIBUTING.md)

## English

### What It Does

Dota 2 Help Tool gives beginner-friendly item suggestions while you play. It runs on your own computer and receives read-only Dota 2 Game State Integration data. By default its API listens only on `127.0.0.1`; an optional, read-only phone view can be enabled to mirror suggestions to your phone over your local network.

Current features:

- Electron desktop app for Windows.
- Local GSI receiver at `http://127.0.0.1:3008/gsi`.
- Optional local GSI auth token: one-click setup writes a per-machine token into the Dota 2 GSI config and the local receiver validates it.
- Real-time hero, time, level, gold, and item display.
- Automatic next-item recommendation from your current GSI state, with gold-aware hints (how much more gold a key item needs) and up to two counter items matched to the detected enemy threats.
- Honest threat notes that separate what was actually addressed with an item from what was only identified.
- Automatic enemy lineup detection when Dota 2 GSI provides `allplayers` data, plus threat inference for a large hero roster.
- GSI data inspector showing which requested blocks were actually received, including `buildings` when available.
- Dark esports command-center UI with item and hero images from the latest synced OpenDota constants, and a responsive layout for small and large windows.
- Dedicated rules for selected heroes, with generic role-based rules covering all heroes.
- OpenDota public constants sync for latest hero/item metadata and hero roles; images load from the Steam CDN with text fallbacks.
- Manual match-context tags such as heavy control, magic burst, evasion, healing, illusions, invisibility, silence, armor need, and dispel need.
- Manual enemy lineup selection remains available as a fallback when GSI does not provide both-team lineup data.
- Basic post-match review from a public OpenDota Match ID, with local coach diagnostics and each player's full item build (including backpack and neutral items).
- Optional minimal edge mini-window showing only the next item and recommended items. This is a normal always-on-top desktop window, not an injected game overlay, so it only shows over Dota in borderless/windowed mode.
- Optional voice readout that speaks the top suggestion using the browser's built-in speech synthesis (audio only).
- Optional phone second-screen: a one-click, read-only, PIN-protected view you open on your phone (same Wi-Fi) by scanning an on-screen QR code; an auto-detected free port is used and the main API stays on `127.0.0.1`.
- Optional AI coach:
  - Local rule fallback works without AI setup.
  - Optional Ollama local model support.
  - Optional OpenAI-compatible endpoint support if the user provides their own endpoint and key.
- Launch-test checklist with a one-click Prepare action (installs the GSI config and syncs public data).
- Safety diagnostics panel that reports local setup, public data cache, live GSI status, recommendation health, and the explicit non-cheat capability boundary.

Requested GSI blocks:

- `provider`, `map`, `player`, `hero`
- `abilities`, `items`
- `allplayers`, `draft`
- `buildings`

The app shows whether each block was actually received. Dota 2 may limit fields depending on whether you are playing, spectating, or in draft.

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
- Official GSI `allplayers` / `draft` / `buildings` fields when Dota 2 chooses to provide them.
- Manual user-selected context tags.
- Public OpenDota constants data.
- Optional user-configured AI endpoint for explanation only.
- Public OpenDota match data for post-match review.

The edge mini-window is a normal Electron window placed near the screen edge after the user clicks the button. It does not attach to Dota 2, does not modify the game, and does not use an in-game overlay hook.

The optional phone view is a separate, read-only server that you explicitly turn on. It binds to your local network only while enabled, is protected by a one-time PIN, and exposes nothing but the same suggestions the desktop already shows — it has no game-data input and cannot change any state. The main API server always stays bound to `127.0.0.1`. It still performs no game-process interaction of any kind, so it does not change the safety boundary above. Enabling it may trigger a Windows Firewall prompt, which you must allow yourself.

“Automatic” means the app automatically analyzes read-only GSI data that Dota 2 sends to localhost. It does not automatically inspect the Dota 2 process, screen pixels, memory, packets, or enemy hidden information.

Sources:

- OpenDota API documentation: https://docs.opendota.com/
- Dota 2 GSI reference: https://docs.rs/dota-gsi
- Dota 2 updates: https://www.dota2.com/news/updates
- Steam VAC support: https://help.steampowered.com/en/faqs/view/571A-97DA-70E9-FF74

### Player Setup

1. Download the Windows installer or zip from GitHub Releases.
2. Open the app.
3. At the top, click `Prepare`. This installs the local GSI config (with a per-machine auth token) and syncs public OpenDota data. It does not modify Steam launch options.
4. In Steam, open Dota 2 Properties and add this launch option:

```text
-gamestateintegration
```

5. Start Dota 2 and enter a match.
6. Optional: manually choose enemy heroes to infer match-context tags.
7. Optional: enter a Match ID after the game to fetch a basic OpenDota review.
8. Optional: click `Phone View` and scan the QR code with your phone (on the same Wi-Fi) to watch suggestions on a second screen.
9. Optional: toggle `Voice` to have the top suggestion read aloud.
10. Optional: click `Edge Mini-Window` for a small always-on-top window showing only the next item and recommended items (use Dota's borderless/windowed mode so it stays visible).
11. Optional: open `Safety Diagnostics` to verify what the app is using and what it deliberately does not do.

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

Dota 2 Help Tool 是一个面向新手的本地装备建议桌面应用。它在玩家自己的电脑上运行，通过 Dota 2 Game State Integration 接收游戏主动发送的只读状态数据。默认情况下其 API 只监听 `127.0.0.1`；可选开启一个只读的「手机查看」，把建议通过局域网镜像到你的手机上。

当前功能：

- Windows Electron 桌面应用。
- 本地 GSI 接收地址：`http://127.0.0.1:3008/gsi`。
- 可选本地 GSI 鉴权 token：一键设置会把每台机器独立的 token 写入 Dota 2 GSI 配置，本地接收端会校验。
- 实时显示英雄、时间、等级、金钱、已有物品。
- 根据当前 GSI 状态自动给出下一件装备建议，并带金钱提示（关键装还差多少钱），还会针对识别到的敌方威胁最多给出两件针对装。
- 诚实的局势说明：区分「本次已给出对应装备」和「仅识别到、未单独出装」。
- 当 Dota 2 GSI 提供 `allplayers` 数据时，自动识别敌方阵容，并对大量英雄做威胁推断。
- GSI 数据检查器：显示本局实际收到了哪些 GSI 数据块，包括可用时的 `buildings`。
- 暗色电竞指挥台 UI，装备和英雄图片来自最新同步的 OpenDota 公开常量；并对大小窗口做了自适应排版。
- 部分英雄有专属规则，其余英雄按角色走通用规则，全英雄覆盖。
- 从 OpenDota 同步公开英雄/物品常量数据；图片从 Steam CDN 加载，不可用时回退为文字占位。
- 手动局势标签：控制多、魔法爆发高、闪避、回复强、幻象多、隐身多、沉默多、缺护甲、需要驱散等。
- 仍然保留手动选择敌方阵容；当 GSI 没有提供双方阵容时作为兜底。
- 基础战后复盘：输入公开 Match ID，从 OpenDota 拉取比赛数据，用本地规则总结问题，并显示每名玩家的完整出装（含后备栏和中立装备）。
- 可选精简的屏幕边缘小窗，只显示「下一件 + 推荐装备」。它是普通置顶桌面窗口，不是注入式游戏内 overlay，因此只在无边框/窗口化模式下能盖在 Dota 上。
- 可选语音播报：用浏览器自带的语音合成把最优先的建议念出来（仅音频）。
- 可选手机第二屏：一键开启、只读、带 PIN 的视图，手机（同一 Wi-Fi）扫屏幕上的二维码即可打开；端口自动探测空闲值，主 API 仍只在 `127.0.0.1`。
- 可选 AI 教练：
  - 默认不需要 AI，使用本地规则解释。
  - 可选本地 Ollama 模型。
  - 可选 OpenAI-compatible 接口，由用户自己填写 endpoint 和 key。
- 上线测试清单：一个「一键准备」按钮（安装 GSI 配置 + 同步公开数据）。
- 安全诊断面板：显示本机配置、公开数据缓存、实时 GSI、推荐引擎状态，以及明确不包含的外挂式能力边界。

当前请求的 GSI 数据块：

- `provider`、`map`、`player`、`hero`
- `abilities`、`items`
- `allplayers`、`draft`
- `buildings`

应用会显示每个数据块本局是否实际收到。Dota 2 可能根据玩家、观战、BP 等状态限制字段。

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
- Dota 2 官方 GSI 在允许时提供的 `allplayers` / `draft` / `buildings` 字段。
- 玩家手动选择的局势标签。
- OpenDota 公开常量数据。
- OpenDota 公开比赛数据。
- 用户主动配置的 AI 接口，仅用于解释建议。

边缘小窗是用户点击按钮后移动到屏幕边缘的普通 Electron 窗口。它不附着到 Dota 2，不修改游戏，也不使用游戏内 overlay Hook。

可选的「手机查看」是一个**需要你手动开启的、独立的只读服务**：仅在开启期间绑定到局域网，由一次性 PIN 保护，且只暴露与桌面端相同的建议——它没有任何游戏数据输入，也无法改动任何状态。主 API 服务始终只绑定 `127.0.0.1`。它同样不与游戏进程发生任何交互，因此不改变上面的安全边界。开启时 Windows 防火墙可能会弹窗，需要你自己点「允许」。

这里的“自动”指自动分析 Dota 2 主动发送到 localhost 的只读 GSI 数据；不代表自动检查 Dota 2 进程、屏幕像素、内存、封包或敌方隐藏信息。

参考来源：

- OpenDota API 文档：https://docs.opendota.com/
- Dota 2 GSI 参考：https://docs.rs/dota-gsi
- Dota 2 更新页面：https://www.dota2.com/news/updates
- Steam VAC 支持页面：https://help.steampowered.com/en/faqs/view/571A-97DA-70E9-FF74

### 玩家如何使用

1. 从 GitHub Releases 下载 Windows 安装包或 zip。
2. 打开应用。
3. 在顶部点击 `一键准备`。它会安装本地 GSI 配置（含每台机器独立的 token）并同步 OpenDota 公开数据；不会修改 Steam 启动项。
4. 在 Steam 的 Dota 2 启动项里加入：

```text
-gamestateintegration
```

5. 启动 Dota 2 并进入比赛。
6. 可选：手动选择敌方英雄，让工具推断局势标签。
7. 可选：赛后输入 Match ID，查看基础 OpenDota 复盘。
8. 可选：点击 `手机查看`，用手机（同一 Wi-Fi）扫描屏幕上的二维码，在第二块屏幕上看建议。
9. 可选：点击 `语音`，让工具把最优先的建议念出来。
10. 可选：点击 `边缘小窗`，得到一个只显示「下一件 + 推荐」的置顶小窗（请把 Dota 设为无边框/窗口化模式，小窗才会显示在游戏上）。
11. 可选：查看 `安全诊断`，确认应用正在使用什么数据，以及它明确不会做什么。

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
