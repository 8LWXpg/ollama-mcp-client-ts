import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Tool } from 'ollama';

export class Session {
	public session: Client;
	public tools: Tool[];

	constructor(client: Client, tools: Tool[]) {
		this.session = client;
		this.tools = tools;
	}
}
