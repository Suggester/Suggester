const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, serverLog, fetchUser, dbModify, suggestionEmbed, dbQueryNoNew, checkConfig, checkChannel } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "approve",
		permission: 3,
		usage: "approve <suggestion id> (comment)",
		description: "Approves a suggestion",
		enabled: true,
		docs: "staff/approve",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10,
		cooldownMessage: "Need to approve multiple suggestions? Try the `mapprove` command!"
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

		let missingSuggestionPerms = checkChannel(qServerDB.config.channels.suggestions, message.guild.channels.cache, "suggestions", client);
		if (!missingSuggestionPerms) return message.channel.send(`<:${emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestions channel.`);
		if (missingSuggestionPerms !== true) return message.channel.send(missingSuggestionPerms);

		let missingReviewPerms = checkChannel(qServerDB.config.channels.staff, message.guild.channels.cache, "staff", client);
		if (!missingReviewPerms) return message.channel.send(`<:${emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
		if (missingReviewPerms !== true) return message.channel.send(missingReviewPerms);

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion ID!`);

		let id = qSuggestionDB.suggestionId;
		if (qSuggestionDB.status !== "awaiting_review") {
			switch (qSuggestionDB.status) {
			case "approved":
				return message.channel.send(`<:${emoji.x}> This suggestion has been approved already! Use \`${qServerDB.config.prefix}delete ${id.toString()}\` to remove it.`);
			case "denied":
				return message.channel.send(`<:${emoji.x}> This suggestion has already been denied! Previously denied suggestions cannot be approved.`);
			}
		}

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		qSuggestionDB.status = "approved";
		qSuggestionDB.staff_member = message.author.id;
		await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);

		let isComment = args[1];

		let comment;
		if (isComment) {
			comment = args.splice(1).join(" ");
			if (comment.length > 1024) return message.channel.send(`<:${emoji.x}> Comments cannot be longer than 1024 characters.`);
			qSuggestionDB.comments = [{
				comment: comment,
				author: message.author.id,
				id: 1,
				created: new Date()
			}];
			await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);
		}

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle("Suggestion Approved")
			.setAuthor(`Suggestion from ${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setFooter(`Approved by ${message.author.tag}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion || "[No Suggestion Content]")
			.setColor(colors.green);
		isComment ? replyEmbed.addField("Comment Added", comment) : "";

		if (qSuggestionDB.attachment) {
			replyEmbed.addField("With Attachment", qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}

		await message.channel.send(replyEmbed);

		let embedSuggest = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		client.channels.cache.get(qServerDB.config.channels.suggestions).send(embedSuggest).then(async posted => {
			await dbModify("Suggestion", { suggestionId: id }, {
				messageId: posted.id
			});
			let qUserDB = await dbQuery("User", { id: suggester.id });
			let selfNotify;
			if (suggester.id === message.author.id) qUserDB.selfnotify ? selfNotify = true : selfNotify = false;
			else selfNotify = true;
			if (qServerDB.config.notify && qUserDB.notify && selfNotify) {
				let dmEmbed = new Discord.MessageEmbed()
					.setTitle(`Your Suggestion in **${message.guild.name}** Was Approved!`)
					.setFooter(`Suggestion ID: ${id.toString()}`)
					.setDescription(qSuggestionDB.suggestion || "[No Suggestion Content]")
					.addField("Suggestions Feed Post", `[Jump to post](https://discord.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${posted.id})`)
					.setColor(colors.green);
				isComment ? dmEmbed.addField("Comment Added", comment) : "";
				qSuggestionDB.attachment ? dmEmbed.setImage(qSuggestionDB.attachment) : "";
				suggester.send(dmEmbed).catch(() => {});
			}

			if (qServerDB.config.react) {
				let reactEmojiUp = qServerDB.config.emojis.up;
				let reactEmojiMid = qServerDB.config.emojis.mid;
				let reactEmojiDown = qServerDB.config.emojis.down;
				if (reactEmojiUp !== "none") await posted.react(reactEmojiUp).catch(async () => {
					await posted.react("👍");
					reactEmojiUp = "👍";
				});
				if (reactEmojiMid !== "none") await posted.react(reactEmojiMid).catch(async () => {
					await posted.react("🤷");
					reactEmojiMid = "🤷";
				});
				if (reactEmojiDown !== "none") await posted.react(reactEmojiDown).catch(async () => {
					await posted.react("👎");
					reactEmojiDown = "👎";
				});
				await dbModify("Suggestion", { suggestionId: id }, {
					emojis: {
						up: reactEmojiUp,
						mid: reactEmojiDown,
						down: reactEmojiDown
					}
				});
			}
		});

		if (qServerDB.config.approved_role && message.guild.roles.cache.get(qServerDB.config.approved_role) && message.guild.members.cache.get(suggester.id) && message.guild.me.permissions.has("MANAGE_ROLES")) message.guild.members.cache.get(suggester.id).roles.add(qServerDB.config.approved_role, "Suggestion approved");

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(`${message.author.tag} approved #${id.toString()}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField("Suggestion", qSuggestionDB.suggestion || "[No Suggestion Content]")
				.setFooter(`Suggestion ID: ${id.toString()} | Approver ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.green);
			isComment ? logEmbed.addField("Comment Added by Approver", comment) : "";

			if (qSuggestionDB.attachment) {
				logEmbed.addField("With Attachment", qSuggestionDB.attachment)
					.setImage(qSuggestionDB.attachment);
			}

			serverLog(logEmbed, qServerDB, client);
		}

		let updateEmbed = new Discord.MessageEmbed()
			.setTitle(`Suggestion Awaiting Review (#${id.toString()})`)
			.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion)
			.setColor(colors.green)
			.addField("A change was processed on this suggestion", "This suggestion has been approved");

		if (qSuggestionDB.attachment) {
			updateEmbed.addField("With Attachment", qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}

		client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit(updateEmbed));

	}
};
