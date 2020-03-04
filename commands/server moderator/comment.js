const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, channelPermissions, serverLog, fetchUser, dbModify, suggestionEmbed, dbQueryNoNew } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "comment",
		permission: 3,
		usage: "comment <suggestion id> <comment>",
		description: "Adds a comment to an approved suggestion",
		enabled: true,
		docs: "staff/comment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {

		let missingConfigs = [];
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		if (!qServerDB.config.admin_roles ||
			qServerDB.config.admin_roles < 1) {
			missingConfigs.push("Server Admin Roles");
		}
		if (!qServerDB.config.staff_roles ||
			qServerDB.config.staff_roles < 1) {
			missingConfigs.push("Server Staff Roles");
		}
		if (!qServerDB.config.channels.suggestions ||
			qServerDB.config.channels.suggestions < 1) {
			missingConfigs.push("Approved Suggestions Channel");
		}
		if (!qServerDB.config.mode === "review" && !qServerDB.config.channels.staff ||
			!client.channels.get(qServerDB.config.channels.staff)) {
			missingConfigs.push("Suggestion Review Channel");
		}

		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed()
				.setDescription(
					`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${qServerDB.config.prefix}config\` command.`
				)
				.addField(
					"Missing Elements",
					`<:${emoji.x}> ${missingConfigs.join(`\n<:${emoji.x}> `)}`
				)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		if (client.channels.get(qServerDB.config.channels.suggestions)) {
			let perms = channelPermissions(client.channels.get(qServerDB.config.channels.suggestions).memberPermissions(client.user.id), "suggestions", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${qServerDB.config.channels.suggestions}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${qServerDB.config.channels.suggestions}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(`<:${emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestions channel.`);
		}

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion id!`);

		let id = qSuggestionDB.suggestionId;

		if (qSuggestionDB.status !== "approved") return message.channel.send(`<:${emoji.x}> Comments can only be added to approved suggestions!`);

		if (!args[1]) return message.channel.send(`<:${emoji.x}> You must provide a comment!`);

		if (qSuggestionDB.comments && qSuggestionDB.comments.filter(c => !c.deleted).length + 1 > 23) return message.channel.send(`<:${emoji.x}> Suggestions can only have up to 23 comments.`);

		let comment = args.splice(1).join(" ");

		if (comment.length > 1024) return message.channel.send(`<:${emoji.x}> Comments cannot be longer than 1024 characters.`);

		qSuggestionDB.comments.push({
			comment: comment,
			author: message.author.id,
			id: qSuggestionDB.comments.length+1
		});
		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		let suggestionEditEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.get(qServerDB.config.channels.suggestions).fetchMessage(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return message.channel.send(`<:${emoji.x}> There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

		let replyEmbed = new Discord.RichEmbed()
			.setTitle("Comment Added")
			.setDescription(`${qSuggestionDB.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.addField(`Official Comment from ${message.author.tag}`, comment)
			.setColor(colors.blue)
			.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);

		if (qServerDB.config.notify) {
			let dmEmbed = new Discord.RichEmbed()
				.setTitle(`A comment was added to your suggestion in **${message.guild.name}**!`)
				.setDescription(`${qSuggestionDB.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
				.addField(`Official Comment from ${message.author.tag}`, comment)
				.setColor(colors.blue)
				.setFooter(`Suggestion ID: ${id.toString()}`);
			suggester.send(dmEmbed);
		}

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} added a comment to #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", qSuggestionDB.suggestion)
				.addField("Comment", comment)
				.setFooter(`Suggestion ID: ${id.toString()} | Commenter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.blue);
			serverLog(logEmbed, qServerDB);
		}
	}
};
