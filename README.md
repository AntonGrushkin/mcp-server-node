# Hello World MCP Server

## Description

This project is an MCP (Model Context Protocol) server that provides an interactive Hello World widget. The application can be run as a standalone server or integrated with ChatGPT through the MCP protocol.

### Key Features

- 🚀 MCP server on Express with SSE (Server-Sent Events) support
- 🎨 Web interface
- 📦 Frontend build via Webpack
- 🔌 Integration with OpenAI/ChatGPT through MCP protocol

## Project Structure

```
mcp-server-node/
├── dist/             # Built files (generated during build)
├── src/              # Source files
│   ├── index.js      # Entry point
│   ├── script.js     # Widget logic
│   └── style.css     # Styles
├── server.js         # Express server with MCP
├── webpack.config.js # Webpack configuration
└── package.json      # Dependencies and scripts
```

## Installation and Running

1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

3. Start the server:

```bash
npm run serve
```

Server will be available at: `http://localhost:3000`

## API Endpoints

- `GET /mcp` - SSE endpoint for connecting MCP clients
- `POST /mcp/messages?sessionId=...` - Endpoint for sending MCP messages
- `GET /health` - Health check endpoint
- `GET /.well-known/*` - OpenID/OAuth configuration

### Tools

- `show_hello_world` - Show interactive Hello World interface

## Technologies

- **Node.js** - Runtime environment
- **Express** - Web server
- **@modelcontextprotocol/sdk** - MCP SDK for Node.js
- **Webpack** - Module bundler
- **HTML/CSS/JavaScript** - Frontend

## License

MIT

## Author

Project created as an example of MCP server integration with OpenAI/ChatGPT.

