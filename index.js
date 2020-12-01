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
