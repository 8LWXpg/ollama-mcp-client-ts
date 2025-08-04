import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { Ollama, Tool, ToolCall } from 'ollama';
import { ConfigContainer } from './models/config_container.js';
import { Session } from './models/session.js';
import { Message } from './types/message.js';

const SYSTEM_PROMPT = `You are a helpful assistant capable of accessing external functions and engaging in casual chat.
Use the responses from these function calls to provide accurate and informative answers.
The answers should be natural and hide the fact that you are using tools to access real-time information.
Guide the user about available tools and their capabilities.
Always utilize tools to access real-time information when required.
Engage in a friendly manner to enhance the chat experience.

# Notes

- Ensure responses are based on the latest information available from function calls.
- Maintain an engaging, supportive, and friendly tone throughout the dialogue.
- Always highlight the potential of available tools to assist users comprehensively.`;

export class OllamaMCPClient {
	public logger;
	private ollama: Ollama;
	private servers: Map<string, Session>;
	private selected_servers: Map<string, Session>;
	private message: Message[];

	constructor(host?: string) {
		// Poor man's logger
		this.logger = {
			debug: (msg: string, ...args: any[]) => console.log('\x1b[90m[DEBUG]\x1b[0m', msg, ...args),
			info: (msg: string, ...args: any[]) => console.log('\x1b[36m[INFO]\x1b[0m', msg, ...args),
			warn: (msg: string, ...args: any[]) => console.log('\x1b[33m[WARN]\x1b[0m', msg, ...args),
			error: (msg: string, ...args: any[]) => console.log('\x1b[31m[ERROR]\x1b[0m', msg, ...args),
		};

		this.ollama = new Ollama({ host: host });
		this.servers = new Map();
		this.selected_servers = new Map();
		this.message = [];
	}

	async cleanup(): Promise<void> {
		for (const server of this.servers.values()) {
			await server.session.close();
		}
	}

	static async create(config: ConfigContainer, host?: string): Promise<OllamaMCPClient> {
		const client = new OllamaMCPClient(host);
		await client.connectToMultipleServers(config);
		return client;
	}

	private async connectToMultipleServers(config: ConfigContainer): Promise<void> {
		for (const [name, param] of config.stdio.entries()) {
			const [client, tools] = await this.connectToServer(name, new StdioClientTransport(param));
			const session = new Session(client, tools);
			this.servers.set(name, session);
			this.selected_servers.set(name, session);
		}
		for (const [name, param] of config.sse.entries()) {
			const [client, tools] = await this.connectToServer(name, new SSEClientTransport(param.url, param.opts));
			const session = new Session(client, tools);
			this.servers.set(name, session);
			this.selected_servers.set(name, session);
		}
		for (const [name, param] of config.streamable.entries()) {
			const [client, tools] = await this.connectToServer(
				name,
				new StreamableHTTPClientTransport(param.url, param.opts),
			);
			const session = new Session(client, tools);
			this.servers.set(name, session);
			this.selected_servers.set(name, session);
		}

		this.logger.info(
			`Connected to server with tools: ${this.getTools()
				.map((tool) => tool.function.name)
				.join(', ')}`,
		);
	}

	private async connectToServer(name: string, transport: Transport): Promise<[Client, Tool[]]> {
		const client = new Client({
			name: 'ollama-mcp-client',
			version: '1.0.0',
		});
		await client.connect(transport);

		const response = await client.listTools();

		const tools = response.tools.map((tool) => ({
			type: 'function',
			function: {
				name: `${name}/${tool.name}`,
				description: tool.description || '',
				parameters: {
					type: tool.inputSchema.type,
					required: tool.inputSchema.required || [],
					properties: tool.inputSchema.properties,
				},
			},
		})) as Tool[];

		return [client, tools];
	}

	getTools(): Tool[] {
		return Array.from(this.selected_servers.values()).flatMap((server) => server.tools);
	}

	selectServer(servers: string[]): OllamaMCPClient {
		this.selected_servers.clear();

		for (const serverName of servers) {
			const server = this.servers.get(serverName);
			if (server) {
				this.selected_servers.set(serverName, server);
			}
		}

		this.logger.info('Selected servers', Array.from(this.selected_servers.keys()));
		return this;
	}

	async preparePrompt() {
		this.message.push({
			role: 'system',
			content: SYSTEM_PROMPT,
		});
	}

	async *processMessage(message: string, model?: string): AsyncIterable<Message> {
		model = model || 'qwen2.5:14b';
		this.message.push({
			role: 'user',
			content: message,
		});

		yield* this.recursivePrompt(model);
	}

	private async *recursivePrompt(model: string): AsyncIterable<Message> {
		this.logger.debug('Prompting');
		let stream = await this.ollama.chat({
			model,
			messages: this.message,
			tools: this.getTools(),
			stream: true,
		});

		let tool_message_coount = 0;
		for await (const part of stream) {
			if (part.message.content) {
				yield { role: 'assistant', content: part.message.content };
			} else if (part.message.tool_calls) {
				this.logger.debug(`Calling tool: ${JSON.stringify(part.message.tool_calls)}`);
				const tool_messages = await this.toolCall(part.message.tool_calls);
				tool_message_coount++;
				for (const tool_message of tool_messages) {
					this.message.push({ role: 'tool', content: tool_message });
					yield { role: 'tool', content: tool_message };
				}
			}
		}

		if (tool_message_coount > 0) {
			yield* this.recursivePrompt(model);
		}
	}

	private async toolCall(tool_calls: ToolCall[]): Promise<string[]> {
		let messages: string[] = [];
		for (const tool of tool_calls) {
			const split = tool.function.name.split('/');
			const session = this.selected_servers.get(split[0])?.session;
			if (!session) {
				this.logger.error(`Session not found for tool ${tool.function.name}`);
				continue;
			}
			const tool_name = split[1];
			const tool_args = tool.function.arguments;

			let message: string;
			try {
				const result = await session.callTool({ name: tool_name, arguments: tool_args });
				this.logger.debug(`Tool call result: ${JSON.stringify(result.content)}`);
				message = `tool: ${tool.function.name}\nargs: ${tool_args}\nreturn: ${JSON.stringify(result.content)}`;
			} catch (e) {
				this.logger.error(`Error calling tool ${tool_name}: ${e}`);
				message = `Error calling tool: ${tool_name}\nargs: ${tool_args}\n${e}`;
			}
			messages.push(message);
		}

		return messages;
	}
}
