# Minecraft-Ping-API
An API to check the status of Minecraft servers

## /ping
Retrieve status information for a Minecraft Java Edition server.

### Usage
#### Parameters
- `ip`: The IP address of the Minecraft server. Example: `play.cubecraft.net`
- `port`: The port of the Minecraft server. Example: `25565`
- `protocol` (optional): The Minecraft protocol to use for pinging (defaults to 0). Example: `761`

Example to ping CubeCraft: `https://ping.cornbread2100.com/ping/?ip=play.cubecraft.net&port=25565&protocol=761`

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
