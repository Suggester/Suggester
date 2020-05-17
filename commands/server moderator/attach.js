const { colors, emoji, prefix } = require("../../config.json");
const { dbQuery, dbModify, checkChannel, dbQueryNoNew, serverLog, suggestionEmbed, checkConfig } = require("../../coreFunctions.js");
const validUrl = require("valid-url");
module.exports = {
	controls: {
		name: "attach",
		permission: 3,
		usage: "attach <suggestion id> <attachment link>",
		description: "Attaches a file to an approved suggestion",
		image: "images/Attach.gif",
		enabled: true,
		docs: "staff/attach",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ATTACH_FILES"],
		cooldown: 5
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

		if (qSuggestionDB.status !== "approved") return message.channel.send(`<:${emoji.x}> Attachments can only be added to approved suggestions!`);

		if (qSuggestionDB.implemented) return message.channel.send(`<:${emoji.x}> This suggestion has been marked as implemented and moved to the implemented archive channel, so no further actions can be taken on it.`);

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
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return message.channel.send(`<:${emoji.x}> There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle("Attachment Added")
			.setDescription(`${qSuggestionDB.suggestion || "[No Suggestion Content]"}\n[Suggestions Feed Post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.setImage(attachment)
			.setColor(colors.blue)
			.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(`${message.author.tag} added an attachment to #${id.toString()}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField("Suggestion", qSuggestionDB.suggestion || "[No Suggestion Content]")
				.setImage(attachment)
				.setFooter(`Suggestion ID: ${id.toString()} | Attacher ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.blue);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
