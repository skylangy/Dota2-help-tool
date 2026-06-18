# Dota 2 Help Tool

一个面向新手的 Dota 2 本地装备建议工具。项目目标是开源分发，让玩家下载安装到自己的电脑上运行，不需要域名、不需要云服务器、不需要账号系统。

当前 MVP 使用 Dota 2 Game State Integration 接收只读状态数据，并根据英雄、时间、金钱、已有物品和局势标签给出下一件装备建议。

## 产品形态

推荐形态是本地桌面应用：

- 玩家从 GitHub Releases 下载 Windows 安装包或 zip。
- 应用启动后在本机打开 `127.0.0.1:3008` GSI 接收服务。
- Dota 2 通过 GSI 把只读状态发送到本机。
- Electron 窗口展示实时建议。
- 所有逻辑和数据都在玩家电脑本地运行。
- 首次启动可在应用内点击“安装 GSI 配置”，减少手动复制文件的步骤。

这比做网站更适合本项目：不需要域名，也更符合“只读、本地、可审计”的安全边界。

## 安全边界

本项目只做学习建议，不做任何自动化游戏操作。

- 不读取 Dota 2 或 Steam 进程内存
- 不注入 DLL
- 不 Hook DirectX/Vulkan
- 不拦截或解析网络封包
- 不修改游戏文件
- 不自动买装备、放技能、移动或模拟输入
- 不提供战争迷雾外的隐藏信息

## 开发运行

安装依赖：

```bash
npm install
```

运行网页开发模式：

```bash
npm run dev
```

运行桌面开发模式：

```bash
npm run desktop
```

网页开发地址：

```text
http://127.0.0.1:5173
```

本地 GSI 接收地址：

```text
http://127.0.0.1:3008/gsi
```

页面里有“载入演示状态”按钮，可以在不开 Dota 2 的情况下验证推荐流程。

## 打包本地应用

生成未安装的 Windows 桌面包：

```bash
npm run pack
```

生成可分发安装包和 zip：

```bash
npm run dist
```

产物会输出到：

```text
release/
```

开源发布时，建议把 `release/` 里的安装包上传到 GitHub Releases，而不是提交进 git 仓库。

## Dota 2 GSI 配置

推荐方式：打开桌面应用后点击“安装 GSI 配置”。

手动方式：把这个文件复制到 Dota 2 的 GSI 配置目录：

```text
config/gamestate_integration_dota2_help_tool.cfg
```

常见目标目录类似：

```text
Steam\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration\
```

如果没有 `gamestate_integration` 文件夹，可以手动创建。

然后给 Dota 2 添加启动项：

```text
-gamestateintegration
```

启动本工具后再进入 Dota 2 比赛，工具会接收本机 GSI 数据。

## 当前功能

- Electron 本地桌面窗口
- 本地 HTTP GSI 接收服务
- WebSocket 实时推送到页面
- 当前英雄、时间、等级、金钱、物品显示
- GSI 配置检测和安装按钮
- 局势标签选择
- 基于规则的装备建议
- 示例英雄：主宰、幻影刺客、水晶室女、狙击手

## 开源建议

建议使用 MIT License，方便玩家、开发者和社区贡献者自由使用和二次开发。

推荐仓库结构：

```text
config/        Dota 2 GSI 配置模板
data/          英雄和物品知识库
electron/      桌面应用入口
server/        本地 GSI 服务和推荐逻辑
src/           React 实时面板
```

发布流程：

1. 更新版本号。
2. 运行 `npm run lint`、`npm run build`、`npm audit --audit-level=moderate`。
3. 运行 `npm run dist`。
4. 在 GitHub Releases 上传安装包和 zip。
5. 在 release note 里说明安全边界和数据来源。

建议上传的文件：

```text
release/Dota 2 Help Tool Setup 0.1.0.exe
release/Dota 2 Help Tool-0.1.0-win.zip
```

不建议上传：

```text
release/win-unpacked/
release/builder-debug.yml
node_modules/
dist/
```

## 下一步

- 扩展英雄和物品数据
- 增加敌方阵容手动选择
- 加入 OpenDota/STRATZ 战后复盘
- 增加装备购买时间线分析
- 增加首次启动时的 GSI 配置检测
