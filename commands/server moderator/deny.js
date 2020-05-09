const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, serverLog, fetchUser, dbModify, dbQueryNoNew, checkConfig, checkChannel } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "deny",
		permission: 3,
		usage: "deny [suggestion id] (reason)",
		description: "Denies a suggestion",
		enabled: true,
		docs: "staff/deny",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		cooldownMessage: "Need to deny multiple suggestions? Try the `mdeny` command!"
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(`<:${emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

		let missing = checkConfig(qServerDB);

		if (missing.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		let missingPermsReview = checkChannel(qServerDB.config.channels.staff, message.guild.channels.cache, "staff", client);
		if (!missingPermsReview) return message.channel.send(`<:${emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
		if (missingPermsReview !== true) return message.channel.send(missingPermsReview);

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

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) {
			let missingReviewPerms = checkChannel(qServerDB.config.channels.staff, message.guild.channels.cache, "staff", client);
			if (!missingReviewPerms) return message.channel.send(`<:${emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
			if (missingReviewPerms !== true) return message.channel.send(missingReviewPerms);
		}

		if (qSuggestionDB.status !== "awaiting_review") {
			switch (qSuggestionDB.status) {
			case "approved":
				return message.channel.send(`<:${emoji.x}> This suggestion has already been approved! Use \`${Discord.escapeMarkdown(qServerDB.config.prefix)}delete ${id.toString()}\` to remove it.`);
			case "denied":
				return message.channel.send(`<:${emoji.x}> This suggestion has already been denied!`);
			}
		}

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		qSuggestionDB.status = "denied";
		qSuggestionDB.staff_member = message.author.id;

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(`<:${emoji.x}> Denial reasons cannot be longer than 1024 characters.`);
			qSuggestionDB.denial_reason = reason;
		}

		await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle("Suggestion Denied")
			.setAuthor(`Suggestion from ${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setFooter(`Denied by ${message.author.tag}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion || "[No Suggestion Content]")
			.setColor(colors.red);
		reason ? replyEmbed.addField("Reason Given", reason) : "";
		if (qSuggestionDB.attachment) {
			replyEmbed.addField("With Attachment", qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}
		await message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		if (qServerDB.config.notify && qUserDB.notify) {
			let dmEmbed = new Discord.MessageEmbed()
				.setTitle(`Your Suggestion in **${message.guild.name}** Was Denied`)
				.setFooter(`Suggestion ID: ${id.toString()}`)
				.setDescription(qSuggestionDB.suggestion || "[No Suggestion Content]")
				.setColor(colors.red);
			reason ? dmEmbed.addField("Reason Given", reason) : "";
			qSuggestionDB.attachment ? dmEmbed.setImage(qSuggestionDB.attachment) : "";
			suggester.send(dmEmbed).catch(() => {});
		}

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) {
			let updateEmbed = new Discord.MessageEmbed()
				.setTitle(`Suggestion Awaiting Review (#${id.toString()})`)
				.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(qSuggestionDB.suggestion)
				.setColor(colors.red)
				.addField("A change was processed on this suggestion", "This suggestion has been denied");

			if (qSuggestionDB.attachment) {
				updateEmbed.addField("With Attachment", qSuggestionDB.attachment)
					.setImage(qSuggestionDB.attachment);
			}

			client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit(updateEmbed));
		}

		if (qServerDB.config.channels.denied) {
			let deniedEmbed = new Discord.MessageEmbed()
				.setTitle("Suggestion Denied")
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
				.setAuthor(`${message.author.tag} denied #${id.toString()}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField("Suggestion", qSuggestionDB.suggestion || "[No Suggestion Content]")
				.setFooter(`Suggestion ID: ${id.toString()} | Denier ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.red);
			reason ? logEmbed.addField("Denial Reason", reason) : "";
			if (qSuggestionDB.attachment) {
				logEmbed.addField("With Attachment", qSuggestionDB.attachment)
					.setImage(qSuggestionDB.attachment);
			}
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
