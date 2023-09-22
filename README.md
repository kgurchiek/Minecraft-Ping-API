# Minecraft-Ping-API
An API to status ping Minecraft servers

## /ping
Pings a Minecraft Java Edition server to get its status info.

### Syntax
#### ip
The ip of the Minecraft server to ping.

#### port
The port of the Minecraft server to ping.

#### protocol (optional)
The Minecraft protocol to ping the server with. Defaults to 0.

Example usage:
Ping CubeCraft: https://ping.cornbread2100.com/ping/?ip=play.cubecraft.net&port=25565&protocol=761

## /favicon
Gets the favicon of a Minecraft server.

### Syntax
Same as /ping

Example usage:
CubeCraft's favicon: https://ping.cornbread2100.com/favicon/?ip=play.cubecraft.net&port=25565&protocol=761

<div>
    <img src="https://ping.cornbread2100.com/favicon/?ip=play.cubecraft.net&port=25565" alt="CubeCraft Logo"/>
</div>

## /bedrockping
Pings a Minecraft Bedrock Edition server

### Syntax
#### ip
The ip of the Minecraft server to ping.

#### port
The port of the Minecraft server to ping.

Example usage:
Ping CubeCraft: https://ping.cornbread2100.com/bedrockping/?ip=play.cubecraft.net&port=19132

## /cracked
Returns whether or not a Minecraft server is cracked (offline-mode)

### Syntax
#### ip
The ip of the Minecraft server.

#### port
The port of the Minecraft server.

#### version
The version of the Mineccraft server.

Example usage:
Check if CubeCraft is cracked: https://ping.cornbread2100.com/cracked/?ip=play.cubecraft.net&port=25565&version=1.19.3

## Try it out
This api is currently hosted at https://ping.cornbread2100.com.
