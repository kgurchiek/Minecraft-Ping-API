# Minecraft-Ping-API
<div align="center">
    <a href="https://discord.gg/DYeWwvveKn"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"/></a>
    <a href="https://www.buymeacoffee.com/cornbread2100"><img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"/></a>
    <a href="https://nodejs.org/en"><img src="https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white&style=for-the-badge" alt="Node.js"/></a>
    <a href="https://github.com/kgurchiek/Minecraft-Ping-API"><img src="https://img.shields.io/github/last-commit/kgurchiek/Minecraft-Ping-API?style=for-the-badge&logo=github&logoColor=white&logoWidth=20"/></a>
    <br>
    <img src="https://github.com/nikolan123/Minecraft-Ping-API/blob/main/logo.png?raw=true" alt="Minecraft Ping API Logo" width="20%"/>
</div>

## 📝 About
An API to check the status of Minecraft servers. This is currently hosted at https://ping.cornbread2100.com

## 💻 Usage

| Endpoint | Description | Arguments | Example |
| --- | --- | --- | --- |
| /ping | Retrieve status information for a Minecraft Java Edition server | `ip`, `port`, `protocol` (optional, default: 0) | Ping CubeCraft: https://ping.cornbread2100.com/ping/?ip=play.cubecraft.net&port=25565&protocol=761 |
| /favicon | Gets the favicon/thumbnail of a Minecraft Java Edition server | `ip`, `port`, `protocol` (optional, default: 0) | Get CubeCraft's favivon: https://ping.cornbread2100.com/favicon/?ip=play.cubecraft.net&port=25565&protocol=761 |
| /bedrockping | Retrieve status information for a Minecraft Bedrock Edition server | `ip`, `port` | Ping CubeCraft: https://ping.cornbread2100.com/bedrockping/?ip=play.cubecraft.net&port=19132 |
| /cracked | Returns whether or not a Minecraft Java Edition server is cracked (offline-mode) | `ip`, `port`, `version`/`protocol` (optional, default: 1.20.1. Only `version` or `protocol` is needed, not both) | Check if CubeCraft is cracked: https://ping.cornbread2100.com/cracked/?ip=play.cubecraft.net&port=25565&version=1.19.3 |