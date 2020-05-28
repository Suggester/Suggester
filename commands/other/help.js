const { permLevelToRole } = require("../../utils/misc");
const { dbQuery } = require("../../utils/db");
const { checkConfig } = require("../../utils/checks");
const { MessageAttachment } = require("discord.js");
const { colors, prefix } = require("../../config.json");
const { string } = require("../../utils/strings");

module.exports = {
	controls: {
		name: "help",
		permission: 10,
		aliases: ["command", "howto", "prefix"],
		usage: "help (command name)",
		description: "Shows command information",
		image: "images/Help.gif",
		enabled: true,
		docs: "all/help",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		let missingConfig = checkConfig(qServerDB);
		let serverPrefix = (qServerDB && qServerDB.config && qServerDB.config.prefix) || prefix;

		if (!args[0]) {
			let embed = new Discord.MessageEmbed()
				.setDescription(string("HELP_BASE_DESCRIPTION"))
				.setFooter(string("HELP_PREFIX_INFO", { prefix: serverPrefix }))
				.setColor(colors.default);

			if (missingConfig) embed.addField(string("MISSING_CONFIG_TITLE"), string("MISSING_CONFIG_DESCRIPTION", { prefix: serverPrefix }));
			return message.channel.send(embed);
		}

		let commandName = args[0].toLowerCase();

		const command = client.commands.find((c) => c.controls.name.toLowerCase() === commandName || c.controls.aliases && c.controls.aliases.includes(commandName));

		if (!command) return;

		let commandInfo = command.controls;

		let returnEmbed = new Discord.MessageEmbed()
			.setColor(colors.default)
			.setDescription(commandInfo.description)
			.addField(string("HELP_PERMISSION_LEVEL"), permLevelToRole(commandInfo.permission), true)
			.addField(string("HELP_USAGE"), `\`${serverPrefix}${commandInfo.usage}\``, true)
			.setAuthor(commandName, client.user.displayAvatarURL({dynamic: true, format: "png"}));

		commandInfo.aliases ? returnEmbed.addField(string(commandInfo.aliases.length > 1 ? "HELP_ALIAS_PLURAL" : "HELP_ALIAS"), commandInfo.aliases.join(", ")) : "";
		if (commandInfo.docs && commandInfo.docs !== "") returnEmbed.addField(string("HELP_DOCUMENTATION"), `https://suggester.js.org/#/${commandInfo.docs}`);
		if (!commandInfo.enabled) returnEmbed.addField(string("HELP_ADDITIONAL_INFO"), `⚠️ ${string("COMMAND_DISABLED")}`);

		if (commandInfo.image) returnEmbed.attachFiles([new MessageAttachment(commandInfo.image, `image.${commandInfo.image.split(".")[1]}`)]).setImage(`attachment://image.${commandInfo.image.split(".")[1]}`);

		return message.channel.send(returnEmbed);

	}
};
