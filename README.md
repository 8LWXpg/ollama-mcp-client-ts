# Ollama MCP Client

A TypeScript client for connecting Ollama to Model Context Protocol (MCP).

## Overview

This client allows you to use Ollama models with applications that support the Model Context Protocol. It acts as a bridge between Ollama's API and the MCP standard.

## Prerequisites

- Node.js (v18+)
- npm
- Ollama server

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/8LWXpg/ollama-mcp-client-ts.git
cd ollama-mcp-client
npm install
```

## Building

Build the project with:

```bash
npm run build
```

To watch for changes during development:

```bash
npm run watch
```

## Debugging

### Using VSCode

1. Open the project in VSCode
1. Press F5

### Debugging Tips

- Check that Ollama is running and accessible at the URL you've specified
- Verify your MCP server configuration in the server.json file
- Enable more verbose logging if needed in your implementation

## License

MIT 