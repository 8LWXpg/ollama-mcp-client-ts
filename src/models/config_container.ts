import { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'node:fs';

/**
 * Root model to represent the entire JSON structure with dynamic keys.
 */
export class ConfigContainer extends Map<string, StdioServerParameters> {
	static fromFile(filePath: string): ConfigContainer {
		try {
			const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

			// Create a new ConfigContainer
			const container = new ConfigContainer();

			// Convert JSON object to Map entries
			if (jsonData && typeof jsonData === 'object') {
				Object.entries(jsonData).forEach(([key, value]) => {
					container.set(key, value as StdioServerParameters);
				});
			}

			return container;
		} catch (e) {
			throw new Error(`Error reading file: ${e}`);
		}
	}
}
