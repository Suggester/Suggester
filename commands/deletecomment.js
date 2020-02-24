const { dbQuery, dbModify, channelPermissions, fetchUser, serverLog, suggestionEmbed, dbQueryNoNew } = require("../coreFunctions.js");
const { emoji, colors, prefix } = require("../config.json");
module.exports = {
	controls: {
		permission: 3,
		aliases: ["delcomment", "dcomment", "rmcomment"],
		usage: "deletecomment <comment id>",
		description: "Deletes a comment on a suggestion",
		enabled: true,
		docs: "staff/deletecomment",
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

		if (!args[0]) return message.channel.send(`<:${emoji.x}> You must specify a comment ID!`);
		let idsections = args[0].split("_");
		if (!idsections[0] || !idsections[1]) return message.channel.send(`<:${emoji.x}> You must specify a valid comment ID!`);
		let qSuggestionDB = await dbQueryNoNew("Suggestion", {suggestionId: idsections[0], id: message.guild.id});
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion id!`);

		let id = qSuggestionDB.suggestionId;
		let comment = qSuggestionDB.comments.find(comment => comment.id === idsections[1]) || null;
		if (!comment) return message.channel.send(`<:${emoji.x}> You must specify a valid comment ID!`);

		if (comment.deleted) return message.channel.send(`<:${emoji.x}> This comment has already been deleted!`);

		qSuggestionDB.comments.find(comment => comment.id === idsections[1]).deleted = true;
		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let suggestionEditEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.get(qServerDB.config.channels.suggestions).fetchMessage(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return message.channel.send(`<:${emoji.x}> There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

		let commentAuthor = await fetchUser(comment.author, client);
		let embed = new Discord.RichEmbed()
			.setTitle("Comment Deleted")
			.setDescription(comment.comment)
			.setColor(colors.red)
			.setFooter(`Comment ID: ${id}_${comment.id}`);
		commentAuthor ? embed.setAuthor(`Comment from ${commentAuthor.tag}`, commentAuthor.displayAvatarURL) : embed.setAuthor("Comment from Anonymous User");
		message.channel.send(embed);

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.RichEmbed()
				.addField("Suggestion", qSuggestionDB.suggestion)
				.addField("Comment", comment.comment)
				.setFooter(`Suggestion ID: ${id.toString()} | Deleter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.red);
			commentAuthor ? logEmbed.setAuthor(`${message.author.tag} deleted ${commentAuthor.tag}'s comment #${comment.id} from suggestion #${id.toString()}`, message.author.displayAvatarURL) : logEmbed.setAuthor(`${message.author.tag} deleted comment #${comment.id} from suggestion #${id.toString()}`);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
