# Anonymous Usage Analytics / 匿名使用统计

This project includes optional, privacy-conscious `app_open` telemetry. It is **disabled by default**, and even after the operator configures an endpoint, no telemetry event is sent until the user explicitly opts in.

本项目支持可选的、隐私优先的 `app_open` 启动统计。它**默认关闭**；即使运营者配置了统计地址，在用户明确同意之前也不会发送遥测事件。

## What is sent / 会发送什么

After consent, the desktop app sends only:

- `event`: currently `app_open`
- app version
- event timestamp
- a locally generated random installation UUID, unless `sendInstallId` is `false`

用户同意后，仅发送：

- `event`：当前为 `app_open`
- 应用版本
- 事件时间
- 首次运行随机生成的 installation UUID（若 `sendInstallId=false` 则不发送）

The app does **not** intentionally send Steam ID, Dota account ID, Match ID, hero, inventory, gameplay state, machine name, hardware ID, email, memory contents, or device fingerprint.

软件**不会主动发送** Steam ID、Dota 账号 ID、Match ID、英雄、装备、比赛状态、机器名、硬件 ID、邮箱、内存内容或设备指纹。

The random installation UUID is not a hardware fingerprint. It exists only to estimate **anonymous unique installations**, not identified people. The recommended receiver hashes it immediately with a server-side secret and stores only the hash.

随机 installation UUID 不是硬件指纹，只用于估算**匿名独立安装数**，不代表已识别的自然人。推荐接收端在收到后立即使用服务器端密钥哈希，并只保存哈希结果。

> Any HTTP infrastructure can technically observe network metadata such as an IP address while transporting a request. Configure reverse proxies/CDNs/application logs not to retain unnecessary request metadata if you want a stricter privacy posture.
>
> 任何 HTTP 基础设施在传输请求时都可能在技术上接触来源 IP。若要采取更严格的隐私方案，应配置反向代理、CDN 和应用日志，不保留非必要的请求元数据。

## Consent / 用户同意

The local app exposes:

```text
GET  http://127.0.0.1:3008/api/telemetry/status
POST http://127.0.0.1:3008/api/telemetry/consent
```

The first-run UI asks the user to opt in or decline. Declining does not disable any app feature. Withdrawing consent deletes the locally stored random installation ID.

首次运行界面会让用户主动选择“同意匿名统计”或“不同意”。拒绝不会影响任何软件功能；撤回同意时，本地随机 installation ID 会被删除。

## Enable the collector / 配置统计接收端

Edit `config/telemetry.json` before packaging a release:

```json
{
  "enabled": true,
  "endpoint": "https://YOUR-COLLECTOR.example.com/events",
  "sendInstallId": true
}
```

`sendInstallId=true` lets the server estimate anonymous unique installations. `sendInstallId=false` limits statistics to aggregate app-open counts.

`sendInstallId=true` 可估算匿名独立安装数；`sendInstallId=false` 则只统计总启动次数。

## Recommended self-hosted receiver / 推荐自托管接收端

A dependency-free Node receiver is included at:

```text
telemetry/self-hosted-receiver.cjs
```

Configure:

```text
PORT=8788
TELEMETRY_HMAC_SECRET=<long random secret>
ADMIN_TOKEN=<long random secret>
DATA_FILE=/var/lib/dota2-help-tool/stats.json
```

Run:

```bash
node telemetry/self-hosted-receiver.cjs
```

Point the desktop app to:

```text
https://YOUR-HOST/events
```

View aggregate statistics with an admin token:

```text
GET https://YOUR-HOST/stats
Authorization: Bearer <ADMIN_TOKEN>
```

The response contains only aggregate values such as:

```json
{
  "totalOpens": 142,
  "anonymousUniqueInstalls": 37,
  "activeInstalls7d": 21,
  "activeInstalls30d": 33,
  "versions": {
    "0.14.1": 142
  }
}
```

The receiver intentionally does not persist the raw installation UUID; it stores an HMAC hash. Do not enable access logs containing unnecessary IP or request metadata unless you have a documented need and appropriate privacy basis.

接收端不会保存原始 installation UUID，只保存 HMAC 哈希。除非有明确、必要且已说明的用途，否则不要开启包含 IP 或其他请求元数据的持久访问日志。

## Email notification / 邮件通知

Email should be implemented only on the server side. Never put SMTP passwords, Resend API keys, Gmail credentials, or other secrets inside the Electron application.

邮件通知只应在服务器端实现。不要将 SMTP 密码、Resend API Key、Gmail 凭据等密钥放入 Electron 客户端。

For production, a daily summary is usually better than an email for every launch:

```text
Today
App opens: 142
Anonymous unique installations: 37
New installations: 8
```

生产环境更推荐每日汇总，而不是每次启动都发邮件：

```text
今日启动：142
匿名独立安装：37
新增安装：8
```

## China-focused distribution / 面向中国用户

For releases aimed at users in mainland China, keep telemetry disabled by default, obtain explicit consent before transmission, minimize fields, provide a withdrawal path, and assess the legal and cross-border implications of the actual hosting location and data flow before enabling telemetry. See `LEGAL.md`.

面向中国大陆用户发布时，应继续保持遥测默认关闭、传输前明确征得同意、最小化字段、提供撤回方式，并在正式启用前根据实际服务器所在地和数据流评估数据处理及跨境要求。详见 `LEGAL.md`。
