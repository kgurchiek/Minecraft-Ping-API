const net = require('net');
const varint = require('varint');
const fs = require('fs');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const minecraftData = require("minecraft-data");

function isCracked(ip, port, version, usesProtocol = false, callback) {
  setTimeout(function() {
    if (!hasResponded) callback("timeout");
  }, 4000);

  var protocol;
  if (usesProtocol) {
    protocol = version;
    version = minecraftData.postNettyVersionsByProtocolVersion.pc[protocol][0].minecraftVersion;
  } else {
    protocol = mcData.version.version;
  }
  const mcData = minecraftData(version);
  const username = `CrackedTest${Math.round(Math.random() * 1000)}`;
  var hasResponded = false;

  const client = new net.Socket();
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
  var packetLength = 0;

  setTimeout(function() {
    if (!hasResponded) {
      callback("timeout");
    }
  }, 5000);

  var hasResponded = false;
  var response = '';

  const client = new net.Socket();
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
    //client.destroy(); // kill client after server's response
    response += data.toString();

    if (packetLength == 0) packetLength = varint.decode(data) + 6;

    if (Buffer.byteLength(response) >= packetLength) {
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

function bedrockPing(ip, port, protocol, callback) {
  console.log('running bedrockping')
  setTimeout(function() {
    if (!hasResponded) {
      callback("timeout");
    }
  }, 5000);

  var hasResponded = false;
  var response = '';

  const client = new net.Socket();
  client.connect(port, ip, () => {
    const handshakePacket = Buffer.from([
      0x05, // packet ID
      0x00, // request ID
      0x00, // payload (empty)
      0x01 // payload (empty)
    ]);
    var packetLength = Buffer.alloc(1);
    packetLength.writeUInt8(handshakePacket.length);
    var buffer = Buffer.concat([packetLength, handshakePacket]);
    client.write(buffer);
  });

  client.on('data', (data) => {
    //client.destroy(); // kill client after server's response
    response += data.toString();

    if (Buffer.byteLength(response) >= varint.decode(data) + 6) {
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
    } else if ((args.version == null || args.version == '') && (args.protocol == null || args.protocol == '')) {
      response.write("ERROR: Missing variable 'version' or 'protocol'");
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
        if (result == 'timeout' || JSON.parse(result.substring(result.indexOf('{'))).favicon == null) {
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
          response.write(Buffer.from(JSON.parse(result.substring(result.indexOf('{'))).favicon.substring(22), 'base64'));
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
          response.write(result.substring(result.indexOf('{')));
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

      bedrockPing(args.ip, args.port, args.protocol, (result) => {
        if (result == 'timeout') {
          response.end(result);
        } else {
          response.write(result.substring(result.indexOf('{')));
          response.end();
        }
      });
    }
  }
}).listen(80, "0.0.0.0");
