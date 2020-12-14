const Discord = require("discord.js");
const { confirmation } = require("../../utils/actions");
const exec = (require("util").promisify((require("child_process").exec)));

function parseCodeblock (script) {
	const cbr = /^(([ \t]*`{3,4})([^\n]*)([\s\S]+?)(^[ \t]*\2))/gm;
	const result = cbr.exec(script);
	if (result) return result[4];
	return script;
}

module.exports = {
	controls: {
		name: "shell",
		permission: 0,
		usage: "shell [code]",
		aliases: ["exec"],
		description: "Runs shell code",
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
					.setTitle(":warning: Are you sure you would like to execute the following code in the shell:")
					.setDescription("```bash\n" + script + "```")
					.setColor(client.colors.default),
				{
					deleteAfterReaction: true
				}
			)
		)) return;

		function genEmbed(res) {
			let embed = new Discord.MessageEmbed()
				.setColor(res.stderr ? client.colors.red : client.colors.green)
				.addField(":inbox_tray: Input", `\`\`\`bash\n${script}\`\`\``);
			if (!res.stdout && !res.stderr) embed.addField(":outbox_tray: Result", "No Result");
			if (res.stdout) embed.addField(":outbox_tray: Result", `\`\`\`bash\n${res.stdout.substr(0, 1000)}\`\`\``);
			if (res.stderr) embed.addField(":exclamation: Error", `\`\`\`bash\n${res.stderr.substr(0, 1000)}\`\`\``);
			return embed;
		}

		return exec(script).then(res => {
			message.channel.send(genEmbed(res));
		}).catch((res) => {
			message.channel.send(genEmbed(res));
		});
	}
};
