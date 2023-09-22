const net = require('net');
const dgram = require('dgram');
const varint = require('varint');
const fs = require('fs');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const minecraftData = require("minecraft-data");

function isCracked(ip, port, version, usesProtocol, callback) {
  const client = new net.Socket();
  setTimeout(function() {
    if (!hasResponded) callback("timeout");
    client.destroy();
  }, 4000);
 
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

  client.connect(port, ip, () => {
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
    client.write(buffer);

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
    buffer = Buffer.concat([packetLength, startLoginPacket]);

    client.write(buffer);
  });

  client.on('data', (data) => {
    client.destroy(); // kill client after server's response
    callback(data[1] != 1);
    hasResponded = true;
  });

  client.on('error', (err) => {
    //console.error(`Error: ${err}`);
  });

  client.on('close', () => {
    //console.log('Connection closed');
  });
}

function ping(ip, port, protocol, callback) {
  var jsonLength = 0;
  const client = new net.Socket();
  
  setTimeout(function() {
    if (!hasResponded) {
      client.destroy();
      callback("timeout");
    }
  }, 4000);

  var hasResponded = false;
  var response = '';

  client.connect(port, ip, () => {
    const handshakePacket = Buffer.concat([
      Buffer.from([0x00]), // packet ID
      Buffer.from(varint.encode(protocol)), //protocol version
      Buffer.from([ip.length]),
      Buffer.from(ip, 'utf-8'), // server address
      Buffer.from(new Uint16Array([port]).buffer).reverse(), // server port
      Buffer.from([0x01]) // next state (2)
    ]);
    var packetLength = Buffer.alloc(1);
    packetLength.writeUInt8(handshakePacket.length);
    var buffer = Buffer.concat([packetLength, handshakePacket]);
    client.write(buffer);

    const statusRequestPacket = Buffer.from([0x00]);
    packetLength = Buffer.alloc(1);
    packetLength.writeUInt8(statusRequestPacket.length);
    buffer = Buffer.concat([packetLength, statusRequestPacket]);
    client.write(buffer);
  });

  client.on('data', (data) => {
    if (jsonLength == 0) {
      varint.decode(data);
      const varint1Length = varint.decode.bytes;
      jsonLength = varint.decode(data.subarray(varint1Length + 1))
      const varint2Length = varint.decode.bytes;
      data = data.subarray(varint1Length + 1 + varint2Length);
    }
    response += data.toString();

    if (Buffer.byteLength(response) >= jsonLength) {
      client.destroy();
      callback(response);
      hasResponded = true;
    }
  });

  client.on('error', (err) => {
    //console.error(`Error: ${err}`);
  });

  client.on('close', () => {
    //console.log('Connection closed');
  });
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
  //console.log(request.url)
  args = querystring.parse(url.parse(request.url).query);
  if (url.parse(request.url).pathname == '/cracked/') {
    if (args.ip == null || args.ip == '') {
      response.write("ERROR: Missing variable 'ip'");
      response.end();
    } else if (args.port == null || args.port == '') {
      response.write("ERROR: Missing variable 'port'");
      response.end();
    } else {
      isCracked(args.ip, args.port, args.protocol == null || args.protocol == '' ? args.version : args.protocol, args.protocol != null && args.protocol != '', (result) => {
        response.write(result.toString());
        response.end();
      });
    }
  } else if (url.parse(request.url).pathname == '/favicon/') {
    args = querystring.parse(url.parse(request.url).query);
    if (args.ip == null || args.ip == '') {
      response.write("ERROR: Missing variable 'ip'");
      response.end();
    } else if (args.port == null || args.port == '') {
      response.write("ERROR: Missing variable 'port'");
      response.end();
    } else {
      if (args.protocol == null || args.protocol == '') args.protocol = 0;

      ping(args.ip, args.port, args.protocol, (result) => {
        if (result == 'timeout' || JSON.parse(result).favicon == null) {
          fs.readFile('default.png', (err, data) => {
            if (err) {
              response.statusCode = 500;
              response.end('Error reading file');
            } else {
              response.setHeader('Content-Type', 'image/png');
              response.end(data);
            }
          });
        } else {
          response.setHeader('Content-Type', 'image/png');
          response.write(Buffer.from(JSON.parse(result).favicon.substring(22), 'base64'));
          response.end();
        }
      });
    }
  } else if (url.parse(request.url).pathname == '/ping/') {
    args = querystring.parse(url.parse(request.url).query);
    if (args.ip == null || args.ip == '') {
      response.write("ERROR: Missing variable 'ip'");
      response.end();
    } else if (args.port == null || args.port == '') {
      response.write("ERROR: Missing variable 'port'");
      response.end();
    } else {
      if (args.protocol == null || args.protocol == '') args.protocol = 0;

      ping(args.ip, args.port, args.protocol, (result) => {
        if (result == 'timeout') {
          response.end(result);
        } else {
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.write(result);
          response.end();
        }
      });
    }
  } else if (url.parse(request.url).pathname == '/bedrockping/') {
    args = querystring.parse(url.parse(request.url).query);
    if (args.ip == null || args.ip == '') {
      response.write("ERROR: Missing variable 'ip'");
      response.end();
    } else if (args.port == null || args.port == '') {
      response.write("ERROR: Missing variable 'port'");
      response.end();
    } else {
      if (args.protocol == null || args.protocol == '') args.protocol = 0;

      bedrockPing(args.ip, args.port, (result) => {
        if (result == 'timeout') {
          response.end(result);
        } else {
          response.write(result.toString().substring(result.toString().indexOf('MC')));
          response.end();
        }
      });
    }
  }
}).listen(80, "0.0.0.0");
