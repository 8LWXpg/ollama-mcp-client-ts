import { exit } from 'node:process';
import readline from 'node:readline';
import { OllamaMCPClient } from '../index.js';
import { ConfigContainer } from '../models/config_container.js';

async function main() {
	if (!process.argv[2]) {
		console.log('Usage: ollama-mcp-client <path-to-config.json>');
		exit(1);
	}
	const config = ConfigContainer.fromFile(process.argv[2]);
	const client = await OllamaMCPClient.create(config, 'http://192.168.0.33:11434');

	console.log('MCP Client ready');
	console.log(`Chat or type 'quit' to quit`);

	// Create readline interface once, outside the loop
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	// Promisify the question method for easier async usage
	const question = (prompt: string) =>
		new Promise<string>((resolve) => {
			rl.question(prompt, resolve);
		});

	try {
		while (true) {
			const input = await question('Chat: ');

			// Use switch instead of if for command handling
			switch (input.toLowerCase()) {
				case 'quit':
					break;

				case 'clear':
					await client.preparePrompt();
					continue;

				default:
					for await (const message of client.processMessage(input)) {
						if (message.role === 'assistant') {
							process.stdout.write(message.content);
						}
					}
					process.stdout.write('\n');
			}

			// Break out of while loop on quit/exit
			if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
				break;
			}
		}
	} catch (error) {
		console.error('Error:', error);
	} finally {
		// Clean up resources
		await client.cleanup();
		rl.close();
	}
}

// Start the application
main();
