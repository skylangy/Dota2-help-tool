# Anonymous Usage Analytics / 匿名使用统计

This project includes an optional privacy-first `app_open` event. It is **disabled by default**.

本项目支持一个可选的匿名 `app_open` 启动事件，**默认关闭**。

## What is sent / 会发送什么

When enabled, the desktop app sends only:

- `event`: currently `app_open`
- app version
- event timestamp
- OS platform (`win32`, `linux`, `darwin`)
- a locally generated random installation UUID, unless `sendInstallId` is set to `false`

开启后只会发送：

- `event`：当前为 `app_open`
- 应用版本
- 事件时间
- 操作系统平台
- 首次运行随机生成的 installation UUID（如果 `sendInstallId=false` 则不发送）

It does **not** intentionally send Steam ID, Dota account ID, match ID, hero, inventory, machine name, email, gameplay state, memory contents, or device fingerprint.

它**不会主动发送** Steam ID、Dota 账号 ID、Match ID、英雄、装备、机器名、邮箱、比赛状态、内存内容或设备指纹。

> Important: any HTTP server receiving a request may technically see network metadata such as source IP in its infrastructure logs. If you want a strict privacy setup, configure your collector to discard or avoid storing those logs.

> 注意：任何接收 HTTP 请求的服务器在基础设施层面都可能临时看到来源 IP。若希望严格隐私，请让你的收集端不保存或主动删除此类日志。

## Enable it / 开启方式

Edit `config/telemetry.json`:

```json
{
  "enabled": true,
  "endpoint": "https://YOUR-COLLECTOR.example.com/events",
  "sendInstallId": true
}
```

If `sendInstallId` is `true`, the collector can count approximate unique installations. If it is `false`, you can count app opens but cannot accurately count unique users.

如果 `sendInstallId=true`，服务端可以统计近似独立安装数；如果设为 `false`，只能统计启动次数，无法准确统计人数。

## Recommended architecture / 推荐架构

Use this flow:

```text
Dota 2 Help Tool
      |
      | anonymous app_open JSON
      v
Your Cloudflare Worker / small API / Apps Script
      |
      +--> increment launch counter
      +--> count unique installId
      +--> optional email notification
```

Do **not** put SMTP passwords, Resend API keys, Gmail credentials, or other email secrets inside the Electron app. Desktop application files can be inspected by users.

不要把 SMTP 密码、Resend API Key、Gmail 凭据等邮件密钥写进 Electron 客户端，因为桌面应用文件可以被用户查看。

## Email notification / 邮件提醒

If you want an email whenever a new installation is first seen, implement that logic in the collector:

```text
if installId has never been seen before:
    store installId
    increment unique_installations
    send owner email

always:
    increment app_open_count
```

A better production setup is usually a daily summary instead of one email per launch:

```text
Today
App opens: 142
Unique installations seen: 37
New installations: 8
```

生产环境更推荐每日汇总，而不是每次启动都发邮件，例如：

```text
今日
启动次数：142
独立安装：37
新增安装：8
```

## Status endpoint / 状态接口

The local server exposes:

```text
GET http://127.0.0.1:3008/api/telemetry/status
```

This reports whether telemetry is enabled and which privacy fields are intentionally excluded.
