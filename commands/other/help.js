const { permLevelToRole } = require("../../utils/misc");
const { dbQuery } = require("../../utils/db");
const { checkPermissions } = require("../../utils/checks");
const { MessageAttachment } = require("discord.js");
const { prefix, support_invite } = require("../../config.json");
const { slash_url } = require("./invite");
const { string } = require("../../utils/strings");
const { pages } = require("../../utils/actions");

module.exports = {
	controls: {
		name: "help",
		permission: 10,
		aliases: ["command", "howto"],
		usage: "help (command name)",
		description: "Shows command information",
		examples: "`{{p}}help`\nShows the list of commands\n\n`{{p}}help suggest`\nShows information about the \"suggest\" command",
		image: "images/Help.gif",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY", "ADD_REACTIONS"],
		cooldown: 5,
		dmAvailable: false,
		docs: "sumup"
	},
	do: async (locale, message, client, args, Discord) => {
		let serverPrefix = prefix;

		if (message.guild) {
			let qServerDB = await dbQuery("Server", { id: message.guild.id });
			serverPrefix = qServerDB.config.prefix;
		}

		let permission = await checkPermissions(message.member || message.author, client);

		if (!args[0]) {
			let embeds = [];
			for await (let module of new Set(client.commands.map(c => c.controls.module).sort((a, b) => (require(`../${a}/module`)).position - (require(`../${b}/module`)).position))) {
				let moduleCommands = client.commands.filter(c => c.controls.module === module && c.controls.permission >= permission && !c.controls.hidden);
				if (moduleCommands.size > 0) embeds.push(new Discord.MessageEmbed()
					.setAuthor(`${string(locale, "HELP_AUTHOR", { name: client.user.username })} • ${string(locale, "PAGINATION_PAGE_COUNT")}`, client.user.displayAvatarURL({ format: "png", dynamic: true }))
					.setTitle(string(locale, "HELP_MODULE_TITLE", { module: string(locale, `MODULE_NAME:${(require(`../${module}/module`)).name.toUpperCase()}`) || (require(`../${module}/module`)).name }))
					.setColor(client.colors.default)
					.setDescription((string(locale, `MODULE_DESC:${(require(`../${module}/module`)).name.toUpperCase()}`) || (require(`../${module}/module`)).description) + "\n\n" + moduleCommands.map(c => `\`${serverPrefix}${string(locale, `COMMAND_USAGE:${c.controls.name.toUpperCase()}`) || c.controls.usage}\` - ${string(locale, `COMMAND_DESC:${c.controls.name.toUpperCase()}`) || c.controls.description}`).join("\n"))
					.addField(string(locale, "HELP_ADDITIONAL_INFO"), string(locale, "HELP_UNDERSTANDING", { prefix: serverPrefix }))
					.addField(string(locale, "HELP_USEFUL_LINKS"), string(locale, "HELP_USEFUL_LINKS_DESC_NEW", { support_invite, bot_invite: slash_url.replace("[ID]", client.user.id) })));
			}
			if (embeds.length > 1) for await (let e of embeds) e.setFooter(string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS"));
			return pages(locale, message, embeds);
		}

		let commandName = args[0].toLowerCase();

		const command = client.commands.find((c) => c.controls.name.toLowerCase() === commandName || c.controls.aliases && c.controls.aliases.includes(commandName));

		if (!command) {
			let module = args[0].toLowerCase();
			if (new Set(client.commands.map(c => c.controls.module)).has(module)) {
				let moduleCommands = client.commands.filter(c => c.controls.module === module && c.controls.permission >= permission);
				if (moduleCommands.size > 0) return message.channel.send(new Discord.MessageEmbed()
					.setAuthor(`${string(locale, "HELP_AUTHOR", { name: client.user.username })}`, client.user.displayAvatarURL({ format: "png", dynamic: true }))
					.setTitle(string(locale, "HELP_MODULE_TITLE", { module: string(locale, `MODULE_NAME:${(require(`../${module}/module`)).name.toUpperCase()}`) || (require(`../${module}/module`)).name }))
					.setColor(client.colors.default)
					.setDescription((string(locale, `MODULE_DESC:${(require(`../${module}/module`)).name.toUpperCase()}`) || (require(`../${module}/module`)).description) + "\n\n" + moduleCommands.map(c => `\`${serverPrefix}${string(locale, `COMMAND_USAGE:${c.controls.name.toUpperCase()}`) || c.controls.usage}\` - ${string(locale, `COMMAND_DESC:${c.controls.name.toUpperCase()}`) || c.controls.description}`).join("\n"))
					.addField(string(locale, "HELP_ADDITIONAL_INFO"), string(locale, "HELP_UNDERSTANDING", { prefix: serverPrefix }))
					.addField(string(locale, "HELP_USEFUL_LINKS"), string(locale, "HELP_USEFUL_LINKS_DESC_NEW", { support_invite, bot_invite: slash_url.replace("[ID]", client.user.id) })));
			}
			return message.channel.send(string(locale, "UNKNOWN_COMMAND_ERROR", {}, "error"));
		}

		let commandInfo = command.controls;

		let additionalInfo = [];
		if (!commandInfo.enabled || commandInfo.permission === -1) additionalInfo.push(`⚠️ ${string(locale, "COMMAND_DISABLED")}`);
		if (permLevelToRole(locale, commandInfo.permission)) additionalInfo.push(permLevelToRole(locale, commandInfo.permission));
		additionalInfo.push(string(locale, permission <= commandInfo.permission ? "HAS_COMMAND_PERMISSION" : "HAS_NOT_COMMAND_PERMISSION"));
		let returnEmbed = new Discord.MessageEmbed()
			.setColor(client.colors.default)
			.setDescription(`${string(locale, `COMMAND_DESC:${commandInfo.name.toUpperCase()}`) || commandInfo.description}\n${additionalInfo.join("\n")}`)
			.addField(string(locale, "HELP_USAGE"), `\`${serverPrefix}${string(locale, `COMMAND_USAGE:${commandInfo.name.toUpperCase()}`) || commandInfo.usage}\``, true)
			.setAuthor(`${serverPrefix}${commandName}`, client.user.displayAvatarURL({dynamic: true, format: "png"}));

		commandInfo.aliases ? returnEmbed.addField(string(locale, commandInfo.aliases.length > 1 ? "HELP_ALIAS_PLURAL" : "HELP_ALIAS"), commandInfo.aliases.map(c => `\`${serverPrefix}${c}\``).join(", "), true) : "";
		commandInfo.docs ? returnEmbed.addField(string(locale, "HELP_DOCS_NEW"), `https://suggester.js.org/#/${commandInfo.docs}`, true) : "";
		returnEmbed.addField(string(locale, "HELP_EXAMPLES"), (commandInfo.examples ? (string(locale, `COMMAND_EXAMPLES:${commandInfo.name.toUpperCase()}`) || commandInfo.examples).replace(new RegExp("{{p}}", "g"), Discord.escapeMarkdown(serverPrefix)) : null) || string(locale, "NONE"));

		if (commandInfo.image) returnEmbed.attachFiles([new MessageAttachment(commandInfo.image, `image.${commandInfo.image.split(".")[1]}`)]).setImage(`attachment://image.${commandInfo.image.split(".")[1]}`);

		return message.channel.send(returnEmbed);

	}
};
