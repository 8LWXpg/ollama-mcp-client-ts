# Ollama MCP Client

A TypeScript client for connecting Ollama to Model Context Protocol (MCP).

## Prerequisites

- Node.js
- Ollama server

## Running

### Edit example config

```json
{
    "sse": {
        "server-name": {
            "url": "http://localhost:3001/sse"
        }
    },
    "stdio": {
        "server-name": {
            "command": "command",
            "args": ["args"]
        }
    }
}
```

Check [`config_container.ts`](./src/models/config_container.ts) for more detail.

In short, it's basically the following type:

```ts
{
    stdio: Map<string, StdioServerParameters>
    sse: Map<string, SSEServerParameters>
}
```

### Edit Ollama Host Address

edit host address in [`cli.ts`](./src/example/cli.ts)

### Run Example CLI

```shell
npm i
npm run cli
```

## TODO

Support Streamable HTTP and deprecate SSE.
