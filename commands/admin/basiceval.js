const config = require("../../config.json");

/* eslint-disable-next-line no-unused-vars */
const core = require("../../coreFunctions.js");

const { string } = require("../../utils/strings");

module.exports = {
	controls: {
		name: "basiceval",
		permission: 0,
		usage: "eval <code>",
		description: "Runs code",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	/* eslint-disable-next-line no-unused-vars */
	do: async (message, client, args, Discord) => {
		const clean = (text) => {
			if (typeof (text) === "string") {
				return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
			} else {
				return text;
			}
		};
		const code = args.join(" ");
		if (code.toLowerCase().includes("delete") || code.toLowerCase().includes("token") || code.toLowerCase().includes("secret") || code.toLowerCase().includes("webhook") || code.toLowerCase().includes("process.env")) {
			message.reply(string("EVAL_FLAGGED_DESTRUCTIVE"))
				.then(async (checkMsg) => {
					await checkMsg.react(config.emoji.check);
					await checkMsg.react(config.emoji.x);
					let origcheck = config.emoji.check.split(":");
					let check = origcheck[origcheck.length - 1];
					let origx = config.emoji.x.split(":");
					let x = origx[origx.length - 1];

					const filter = (reaction, user) =>
						(reaction.emoji.id === check || reaction.emoji.id === x) &&
						user.id === message.author.id;
					await checkMsg
						.awaitReactions(filter, {
							time: 15000,
							max: 1,
							errors: ["time"]
						})
						.then((collected) => {
							if (collected.first().emoji.id === x) {
								checkMsg.edit(string("CANCELLED", {}, "error"));
								return checkMsg.clearReactions();
							} else {
								checkMsg.delete();
								evalCode(code);
							}
						});
				});
		} else return evalCode(code);

		async function evalCode (code) {
			try {
				let evaled = await eval(code);

				if (typeof evaled !== "string") {
					evaled = require("util").inspect(evaled);
				}

				if (args.splice(-1)[0] !== "//silent") {
					if (evaled.includes(process.env.TOKEN)) {
						return message.channel.send(":rotating_light: `CENSORED: TOKEN` :rotating_light:");
					} else {
						message.channel.send(clean(evaled).substring(0, 1900), { code: "xl" });
					}
				}
			} catch (err) {
				if (args.splice(-1)[0] !== "//silent") {
					if (err.toString().includes(process.env.TOKEN)) {
						return message.channel.send(":rotating_light: `CENSORED: TOKEN` :rotating_light:");
					} else {
						message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
					}
				}
			}
		}
	}
};
