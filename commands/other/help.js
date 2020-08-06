const { permLevelToRole } = require("../../utils/misc");
const { dbQuery } = require("../../utils/db");
const { checkConfig, checkPermissions } = require("../../utils/checks");
const { MessageAttachment } = require("discord.js");
const { prefix, support_invite } = require("../../config.json");
const { url } = require("./invite");
const { string } = require("../../utils/strings");

module.exports = {
	controls: {
		name: "help",
		permission: 10,
		aliases: ["command", "howto", "prefix"],
		usage: "help (command name)",
		description: "Shows command information",
		examples: "`{{p}}help`\nShows the list of commands\n\n`{{p}}help suggest`\nShows information about the \"suggest\" command",
		image: "images/Help.gif",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		dmAvailable: true
	},
	do: async (locale, message, client, args, Discord) => {
		let serverPrefix = prefix;
		let missingConfig;
		if (message.guild) {
			let qServerDB = await dbQuery("Server", { id: message.guild.id });
			missingConfig = await checkConfig(locale, qServerDB, client);
			serverPrefix = qServerDB.config.prefix;
		}

		if (!args[0]) {
			let embed = new Discord.MessageEmbed()
				.setDescription(string(locale, "HELP_BASE_DESCRIPTION"))
				.addField(string(locale, "HELP_USEFUL_LINKS"), string(locale, "HELP_USEFUL_LINKS_DESC", { support_invite, bot_invite: url.replace("[ID]", client.user.id) }))
				.setFooter(message.guild ? string(locale, "HELP_PREFIX_INFO", { prefix: serverPrefix }) : "")
				.setColor(client.colors.default);

			if (missingConfig) embed.addField(string(locale, "MISSING_CONFIG_TITLE"), string(locale, "MISSING_CONFIG_DESCRIPTION", { prefix: serverPrefix }));
			return message.channel.send(embed);
		}

		let commandName = args[0].toLowerCase();

		const command = client.commands.find((c) => c.controls.name.toLowerCase() === commandName || c.controls.aliases && c.controls.aliases.includes(commandName));

		if (!command) return;

		let commandInfo = command.controls;

		let additionalInfo = [];
		if (!commandInfo.enabled || commandInfo.permission === -1) additionalInfo.push(`⚠️ ${string(locale, "COMMAND_DISABLED")}`);
		if (permLevelToRole(locale, commandInfo.permission)) additionalInfo.push(permLevelToRole(locale, commandInfo.permission));
		let permission = await checkPermissions(message.member || message.author, client);
		additionalInfo.push(string(locale, permission <= commandInfo.permission ? "HAS_COMMAND_PERMISSION" : "HAS_NOT_COMMAND_PERMISSION"));
		let returnEmbed = new Discord.MessageEmbed()
			.setColor(client.colors.default)
			.setDescription(`${string(locale, `COMMAND_DESC:${commandInfo.name.toUpperCase()}`) || commandInfo.description}\n${additionalInfo.join("\n")}`)
			.addField(string(locale, "HELP_USAGE"), `\`${serverPrefix}${string(locale, `COMMAND_USAGE:${commandInfo.name.toUpperCase()}`) || commandInfo.usage}\``, true)
			.setAuthor(`${serverPrefix}${commandName}`, client.user.displayAvatarURL({dynamic: true, format: "png"}));

		commandInfo.aliases ? returnEmbed.addField(string(locale, commandInfo.aliases.length > 1 ? "HELP_ALIAS_PLURAL" : "HELP_ALIAS"), commandInfo.aliases.map(c => `\`${serverPrefix}${c}\``).join(", "), true) : "";
		returnEmbed.addField(string(locale, "HELP_EXAMPLES"), (commandInfo.examples ? (string(locale, `COMMAND_EXAMPLES:${commandInfo.name.toUpperCase()}`) || commandInfo.examples).replace(new RegExp("{{p}}", "g"), Discord.escapeMarkdown(serverPrefix)) : null) || string(locale, "NONE"));

		if (commandInfo.image) returnEmbed.attachFiles([new MessageAttachment(commandInfo.image, `image.${commandInfo.image.split(".")[1]}`)]).setImage(`attachment://image.${commandInfo.image.split(".")[1]}`);

		return message.channel.send(returnEmbed);

	}
};
