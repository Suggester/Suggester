const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, checkConfig, serverLog, fetchUser, dbModify, dbQueryNoNew, checkChannel } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "delete",
		permission: 3,
		usage: "delete <suggestion id> (reason)",
		description: "Deletes a suggestion",
		enabled: true,
		docs: "staff/delete",
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

		let missingPermsSuggestions = checkChannel(qServerDB.config.channels.suggestions, message.guild.channels.cache, "suggestions", client);
		if (!missingPermsSuggestions) return message.channel.send(`<:${emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestions channel.`);
		if (missingPermsSuggestions !== true) return message.channel.send(missingPermsSuggestions);

		if (qServerDB.config.channels.denied) {
			let missingPermsDenied = checkChannel(qServerDB.config.channels.denied, message.guild.channels.cache, "denied", client);
			if (!missingPermsDenied) return message.channel.send(`<:${emoji.x}> Could not find your denied suggestions channel even though there is one configured! If you want to remove your denied suggestions channel, use \`${Discord.escapeMarkdown(qServerDB.prefix)}config denied none\``);
			if (missingPermsDenied !== true) return message.channel.send(missingPermsDenied);
		}

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion ID!`);

		let id = qSuggestionDB.suggestionId;

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) {
			let missingReviewPerms = checkChannel(qServerDB.config.channels.staff, message.guild.channels.cache, "staff", client);
			if (!missingReviewPerms) return message.channel.send(`<:${emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
			if (missingReviewPerms !== true) return message.channel.send(missingReviewPerms);
		}

		if (qSuggestionDB.status !== "approved") return message.channel.send(`<:${emoji.x}> Only approved suggestions can be deleted!`);

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		qSuggestionDB.status = "denied";
		qSuggestionDB.staff_member = message.author.id;

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(`<:${emoji.x}> Deletion reasons cannot be longer than 1024 characters.`);
			qSuggestionDB.denial_reason = reason;
		}

		await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);

		let messageDeleted;
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.delete();
			messageDeleted = true;
		}).catch(() => messageDeleted = false);

		if (!messageDeleted) return message.channel.send(`<:${emoji.x}> There was an error fetching the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle("Suggestion Deleted")
			.setAuthor(`Suggestion from ${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setFooter(`Deleted by ${message.author.tag}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion || "[No Suggestion Content]")
			.setColor(colors.red);
		reason ? replyEmbed.addField("Reason Given", reason) : "";
		message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		if (qServerDB.config.notify && qUserDB.notify) {
			let dmEmbed = new Discord.MessageEmbed()
				.setTitle(`Your Suggestion in **${message.guild.name}** Was Deleted`)
				.setFooter(`Suggestion ID: ${id.toString()}`)
				.setDescription(qSuggestionDB.suggestion || "[No Suggestion Content]")
				.setColor(colors.red);
			reason ? dmEmbed.addField("Reason Given", reason) : "";
			qSuggestionDB.attachment ? dmEmbed.setImage(qSuggestionDB.attachment) : "";
			if(qUserDB.selfnotify===false && suggester.id!==message.author.id) suggester.send(dmEmbed).catch(() => {});
			if(qUserDB.selfnotify) suggester.send(dmEmbed).catch(() => {});

		}

		if (qServerDB.config.channels.staff && qSuggestionDB.reviewMessage) {
			let updateEmbed = new Discord.MessageEmbed()
				.setTitle(`Suggestion Awaiting Review (#${id.toString()})`)
				.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(qSuggestionDB.suggestion)
				.setColor(colors.red)
				.addField("A change was processed on this suggestion", "This suggestion has been deleted");
			client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit(updateEmbed));
		}

		if (qServerDB.config.channels.denied) {
			let deniedEmbed = new Discord.MessageEmbed()
				.setTitle("Suggestion Deleted")
				.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`)
				.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(qSuggestionDB.suggestion || "[No Suggestion Content]")
				.setFooter(`Suggestion ID: ${id.toString()}`)
				.setColor(colors.red);
			reason ? deniedEmbed.addField("Reason Given:", reason) : "";
			qSuggestionDB.attachment ? deniedEmbed.setImage(qSuggestionDB.attachment) : "";
			client.channels.cache.get(qServerDB.config.channels.denied).send(deniedEmbed);
		}

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(`${message.author.tag} deleted #${id.toString()}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField("Suggestion", qSuggestionDB.suggestion || "[No Suggestion Content]")
				.setFooter(`Suggestion ID: ${id.toString()} | Deleter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.red);
			reason ? logEmbed.addField("Deletion Reason", reason) : "";
			qSuggestionDB.attachment ? logEmbed.setImage(qSuggestionDB.attachment) : "";
			serverLog(logEmbed, qServerDB, client);
		}

	}
};
