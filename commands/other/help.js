const { dbQuery, checkPermissions, permLevelToRole } = require("../../coreFunctions");
const { colors, prefix } = require("../../config.json");

module.exports = {
	controls: {
		name: "help",
		permission: 10,
		aliases: ["command", "howto"],
		usage: "help <command name>",
		description: "Shows command information",
		enabled: true,
		docs: "all/help",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let permission = await checkPermissions(message.member, client);
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		let serverPrefix = (qServerDB && qServerDB.config && qServerDB.config.prefix) || prefix;
		if (!args[0]) {
			let embed = new Discord.MessageEmbed()
				.setDescription("Please see https://suggester.gitbook.io/ for a command list and usage information!")
				.setFooter(`My prefix in this server is ${serverPrefix}`)
				.setColor(colors.default);
			return message.channel.send(embed);
		}

		let commandName = args[0].toLowerCase();

		const command = client.commands.find((c) => c.controls.name.toLowerCase() === commandName || c.controls.aliases && c.controls.aliases.includes(commandName));

		if (!command) return;

		if (permission > command.controls.permission) return;

		let commandInfo = command.controls;

		let returnEmbed = new Discord.MessageEmbed()
			.setColor(colors.default)
			.setDescription(commandInfo.description)
			.addField("Permission Level", permLevelToRole(commandInfo.permission), true)
			.addField("Usage", `\`${serverPrefix}${commandInfo.usage}\``, true)
			.setAuthor(`Command: ${commandName}`, client.user.displayAvatarURL({dynamic: true, format: "png"}));

		commandInfo.aliases ? returnEmbed.addField(commandInfo.aliases.length > 1 ? "Aliases" : "Alias", commandInfo.aliases.join(", ")) : "";
		if (commandInfo.docs && commandInfo.docs !== "") returnEmbed.addField("Documentation", `https://suggester.gitbook.io/docs/${commandInfo.docs}`);
		if (!commandInfo.enabled) returnEmbed.addField("Additional Information", "⚠️ This command is currently disabled");

		return message.channel.send(returnEmbed);

	}
};
