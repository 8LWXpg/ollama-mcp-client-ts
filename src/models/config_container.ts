import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransportOptions } from '@modelcontextprotocol/sdk/client/sse.js';
import fs from 'node:fs';
import { URL } from 'node:url';

type StdioServerConfig = Map<string, StdioServerParameters>;
export type SSEServerParameters = { url: URL; opts?: SSEClientTransportOptions };
type SSEServerConfig = Map<string, SSEServerParameters>;

/**
 * Root model to represent the entire JSON structure with dynamic keys.
 */
export class ConfigContainer {
	stdio: StdioServerConfig;
	sse: SSEServerConfig;

	constructor(stdio: StdioServerConfig, sse: SSEServerConfig) {
		this.stdio = stdio;
		this.sse = sse;
	}

	static fromFile(filePath: string): ConfigContainer {
		try {
			const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

			// Create a new ConfigContainer
			const container = new ConfigContainer(new Map(), new Map());

			// Convert JSON object to Map entries
			Object.entries(jsonData.stdio).forEach(([key, value]) => {
				container.stdio.set(key, value as StdioServerParameters);
			});
			Object.entries(jsonData.sse).forEach(([key, value]) => {
				container.sse.set(key, value as SSEServerParameters);
			});

			return container;
		} catch (e) {
			throw new Error(`Error reading file: ${e}`);
		}
	}
}
