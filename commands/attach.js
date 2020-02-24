const { colors, emoji, prefix } = require("../config.json");
const { dbQuery, dbModify, channelPermissions, dbQueryNoNew, serverLog, suggestionEmbed } = require("../coreFunctions.js");
const validUrl = require("valid-url");
module.exports = {
	controls: {
		permission: 3,
		usage: "attach <suggestion id> <attachment link>",
		description: "Attaches a file to an approved suggestion",
		enabled: true,
		docs: "staff/attach",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ATTACH_FILES"]
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

		if (qSuggestionDB.status !== "approved") return message.channel.send(`<:${emoji.x}> Attachments can only be added to approved suggestions!`);

		if (qSuggestionDB.attachment) return message.channel.send(`<:${emoji.x}> Due to Discord embed limitations, suggestions can only have 1 attachment.`);

		if (!args[1] && !message.attachments.first()) return message.channel.send(`<:${emoji.x}> Please provide an attachment!`);

		let attachment = message.attachments.first() ? message.attachments.first().url : args.splice(1).join(" ");

		/**
       * Check a URL to see if it makes a valid attachment
       * @param {string} url - The string to be checked
       * @returns {boolean}
       */
		function checkURL (url) {
			if (validUrl.isUri(url)){
				let noparams = url.split("?")[0];
				return (noparams.match(/\.(jpeg|jpg|gif|png)$/) != null);
			} else return false;
		}

		if (!(checkURL(attachment))) return message.channel.send(`<:${emoji.x}> Please provide a valid attachment! Attachments can have extensions of \`jpeg\`, \`jpg\`, \`png\`, or \`gif\``);

		qSuggestionDB.attachment = attachment;
		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let suggestionEditEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.get(qServerDB.config.channels.suggestions).fetchMessage(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return message.channel.send(`<:${emoji.x}> There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

		let replyEmbed = new Discord.RichEmbed()
			.setTitle("Attachment Added")
			.setDescription(`${qSuggestionDB.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.setImage(attachment)
			.setColor(colors.blue)
			.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} added an attachment to #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", qSuggestionDB.suggestion)
				.setImage(attachment)
				.setFooter(`Suggestion ID: ${id.toString()} | Attacher ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.blue);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
