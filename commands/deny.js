const { emoji, colors, prefix } = require("../config.json");
const { dbQuery, channelPermissions, serverLog, fetchUser, dbModify, dbQueryNoNew } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "deny <suggestion id> (reason)",
		description: "Denies a suggestion",
		enabled: true,
		docs: "staff/deny",
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

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion id!`);

		let id = qSuggestionDB.suggestionId;

		if (qSuggestionDB.reviewMessage && client.channels.get(qServerDB.config.channels.staff)) {
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
			status: "denied",
			staff_member: message.author.id
		});

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(`<:${emoji.x}> Denial reasons cannot be longer than 1024 characters.`);
			await dbModify("Suggestion", { suggestionId: id }, {
				denial_reason: reason
			});
		}

		let replyEmbed = new Discord.RichEmbed()
			.setTitle("Suggestion Denied")
			.setAuthor(`Suggestion from ${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
			.setFooter(`Denied by ${message.author.tag}`, message.author.displayAvatarURL)
			.setDescription(qSuggestionDB.suggestion)
			.setColor(colors.red);
		reason ? replyEmbed.addField("Reason Given", reason) : "";
		await message.channel.send(replyEmbed);

		if (qServerDB.config.notify) {
			let dmEmbed = new Discord.RichEmbed()
				.setTitle("Your Suggestion Was Denied")
				.setFooter(`Suggestion ID: ${id.toString()}`)
				.setDescription(qSuggestionDB.suggestion)
				.setColor(colors.red);
			reason ? dmEmbed.addField("Reason Given", reason) : "";
			suggester.send(dmEmbed).catch(err => console.log(err));
		}

		if (qSuggestionDB.reviewMessage && client.channels.get(qServerDB.config.channels.staff)) {
			let updateEmbed = new Discord.RichEmbed()
				.setTitle(`Suggestion Awaiting Review (#${id.toString()})`)
				.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
				.setDescription(qSuggestionDB.suggestion)
				.setColor(colors.red)
				.addField("A change was processed on this suggestion", "This suggestion has been denied");
			client.channels.get(qServerDB.config.channels.staff).fetchMessage(qSuggestionDB.reviewMessage).then(fetched => fetched.edit(updateEmbed));
		}

		if (qServerDB.config.channels.denied && client.channels.get(qServerDB.config.channels.denied)) {
			let deniedEmbed = new Discord.RichEmbed()
				.setTitle("Suggestion Denied")
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
				.setAuthor(`${message.author.tag} denied #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", qSuggestionDB.suggestion)
				.setFooter(`Suggestion ID: ${id.toString()} | Denier ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.red);
			reason ? logEmbed.addField("Denial Reason", reason) : "";
			serverLog(logEmbed, qServerDB);
		}

	}
};
