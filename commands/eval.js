const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 0,
		usage: "eval <code>",
		description: "Runs code",
		enabled: true,
		hidden: false,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async (message, client, args, Discord) => {
		const clean = (text) => {
			if (typeof (text) === "string") {
				return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
			} else {
				return text;
			}
		};
		const code = args.join(" ");
		if (code.toLowerCase().includes("delete") || code.toLowerCase().includes("token") || code.toLowerCase().includes("secret") || code.toLowerCase().includes("webhook")) {
			message.reply(`:warning: **PLEASE REREAD YOUR COMMAND** :warning:\nThis command has been flagged as possibly destructive, please ensure:\n- You are using the right prefix\n- You know what you are deleting/exposing\n- You want to do this\n\nClick <:${config.emoji.check}> to proceed with the eval command, click <:${config.emoji.x}> to abort the eval command.`)
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
								checkMsg.edit(`<:${config.emoji.x}> **Eval Cancelled**`);
								return checkMsg.clearReactions();
							} else {
								checkMsg.delete();
								evalCode(code);
							}
						});
				});
		} else return evalCode(code);

		function evalCode (code) {
			try {
				let evaled = eval(code);

				if (typeof evaled !== "string") {
					evaled = require("util").inspect(evaled);
				}

				if (args.splice(-1)[0] !== "//silent") {
					if (evaled.includes(process.env.TOKEN)) {
						return message.channel.send(":rotating_light: `CENSORED: TOKEN` :rotating_light:");
					} else {
						message.channel.send(clean(evaled), { code: "xl" });
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

