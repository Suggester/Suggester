const { emoji, colors } = require("../config.json");
const core = require("../coreFunctions.js");
const { dbQuery, dbModify, serverLog, suggestionEmbed } = require("../coreFunctions");
const { Suggestion } = require("../utils/schemas");
module.exports = {
	controls: {
		permission: 10,
		aliases: ["submit"],
		usage: "suggest <suggestion>",
		description: "Submits a suggestion",
		enabled: true,
		docs: "all/suggest",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (!args) return;
		let missingConfigs = [];
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`setup\` command.`);

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

		if (!args[0]) return message.channel.send("Please provide a suggestion!");

		let suggestion = args.join(" ");

		let id = await Suggestion.countDocuments() + 1;

		//Review
		if (qServerDB.config.mode === "review") {
			if (client.channels.get(qServerDB.config.channels.staff)) {
				let perms = core.channelPermissions(client.channels.get(qServerDB.config.channels.staff).memberPermissions(client.user.id), "staff", client);
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

			await new Suggestion({
				id: message.guild.id,
				suggester: message.author.id,
				suggestion: suggestion,
				status: "awaiting_review",
				suggestionId: id
			}).save();

			let replyEmbed = new Discord.RichEmbed()
				.setAuthor(
					`Suggestion from ${message.author.tag}`,
					message.author.displayAvatarURL
				)
				.setDescription(suggestion)
				.setFooter(`Suggestion ID: ${id.toString()} | Submitted at `)
				.setTimestamp()
				.setColor(colors.default);
			message.channel.send(
				"Your suggestion has been submitted for review!",
				replyEmbed
			);

			let reviewEmbed = new Discord.RichEmbed()
				.setTitle(
					"Suggestion Awaiting Review (#" + id.toString() + ")"
				)
				.setAuthor(
					`${message.author.tag} (ID: ${message.author.id})`,
					message.author.displayAvatarURL
				)
				.setDescription(suggestion)
				.setColor(colors.yellow)
				.addField(
					"Approve/Deny",
					`Use **${qServerDB.config.prefix}approve ${id.toString()}** to send to <#${qServerDB.config.channels.suggestions}>\nUse **${qServerDB.config.prefix}deny ${id.toString()}** to deny`
				);

			client.channels
				.get(qServerDB.config.channels.staff)
				.send(reviewEmbed)
				.then(async (posted) => {
					await dbModify("Suggestion", { suggestionId: id }, { reviewMessage: posted.id });
				});

			if (qServerDB.config.channels.log) {
				let logEmbed = new Discord.RichEmbed()
					.setAuthor(`${message.author.tag} submitted a suggestion for review`, message.author.displayAvatarURL)
					.setDescription(suggestion)
					.setFooter(`Suggestion ID: ${id.toString()} | User ID: ${message.author.id}`)
					.setTimestamp()
					.setColor(colors.yellow);
				serverLog(logEmbed, qServerDB);
			}
		} else if (qServerDB.config.mode === "autoapprove") {
			if (client.channels.get(qServerDB.config.channels.suggestions)) {
				let perms = core.channelPermissions(client.channels.get(qServerDB.config.channels.suggestions).memberPermissions(client.user.id), "suggestions", client);
				if (perms.length > 0) {
					let embed = new Discord.RichEmbed()
						.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${qServerDB.config.channels.suggestions}> channel:`)
						.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
						.addField("How to Fix", `In the channel settings for <#${qServerDB.config.channels.suggestions}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
						.setColor(colors.red);
					return message.channel.send(embed);
				}
			} else {
				return message.channel.send(`<:${emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestion channel.`);
			}

			await new Suggestion({
				id: message.guild.id,
				suggester: message.author.id,
				suggestion: suggestion,
				status: "approved",
				suggestionId: id,
				staff_member: client.user.id,
				votes: {
					upvotes: 0,
					downvotes: 0
				}
			}).save();

			let qSuggestionDB = await dbQuery("Suggestion", { suggestionId: id });
			let embedSuggest = await suggestionEmbed(qSuggestionDB, qServerDB, client);
			client.channels
				.get(qServerDB.config.channels.suggestions)
				.send(embedSuggest)
				.then(async (posted) => {
					await dbModify("Suggestion", { suggestionId: id }, { messageId: posted.id });

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

			let replyEmbed = new Discord.RichEmbed()
				.setAuthor(
					`Suggestion from ${message.author.tag}`,
					message.author.displayAvatarURL
				)
				.setDescription(suggestion)
				.setFooter(`Suggestion ID: ${id.toString()} | Submitted at `)
				.setTimestamp()
				.setColor(colors.default);
			message.channel.send(
				`Your suggestion has been added to the <#${qServerDB.config.channels.suggestions}> channel!`,
				replyEmbed
			);

			if (qServerDB.config.channels.log) {
				let logEmbed = new Discord.RichEmbed()
					.setAuthor(`${message.author.tag} submitted a suggestion`, message.author.displayAvatarURL)
					.setDescription(suggestion)
					.setFooter(`Suggestion ID: ${id.toString()} | User ID: ${message.author.id}`)
					.setTimestamp()
					.setColor(colors.green);
				serverLog(logEmbed, qServerDB);
			}
		}
	}
};
