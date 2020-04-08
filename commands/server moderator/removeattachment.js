const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, dbQueryNoNew, checkConfig, checkChannel, dbModify, suggestionEmbed, serverLog } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "removeattachment",
		permission: 3,
		aliases: ["rmattachment", "rmattach", "delattachment", "deleteattachment"],
		usage: "removeattachment <suggestion id>",
		description: "Removes a file from a suggestion",
		enabled: true,
		docs: "staff/removeattachment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		let missing = checkConfig(qServerDB);

		if (missing.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		let missingPerms = checkChannel(qServerDB.config.channels.suggestions, message.guild.channels.cache, "suggestions", client);
		if (!missingPerms) return message.channel.send(`<:${emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestions channel.`);
		if (missingPerms !== true) return message.channel.send(missingPerms);

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion ID!`);

		let id = qSuggestionDB.suggestionId;

		if (!qSuggestionDB.attachment) return message.channel.send(`<:${emoji.x}> This suggestion does not have an attachment!`);
		let oldAttachment = qSuggestionDB.attachment;
		qSuggestionDB.attachment = "";
		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let suggestionEditEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return message.channel.send(`<:${emoji.x}> There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle("Attachment Removed")
			.setDescription(`${qSuggestionDB.suggestion || "[No Suggestion Content]"}\n[Suggestions Feed Post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.setImage(oldAttachment)
			.setColor(colors.orange)
			.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);



		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(`${message.author.tag} removed attachment from #${id.toString()}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField("Suggestion", qSuggestionDB.suggestion || "[No Suggestion Content]")
				.setImage(oldAttachment)
				.setFooter(`Suggestion ID: ${id.toString()} | Staff Member ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.orange);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
