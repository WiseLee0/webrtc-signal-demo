const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8010 });
const code2ws = new Map();
wss.on("connection", (ws, request) => {
  const code = generateRandomCode();
  responseAdapter(ws);
  ws.on("message", (message) => {
    const parseMessage = getParseMessage(ws, message);
    if (!parseMessage) return;
    let { event, data } = parseMessage;
    switch (event) {
      case "getCode":
        code2ws.set(code, ws);
        ws.sendData("resCode", { code });
        break;
      case "connect":
        let remoteCode = +data.remoteCode;
        if (code2ws.has(remoteCode)) {
          let remoteWS = code2ws.get(remoteCode);
          ws.sendRemote = remoteWS.sendData;
          remoteWS.sendRemote = ws.sendData;
          ws.sendData("operate", { remoteCode, label: data.label });
          ws.sendRemote("receive", { remoteCode: code, label: data.label });
        } else {
          ws.sendData("notFound");
        }
        break;
      case "forward":
        ws.sendRemote(data.event, data.data);
        break;
    }
  });
  ws.on("close", () => {
    if (code2ws.has(code)) code2ws.delete(code);
    clearTimeout(ws._closeTimeout);
  });
  ws._closeTimeout = setTimeout(() => {
    ws.terminate();
  }, 10 * 60 * 1000);
});

function getParseMessage(ws, message) {
  try {
    return JSON.parse(message);
  } catch (error) {
    ws.sendError("解析错误");
    return null;
  }
}

function responseAdapter(ws) {
  ws.sendData = (event, data = {}) => {
    ws.send(JSON.stringify({ event, data }));
  };
  ws.sendError = (msg) => {
    ws.sendData("error", { msg });
  };
}

function generateRandomCode() {
  return Math.floor(Math.random() * (999999 - 100000)) + 100000;
}
