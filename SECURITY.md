# Security Policy

## Safety Model

Dota 2 Help Tool is designed as a local-only learning assistant.

- It listens only on `127.0.0.1`.
- It receives Dota 2 Game State Integration JSON from the local game client.
- It does not read or write process memory.
- It does not inject code into Dota 2, Steam, DirectX, or Vulkan.
- It does not capture packets.
- It does not automate input, item purchases, skills, camera, movement, or macros.

The GSI installer writes only one configuration file into Dota 2's `gamestate_integration` configuration directory after the user presses the install button.

## Reporting Issues

Please open a GitHub issue for security concerns. Do not attach private Steam account data, match data, or local filesystem screenshots unless required.
