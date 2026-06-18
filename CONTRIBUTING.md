# Contributing

Thanks for helping improve Dota 2 Help Tool.

## Project Rules

Contributions must keep the tool local-only and read-only.

Do not add:

- Memory reading
- DLL injection
- DirectX/Vulkan hooks
- Packet capture
- Input automation
- Auto-buy, auto-cast, auto-move, or macros
- Hidden information from outside the player's normal view

## Development

```bash
npm install
npm run desktop
```

Before opening a pull request:

```bash
npm run lint
npm run build
npm audit --audit-level=moderate
```

For release builds:

```bash
npm run dist
```
