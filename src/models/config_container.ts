import fs from 'node:fs';
import { URL } from 'node:url';
import { SSEClientTransportOptions } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransportOptions } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

type StdioServerConfig = Map<string, StdioServerParameters>;
export type SSEServerParameters = { url: URL; opts?: SSEClientTransportOptions };
type SSEServerConfig = Map<string, SSEServerParameters>;
export type StreamableHTTPServerParameters = { url: URL; opts?: StreamableHTTPClientTransportOptions };
type StreamableHTTPServerConfig = Map<string, StreamableHTTPServerParameters>;

/**
 * Root model to represent the entire JSON structure with dynamic keys.
 */
export class ConfigContainer {
	stdio: StdioServerConfig;
	sse: SSEServerConfig;
	streamable: StreamableHTTPServerConfig;

	constructor(stdio: StdioServerConfig, sse: SSEServerConfig, streamable: StreamableHTTPServerConfig) {
		this.stdio = stdio;
		this.sse = sse;
		this.streamable = streamable;
	}

	static fromFile(filePath: string): ConfigContainer {
		try {
			const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

			// Create a new ConfigContainer
			const container = new ConfigContainer(new Map(), new Map(), new Map());

			// Convert JSON object to Map entries
			if (Object.hasOwn(jsonData, 'stdio')) {
				Object.entries(jsonData.stdio).forEach(([key, value]) => {
					container.stdio.set(key, value as StdioServerParameters);
				});
			}
			if (Object.hasOwn(jsonData, 'sse')) {
				Object.entries(jsonData.sse).forEach(([key, value]) => {
					const rawParam = value as Record<string, any>;
					const sseParam: SSEServerParameters = {
						url: new URL(rawParam.url),
						opts: rawParam.opts,
					};
					container.sse.set(key, sseParam);
				});
			}
			if (Object.hasOwn(jsonData, 'streamable')) {
				Object.entries(jsonData.streamable).forEach(([key, value]) => {
					const rawParam = value as Record<string, any>;
					const streamableParam: StreamableHTTPServerParameters = {
						url: new URL(rawParam.url),
						opts: rawParam.opts,
					};
					container.streamable.set(key, streamableParam);
				});
			}

			return container;
		} catch (e) {
			throw new Error(`Error reading file: ${e}`);
		}
	}
}
