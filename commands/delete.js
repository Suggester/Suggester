const { emoji, colors, prefix } = require("../config.json");
const { dbQuery, channelPermissions, serverLog, fetchUser, dbModify, dbQueryNoNew } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "delete <suggestion id> (reason)",
		description: "Deletes a suggestion",
		enabled: true,
		docs: "staff/delete",
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

		if (qServerDB.config.channels.denied) {
			if (client.channels.get(qServerDB.config.channels.denied)) {
				let perms = channelPermissions(client.channels.get(qServerDB.config.channels.denied).memberPermissions(client.user.id), "denied", client);
				if (perms.length > 0) {
					let embed = new Discord.RichEmbed()
						.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${qServerDB.config.channels.denied}> channel:`)
						.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
						.addField("How to Fix", `In the channel settings for <#${qServerDB.config.channels.denied}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
						.setColor(colors.red);
					return message.channel.send(embed);
				}
			} else {
				return message.channel.send(`<:${emoji.x}> Could not find your denied suggestions channel, even though there is one set! Please reconfigure your denied suggestions channel.`);
			}
		}

		if (qServerDB.config.channels.suggestions) {
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
		}

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion id!`);

		let id = qSuggestionDB.suggestionId;

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) {
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
			} else return message.channel.send(`<:${emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
		}

		if (qSuggestionDB.status !== "approved") return message.channel.send(`<:${emoji.x}> Only approved suggestions can be deleted!`);

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		await dbModify("Suggestion", { suggestionId: id }, {
			status: "denied",
			staff_member: message.author.id
		});

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(`<:${emoji.x}> Deletion reasons cannot be longer than 1024 characters.`);
			await dbModify("Suggestion", { suggestionId: id }, {
				denial_reason: reason
			});
		}

		let messageDeleted;
		await client.channels.get(qServerDB.config.channels.suggestions).fetchMessage(qSuggestionDB.messageId).then(f => {
			f.delete()
			messageDeleted = true;
		}).catch(err => messageDeleted = false);

		if (!messageDeleted) return message.channel.send(`<:${emoji.x}> There was an error fetching the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

		client.channels.get(qServerDB.config.channels.suggestions).fetchMessage(qSuggestionDB.messageId).then(m => m.delete()).catch(err => {});

		let replyEmbed = new Discord.RichEmbed()
			.setTitle("Suggestion Deleted")
			.setAuthor(`Suggestion from ${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
			.setFooter(`Deleted by ${message.author.tag}`, message.author.displayAvatarURL)
			.setDescription(qSuggestionDB.suggestion)
			.setColor(colors.red);
		reason ? replyEmbed.addField("Reason Given", reason) : "";
		message.channel.send(replyEmbed);

		if (qServerDB.config.notify) {
			let dmEmbed = new Discord.RichEmbed()
				.setTitle(`Your Suggestion in **${message.guild.name}** Was Deleted`)
				.setFooter(`Suggestion ID: ${id.toString()}`)
				.setDescription(qSuggestionDB.suggestion)
				.setColor(colors.red);
			reason ? dmEmbed.addField("Reason Given", reason) : "";
			suggester.send(dmEmbed).catch(err => console.log(err));
		}

		if (qServerDB.config.channels.staff && qSuggestionDB.reviewMessage && client.channels.get(qServerDB.config.channels.staff)) {
			let updateEmbed = new Discord.RichEmbed()
				.setTitle(`Suggestion Awaiting Review (#${id.toString()})`)
				.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
				.setDescription(qSuggestionDB.suggestion)
				.setColor(colors.red)
				.addField("A change was processed on this suggestion", "This suggestion has been deleted");
			client.channels.get(qServerDB.config.channels.staff).fetchMessage(qSuggestionDB.reviewMessage).then(fetched => fetched.edit(updateEmbed));
		}

		if (qServerDB.config.channels.denied && client.channels.get(qServerDB.config.channels.denied)) {
			let deniedEmbed = new Discord.RichEmbed()
				.setTitle("Suggestion Deleted")
				.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`)
				.setThumbnail(suggester.displayAvatarURL)
				.setDescription(qSuggestionDB.suggestion)
				.setFooter(`Suggestion ID: ${id.toString()}`)
				.setColor(colors.red);
			reason ? deniedEmbed.addField("Reason Given:", reason) : "";
			client.channels.get(qServerDB.config.channels.denied).send(deniedEmbed);
		}

		if (qServerDB.config.channels.log && client.channels.get(qServerDB.config.channels.log)) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} deleted #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", qSuggestionDB.suggestion)
				.setFooter(`Suggestion ID: ${id.toString()} | Deleter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.red);
			reason ? logEmbed.addField("Deletion Reason", reason) : "";
			serverLog(logEmbed, qServerDB);
		}

	}
};
