const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, serverLog, fetchUser, dbModify, suggestionEmbed, dbQueryNoNew, checkConfig, checkChannel } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "acomment",
		permission: 3,
		aliases: ["anonymouscomment"],
		usage: "acomment <suggestion id> <comment>",
		description: "Adds a comment to an approved suggestion anonymously",
		enabled: true,
		docs: "staff/acomment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
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

		if (qSuggestionDB.status !== "approved") return message.channel.send(`<:${emoji.x}> Comments can only be added to approved suggestions!`);

		if (!args[1]) return message.channel.send(`<:${emoji.x}> You must provide a comment!`);

		if (qSuggestionDB.comments && qSuggestionDB.comments.filter(c => !c.deleted).length + 1 > 23) return message.channel.send(`<:${emoji.x}> Suggestions can only have up to 23 comments.`);

		let comment = args.splice(1).join(" ");

		if (comment.length > 1024) return message.channel.send(`<:${emoji.x}> Comments cannot be longer than 1024 characters.`);

		qSuggestionDB.comments.push({
			comment: comment,
			author: 0,
			id: qSuggestionDB.comments.length+1
		});
		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		let suggestionEditEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return message.channel.send(`<:${emoji.x}> There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle("Anonymous Comment Added")
			.setDescription(`${qSuggestionDB.suggestion || "[No Suggestion Content]"}\n[Suggestions Feed Post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.addField("Official Comment", comment)
			.setColor(colors.blue)
			.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		if (qServerDB.config.notify && qUserDB.notify) {
			let dmEmbed = new Discord.MessageEmbed()
				.setTitle(`A comment was added to your suggestion in **${message.guild.name}**!`)
				.setDescription(`${qSuggestionDB.suggestion || "[No Suggestion Content]"}\n[Suggestions Feed Post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
				.addField("Official Comment", comment)
				.setColor(colors.blue)
				.setFooter(`Suggestion ID: ${id.toString()}`);
			suggester.send(dmEmbed);
		}

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(`${message.author.tag} added an anonymous comment to #${id.toString()}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField("Suggestion", qSuggestionDB.suggestion || "[No Suggestion Content]")
				.addField("Comment", comment)
				.setFooter(`Suggestion ID: ${id.toString()} | Commenter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.blue);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
