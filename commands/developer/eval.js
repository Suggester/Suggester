const { runInNewContext } = require("vm");
const Discord = require("discord.js");
const chalk = require("chalk");
const { inspect } = require("util");
const fetch = require("node-fetch");
const { confirmation } = require("../../utils/actions");

const options = {
	callback: false,
	stdout: true,
	stderr: true
};

module.exports = {
	controls: {
		name: "eval",
		permission: 0,
		usage: "eval [code]",
		description: "Runs JavaScript code",
		examples: "`{{p}}eval return 2+2`\nEvaluates the value of 2+2 and returns it",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY"]
	},
	do: async (locale, message, client, args) => {
		if (!client.admins.has(message.author.id)) return;
		if (!args[0]) return await message.channel.send(":x: You must provide code to execute!");

		const script = parseCodeblock(args.join(" "));

		if (!(
			await confirmation(
				message,
				new Discord.MessageEmbed()
					.setTitle(":warning: Are you sure you would like to execute the following code:")
					.setDescription("```js\n" + script + "```")
					.setColor(client.colors.default),
				{
					deleteAfterReaction: true
				}
			)
		)) return;

		const context = {
			client,
			message,
			args,
			Discord,
			console,
			require,
			process,
			global
		};

		const scriptOptions = {
			filename: `${message.author.id}@${message.guild.id}`,
			timeout: 60000,
			displayErrors: true
		};

		let start = Date.now();
		let result = execute(`"use strict"; (async () => { ${script} })()`, context, scriptOptions);
		let end = Date.now();

		if (((await result) && !(await result).stdout) && ((await result) && !(await result).callbackOutput) && ((await result) && !(await result).stderr)) {
			if (!(
				await confirmation(
					message,
					":warning: Nothing was returned. Would you like to run the code again with implicit return?",
					{
						deleteAfterReaction: true
					}
				)
			)) return;
			else {
				start = Date.now();
				result = execute(`"use strict"; (async () => ${script} )()`, context, scriptOptions);
				end = Date.now();
			}
		}

		result
			.then(async (res) => {
				if (
					(options.stdout && res && res.stdout) ||
        (options.stderr && res && res.stderr) ||
        (options.callback && res && res.callbackOutput)
				) {
					console.log(chalk`{red {strikethrough -}[ {bold Eval Output} ]{strikethrough ---------}}`);
					if (options.callback && res.callbackOutput) console.log(res.callbackOutput);

					if (options.stdout && res.stdout) {
						console.log(chalk`{red {strikethrough -}[ {bold stdout} ]{strikethrough --------------}}`);
						console.log(res.stdout);
					}
					if (options.stderr && res.stderr) {
						console.log(chalk`{red {strikethrough -}[ {bold stderr} ]{strikethrough --------------}}`);
						console.error(res.stderr);
					}
					console.log(chalk`{red {strikethrough -}[ {bold End} ]{strikethrough -----------------}}`);
				}

				if (
					res.callbackOutput && (typeof res.callbackOutput === "string" ? res.callbackOutput : inspect(res.callbackOutput)).includes(client.token) ||
					res.stdout && res.stdout.includes(client.token) ||
					res.stderr && res.stderr.includes(client.token)
				) {
					if (!(
						await confirmation(
							message,
							":bangbang: The bot token is likely located somewhere in the output of your code. Would you like to display the output?",
							{
								deleteAfterReaction: true
							}
						)
					)) return;
				}
				const embed = await generateEmbed(script, res, { start, end });
				const msg = await message.channel.send({ embed: embed });

				if (!(
					await confirmation(
						message,
						":information_source: Would you like to post the output of this command on hastebin?",
						{
							deleteAfterReaction: true
						}
					)
				)) return;

				const evalOutput = [];

				if (res.callbackOutput) {
					evalOutput.push(
						"-[ Eval Output ]---------",
						typeof res.callbackOutput === "string" ? res.callbackOutput : inspect(res.callbackOutput)
					);
				}

				if (res.stdout) {
					evalOutput.push(
						"-[ stdout ]--------------",
						typeof res.stdout === "string" ? res.stdout : inspect(res.stdout)
					);
				}

				if (res.stderr) {
					evalOutput.push(
						"-[ stderr ]--------------",
						typeof res.stderr === "string" ? res.stderr : inspect(res.stderr)
					);
				}

				const body = await fetch("https://hastebin.com/documents", {
					method: "post",
					body: evalOutput.join("\n")
				})
					.then(async (res) => await res.json());

				await msg.edit({ embed: embed.addField(":notepad_spiral: Hastebin", `https://hastebin.com/${body.key}`) });
			});
	}
};

async function execute (code, context, options) {
	return await new Promise((resolve) => {
		try {
			captureOutput(() => runInNewContext(code, context, options))
				.then(resolve)
				.catch(resolve);
		} catch (err) {
			resolve(err);
		}
	});
}

async function generateEmbed (code, outs, { start, end }) {
	const output = typeof outs && outs.callbackOutput && outs.callbackOutput.then === "function" ? await outs && outs.callbackOutput : outs && outs.callbackOutput;
	const stdout = outs && outs.stdout;
	const stderr = outs && outs.stderr;

	const embed = new Discord.MessageEmbed()
		.setFooter(`Execution time: ${end - start}ms`)
		.setTimestamp();

	if (output) {
		embed
			.setTitle(":outbox_tray: Output:")
			.setDescription("```js\n" + ((typeof output === "string" ? output : inspect(output)) || "undefined").substring(0, 2000) + "```");
	}

	if (stdout) embed.addField(":desktop: stdout", "```js\n" + ((typeof stdout === "string" ? stdout : inspect(stdout)) || "undefined").substring(0, 1000) + "```");

	if (stderr) embed.addField(":warning: stderr", "```js\n" + ((typeof stderr === "string" ? stderr : inspect(stderr)) || "undefined").substring(0, 1000) + "```");

	if (!embed.fields.length && !embed.description) embed.setTitle("Nothing was returned.");

	if ((stdout && !isError(outs && outs.callbackOutput)) || (stdout && !output) || (!stdout && !output && !stderr)) embed.setColor("GREEN");
	else if (!stdout && !output && stderr) embed.setColor("YELLOW");
	else embed.setColor(isError(output) ? "RED" : "GREEN");

	embed.addField(":inbox_tray: Input", "```js\n" + code.substring(0, 1000) + "```");

	return embed;
}

function isError (object) {
	const name = object && object.constructor && object.constructor.name;
	if (!name) return true;
	return /.*Error$/.test(name);
}

// Code from: https://github.com/lifeguardbot/lifeguard/blob/a31f57b5164d95d16f0dd961c10a5b77dc9e7bd4/src/plugins/dev/eval.ts#L6-L13
function parseCodeblock (script) {
	const cbr = /^(([ \t]*`{3,4})([^\n]*)([\s\S]+?)(^[ \t]*\2))/gm;
	const result = cbr.exec(script);
	if (result) return result[4];
	return script;
}

/**
 * Capture stdout and stderr while executing a function
 * @param {Function} callback The callback function to execute
 * @returns {Promise<CapturedOutput>} stdout, stderr and callback outputs
 */
async function captureOutput (callback) {
	return await new Promise((resolve, reject) => {
		const oldProcess = { ...process };
		let stdout = "";
		let stderr = "";

		// overwrite stdout write function
		process.stdout.write = (str) => {
			stdout += str;
			return true;
		};

		// overwrite stderr write function
		process.stderr.write = (str) => {
			stderr += str;
			return true;
		};

		try {
			const c = callback();

			delete process.stdout.write;
			process.stdout.write = oldProcess.stdout.write;

			delete process.stderr.write;
			process.stderr.write = oldProcess.stderr.write;

			return c
				.catch((c) => reject({ stdout, stderr, callbackOutput: c })) // eslint-disable-line prefer-promise-reject-errors
				.then((callbackOutput) => resolve({ stdout, stderr, callbackOutput }));
		} catch (error) {
			delete process.stdout.write;
			process.stdout.write = oldProcess.stdout.write;

			delete process.stderr.write;
			process.stderr.write = oldProcess.stderr.write;
			return reject({ stdout, stderr, callbackOutput: error }); // eslint-disable-line prefer-promise-reject-errors
		}
	});
}
