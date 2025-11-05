import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { Server } from "@modelcontextprotocol/sdk/server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const PORT = process.env.PORT || 3000;
const SSE_PATH = "/mcp";
const POST_PATH = "/mcp/messages";
const app = express();
const sessions = new Map();
const resourceUri = "ui://widget/hello-world.html";

const resource = {
  uri: resourceUri,
  name: "Hello World Widget",
  description: "HTML шаблон для Hello World MCP приложения",
  mimeType: "text/html+skybridge",
  _meta: {
    "openai/outputTemplate": resourceUri,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  },
};

const tool = {
  name: "show_hello_world",
  description: "Показать интерактивный Hello World интерфейс",
  title: "Show Hello World",
  inputSchema: { type: "object", properties: {} },
  _meta: {
    "openai/outputTemplate": resourceUri,
    "openai/toolInvocation/invoking": "Загружаю Hello World...",
    "openai/toolInvocation/invoked": "Приложение загружено!",
  },
};

function getHTMLContent() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.join(__dirname, "dist");

  let JS_CONTENT = "";
  let CSS_CONTENT = "";

  try {
    const files = fs.readdirSync(distPath);
    const jsFile = files.find((f) => f.startsWith("bundle.") && f.endsWith(".js"));
    const cssFile = files.find((f) => f.startsWith("styles.") && f.endsWith(".css"));

    if (jsFile) JS_CONTENT = fs.readFileSync(path.join(distPath, jsFile), "utf8");
    if (cssFile) CSS_CONTENT = fs.readFileSync(path.join(distPath, cssFile), "utf8");
  } catch {
    console.warn("⚠️ dist folder not found — run `npm run build` to generate assets.");
  }

  return `
    <div id="hello-world-root" class="container">
      <div class="card">
        <h1 id="greeting">Hello World!</h1>
        <p class="subtitle">Интерактивный MCP виджет на Express</p>
        <button id="changeTextBtn" class="btn">Изменить язык</button>
      </div>
    </div>
    ${CSS_CONTENT ? `<style>${CSS_CONTENT}</style>` : ""}
    ${JS_CONTENT ? `<script type="module">${JS_CONTENT}</script>` : ""}
  `.trim();
}

function createHelloServer() {
  const server = new Server(
    { name: "hello-world-app", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [tool] }));
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [resource] }));
  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    if (req.params.uri !== resourceUri) throw new Error("Unknown resource");
    return {
      contents: [{
        uri: resourceUri,
        mimeType: "text/html+skybridge",
        text: getHTMLContent(),
        _meta: resource._meta,
      }],
    };
  });
  server.setRequestHandler(CallToolRequestSchema, async () => ({
    content: [{
      type: "text",
      text: "Hello World приложение загружено! Нажмите кнопку, чтобы изменить язык.",
    }],
    structuredContent: { message: "Hello World!", timestamp: new Date().toISOString() },
    _meta: tool._meta,
  }));

  return server;
}

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, MCP-Session-Id");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get(
  [
    "/.well-known/openid-configuration",
    "/.well-known/oauth-authorization-server",
    "/.well-known/oauth-protected-resource",
    "/.well-known/openid-configuration/mcp",
    "/.well-known/oauth-authorization-server/mcp",
    "/.well-known/oauth-protected-resource/mcp",
  ],
  (req, res) => res.json({ issuer: `http://localhost:${PORT}` })
);

app.get(SSE_PATH, async (req, res) => {
  const server = createHelloServer();
  const transport = new SSEServerTransport(POST_PATH, res);
  sessions.set(transport.sessionId, { server, transport });

  transport.onclose = () => {
    if (sessions.has(transport.sessionId)) {
      sessions.delete(transport.sessionId);
    }
    console.log(`🧹 SSE session ${transport.sessionId} closed`);
  };

  await server.connect(transport);
});

app.post(POST_PATH, async (req, res) => {
  const sessionId = req.query.sessionId || req.headers["mcp-session-id"];
  if (!sessionId) return res.status(400).send("Missing sessionId");

  const session = sessions.get(sessionId);
  if (!session) return res.status(404).send("Unknown session");

  await session.transport.handlePostMessage(req, res, req.body || {});
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

createServer(app).listen(PORT, () => {
  console.log(`🚀 MCP server ready at http://localhost:${PORT}`);
  console.log(`📡 SSE: GET ${SSE_PATH}`);
  console.log(`📨 POST: ${POST_PATH}?sessionId=...`);
});