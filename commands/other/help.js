const { permLevelToRole } = require("../../utils/misc");
const { dbQuery } = require("../../utils/db");
const { checkConfig } = require("../../utils/checks");
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
		image: "images/Help.gif",
		enabled: true,
		docs: "all/help",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
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

		let returnEmbed = new Discord.MessageEmbed()
			.setColor(client.colors.default)
			.setDescription(string(locale, `COMMAND:${commandInfo.name.toUpperCase()}`))
			.addField(string(locale, "HELP_PERMISSION_LEVEL"), permLevelToRole(locale, commandInfo.permission), true)
			.addField(string(locale, "HELP_USAGE"), `\`${serverPrefix}${commandInfo.usage}\``, true)
			.setAuthor(commandName, client.user.displayAvatarURL({dynamic: true, format: "png"}));

		commandInfo.aliases ? returnEmbed.addField(string(locale, commandInfo.aliases.length > 1 ? "HELP_ALIAS_PLURAL" : "HELP_ALIAS"), commandInfo.aliases.join(", ")) : "";
		if (commandInfo.docs && commandInfo.docs !== "") {
			let localeFull = client.locales.find(l => l.settings.code === locale);
			returnEmbed.addField(string(locale, "HELP_DOCUMENTATION"), `${localeFull.settings.docs || "https://suggester.js.org/#/"}${commandInfo.docs}`);
		}
		if (!commandInfo.enabled) returnEmbed.addField(string(locale, "HELP_ADDITIONAL_INFO"), `⚠️ ${string(locale, "COMMAND_DISABLED")}`);

		if (commandInfo.image) returnEmbed.attachFiles([new MessageAttachment(commandInfo.image, `image.${commandInfo.image.split(".")[1]}`)]).setImage(`attachment://image.${commandInfo.image.split(".")[1]}`);

		return message.channel.send(returnEmbed);

	}
};
