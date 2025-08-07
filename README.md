# Ollama MCP Client

A TypeScript client for connecting Ollama to Model Context Protocol (MCP).

## Prerequisites

- [Bun](https://bun.com/)
- Ollama

## Running

### Edit example config

```jsonc
{
    "stdio": {
        "server-name": {
            "command": "command",
            "args": ["args"]
        }
    },
    "sse": {
        "server-name": {
            "url": "http://localhost:3001/sse"
        }
    },
    "streamable": {
        "server-name": {
            "url": "http://localhost:8000/mcp"
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
    streamable: Map<string, StreamableHTTPServerParameters>
}
```

### Edit Ollama Host Address

edit host address in [`cli.ts`](./src/example/cli.ts)

### Run Example CLI

```shell
bun i
bun run cli
```
