const { emoji, colors, prefix } = require("../config.json");
const { dbQuery, channelPermissions, serverLog, fetchUser, dbModify, suggestionEmbed } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "approve <suggestion id>",
		description: "Approves a suggestion",
		enabled: true,
		docs: "staff/approve",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {

		let missingConfigs = [];
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(`<:${emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

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

		if (client.channels.get(qServerDB.config.channels.staff)) {
			let perms = channelPermissions(client.channels.get(qServerDB.config.channels.staff).memberPermissions(client.user.id), "staff", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${qServerDB.config.channels.staff}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${qServerDB.config.channels.staff}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(`<:${emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
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

		let qSuggestionDB = await dbQuery("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion id!`);

		let id = qSuggestionDB.suggestionId;
		if (qSuggestionDB.status !== "awaiting_review") {
			switch (qSuggestionDB.status) {
			case "approved":
				return message.channel.send(`<:${emoji.x}> This suggestion has been approved already! Use \`${qServerDB.config.prefix}delete ${id.toString()}\` to remove it.`);
				break;
			case "denied":
				return message.channel.send(`<:${emoji.x}> This suggestion has already been denied! Previously denied suggestions cannot be approved.`);
				break;
			}
		}

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		await dbModify("Suggestion", { suggestionId: id }, {
			status: "approved",
			staff_member: message.author.id,
			votes: {
				upvotes: 0,
				downvotes: 0
			}
		});

		let isComment;
		args[1] ? isComment = true : isComment = false;

		let comment;
		if (isComment) {
			comment = args.splice(1).join(" ");
			await dbModify("Suggestion", { suggestionId: id }, {
				comments: [{
					comment: comment,
					author: message.author.id,
					id: 1
				}]
			});
		}

		let replyEmbed = new Discord.RichEmbed()
			.setTitle("Suggestion Approved")
			.setAuthor(`Suggestion from ${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
			.setFooter(`Approved by ${message.author.tag}`, message.author.displayAvatarURL)
			.setDescription(qSuggestionDB.suggestion);
		isComment ? replyEmbed.addField("Comment Added", comment) : "";
		replyEmbed.setColor(colors.green);
		await message.channel.send(replyEmbed);

		let qSuggestionDB2 = await dbQuery("Suggestion", { suggestionId: id, id: message.guild.id }); //Update Suggestion Info

		let embedSuggest = await suggestionEmbed(qSuggestionDB2, qServerDB, client);
		client.channels.get(qServerDB.config.channels.suggestions).send(embedSuggest).then(async posted => {
			await dbModify("Suggestion", { suggestionId: id }, {
				messageId: posted.id
			});
			if (qServerDB.config.notify) {
				let dmEmbed = new Discord.RichEmbed()
					.setTitle("Your Suggestion Was Approved!")
					.setFooter(`Suggestion ID: ${id.toString()}`)
					.setDescription(qSuggestionDB2.suggestion)
					.addField("Suggestions Feed Post", `[Jump to post](https://discordapp.com/channels/${qSuggestionDB2.id}/${qServerDB.config.channels.suggestions}/${posted.id})`)
					.setColor(colors.green);
				isComment ? dmEmbed.addField("Comment Added", comment) : "";
				suggester.send(dmEmbed).catch(err => console.error(err));
			}

			if (qServerDB.config.react) {
				let reactEmojiUp = qServerDB.config.emojis.up;
				let reactEmojiMid = qServerDB.config.emojis.mid;
				let reactEmojiDown = qServerDB.config.emojis.down;
				await posted.react(reactEmojiUp);
				await posted.react(reactEmojiMid);
				await posted.react(reactEmojiDown);
				await dbModify("Suggestion", { suggestionId: id }, {
					emojis: {
						up: reactEmojiUp,
						mid: reactEmojiDown,
						down: reactEmojiDown
					}
				});
			}
		});

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} approved #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", qSuggestionDB2.suggestion)
				.setFooter(`Suggestion ID: ${id.toString()} | Approver ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.green);
			isComment ? logEmbed.addField("Comment Added by Approver", comment) : "";
			serverLog(logEmbed, message.guild.id, client);
		}

		let updateEmbed = new Discord.RichEmbed()
			.setTitle(`Suggestion Awaiting Review (#${id.toString()})`)
			.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, message.author.displayAvatarURL)
			.setDescription(qSuggestionDB2.suggestion)
			.setColor(colors.green)
			.addField("A change was processed on this suggestion", "This suggestion has been approved");
		client.channels.get(qServerDB.config.channels.staff)
			.fetchMessage(qSuggestionDB2.reviewMessage)
			.then(fetched => fetched.edit(updateEmbed));

	}
};
