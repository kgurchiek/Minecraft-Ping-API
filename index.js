const dgram = require('dgram');
const varint = require('varint');
const fs = require('fs');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const minecraftData = require("minecraft-data");
const send = require('./send.js');

async function isCracked(ip, port, version, usesProtocol, callback) {
  if (version == null) version = usesProtocol ? 763 : '1.20.1';

  var protocol;
  if (usesProtocol) {
    if (minecraftData.postNettyVersionsByProtocolVersion.pc[version] == null) {
      version = '1.20.1'
      protocol = 763;
    } else {
      protocol = version;
      version = minecraftData.postNettyVersionsByProtocolVersion.pc[version][0].minecraftVersion;
    }
  } else {
    protocol = minecraftData(version).version.version;
  }
  const mcData = minecraftData(version);
  const username = `CrackedTest${Math.round(Math.random() * 1000)}`;
  var hasResponded = false;

  const handshakePacket = Buffer.concat([
    Buffer.from([0x00]), // packet ID
    Buffer.from(varint.encode(protocol)), //protocol version
    Buffer.from([ip.length]),
    Buffer.from(ip, 'utf-8'), // server address
    Buffer.from(new Uint16Array([port]).buffer).reverse(), // server port
    Buffer.from([0x02]) // next state (2)
  ]);
   var packetLength = Buffer.alloc(1);
  packetLength.writeUInt8(handshakePacket.length);
  var buffer = Buffer.concat([packetLength, handshakePacket]);

  const packetFormat = mcData.protocol.login.toServer.types.packet_login_start[1];
  var buffers = [Buffer.from([0x00])];
  for (var i = 0; i < packetFormat.length; i++) {
    if (packetFormat[i].type.includes('option')) {
      buffers.push(Buffer.from([0x00]));
    } else {
      switch (packetFormat[i].name) {
        case 'username':
          buffers.push(Buffer.from([username.length])); // length of username
          buffers.push(Buffer.from(username, 'utf-8')); // username
          break;
        default:
          break;
      }
    }
  }

  const startLoginPacket = Buffer.concat(buffers);
  packetLength = Buffer.alloc(1);
  packetLength.writeUInt8(startLoginPacket.length);
  const response = await send(ip, port, Buffer.concat([buffer, packetLength, startLoginPacket]), 6000);
  if (typeof response == 'string') callback(`Error: ${response}`);
  else callback(response[0] == 0 ? 'unknown' : (response[0] != 1));
}

async function ping(ip, port, protocol, callback) {
  const handshakePacket = Buffer.concat([
    Buffer.from([0x00]), // packet ID
    Buffer.from(varint.encode(protocol)), //protocol version
    Buffer.from([ip.length]),
    Buffer.from(ip, 'utf-8'), // server address
    Buffer.from(new Uint16Array([port]).buffer).reverse(), // server port
    Buffer.from([0x01]), // next state (2)
    Buffer.from([0x01]), // second packet length
    Buffer.from([0x00]) // status request
  ]);
  var packetLength = Buffer.alloc(1);
  packetLength.writeUInt8(handshakePacket.length - 2);
  var buffer = Buffer.concat([packetLength, handshakePacket]);
  var response = await send(ip, port, buffer, 6000);
  if (typeof response == 'string') {
    callback(`Error: ${response}`);
    return;
  }
  if (response[0] != 0) {
    callback('Error: not a Minecraft server');
    return;
  }
  response = response.subarray(1);
  const fieldLength = varint.decode(response);
  response = response.subarray(varint.decode.bytes, fieldLength + varint.decode.bytes).toString();
  try {
    callback(JSON.parse(response));
  } catch (error) {
    //console.log(error, response)
    callback(`Error: ${error}`);
  }
}

function bedrockPing(ip, port, callback) {
  const client = dgram.createSocket('udp4');
  setTimeout(function () {
    if (!hasResponded) {
      callback('timeout');
      client.close();
    }
  }, 5000);

  var hasResponded = false;

  const time = BigInt(Date.now());
  const magic = Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex');
  const clientGUID = Buffer.allocUnsafe(8);
  clientGUID.writeInt32BE(12345, 0);
  const timeBuffer = Buffer.allocUnsafe(8);
  timeBuffer.writeBigInt64BE(time, 0);
  const packet = Buffer.concat([Buffer.from([0x01]), timeBuffer, magic, clientGUID]);
  client.on('error', (err) => {
    console.error(`Error: ${err}`); 
    client.close(); 
  });
  client.send(packet, port, ip, (err) => {
    if (err) { 
      console.error(`Error sending packet: ${err}`);
      client.close();
    }
  });
  client.on('message', (message, remote) => {
      hasResponded = true;
      callback(message);
      client.close();
  });
}

http.createServer(function(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Allow-Headers', '*');
	response.setHeader('Access-Control-Request-Method', '*');
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	//console.log(request.url)
  args = querystring.parse(url.parse(request.url).query);
  if (url.parse(request.url).pathname == '/cracked') {
    console.log(args)
    if (args.ip == null || args.ip == '') {
      response.statusCode = 400;
      response.write("ERROR: Missing variable 'ip'");
      response.end();
    } else if (args.port == null || args.port == '') {
      response.statusCode = 400;
      response.write("ERROR: Missing variable 'port'");
      response.end();
    } else {
      isCracked(args.ip, args.port, (args.protocol == null || args.protocol == '') ? args.version : args.protocol, args.protocol != null && args.protocol != '', (result) => {
        response.write(result.toString());
        response.end();
      });
    }
  } else if (url.parse(request.url).pathname == '/favicon') {
    if (args.ip == null || args.ip == '') {
      response.statusCode = 400;
      response.write("ERROR: Missing variable 'ip'");
      response.end();
    } else if (args.port == null || args.port == '') {
      response.statusCode = 400;
      response.write("ERROR: Missing variable 'port'");
      response.end();
    } else {
      if (args.protocol == null || args.protocol == '') args.protocol = 0;

      ping(args.ip, args.port, args.protocol, (result) => {
        if (typeof result == 'string') {
          if (result == 'Error: timeout') response.statusCode = 408;
          else response.statusCode = 500;
          response.end(result);
        } else if (result.favicon == null) {
          fs.readFile('default.png', (err, data) => {
            if (err) {
              response.statusCode = 500;
              response.end('Default favicon (error reading file)');
            } else {
              response.setHeader('Content-Type', 'image/png');
              response.setHeader('Content-Length', Buffer.byteLength(data, 'utf-8'));
              response.end(data);
            }
          });
        } else {
          const data = Buffer.from(result.favicon.substring(22), 'base64');
          response.setHeader('Content-Type', 'image/png');
          response.setHeader('Content-Length', data.length);
          response.write(data);
          response.end();
        }
      });
    }
  } else if (url.parse(request.url).pathname == '/ping') {
    if (args.ip == null || args.ip == '') {
      response.statusCode = 400;
      response.write("ERROR: Missing variable 'ip'");
      response.end();
    } else if (args.port == null || args.port == '') {
      response.statusCode = 400;
      response.write("ERROR: Missing variable 'port'");
      response.end();
    } else {
      if (args.protocol == null || args.protocol == '') args.protocol = 0;

      ping(args.ip, args.port, args.protocol, (result) => {
        if (typeof result == 'string') {
          if (result == 'Error: timeout') response.statusCode = 408;
          else response.statusCode = 500;
          response.end(result);
        } else {
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.write(JSON.stringify(result));
          response.end();
        }
      });
    }
  } else if (url.parse(request.url).pathname == '/bedrockping') {
    if (args.ip == null || args.ip == '') {
      response.statusCode = 400;
      response.write("ERROR: Missing variable 'ip'");
      response.end();
    } else if (args.port == null || args.port == '') {
      response.statusCode = 400;
      response.write("ERROR: Missing variable 'port'");
      response.end();
    } else {
      if (args.protocol == null || args.protocol == '') args.protocol = 0;

      bedrockPing(args.ip, args.port, (result) => {
        if (result == 'timeout') {
          response.statusCode = 408;
          response.end(result);
        } else {
          response.write(result.toString().substring(result.toString().indexOf('MC')));
          response.end();
        }
      });
    }
  }
}).listen(80, "0.0.0.0");
