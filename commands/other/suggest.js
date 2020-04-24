const { emoji, colors } = require("../../config.json");
const core = require("../../coreFunctions.js");
const { dbQuery, dbModify, serverLog, suggestionEmbed, checkPermissions } = require("../../coreFunctions");
const { Suggestion } = require("../../utils/schemas");
const validUrl = require("valid-url");

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

module.exports = {
	controls: {
		name: "suggest",
		permission: 10,
		aliases: ["submit"],
		usage: "suggest <suggestion>",
		description: "Submits a suggestion",
		enabled: true,
		docs: "all/suggest",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 30
	},
	do: async (message, client, args, Discord) => {
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
			!client.channels.cache.get(qServerDB.config.channels.staff)) {
			missingConfigs.push("Suggestion Review Channel");
		}

		if (missingConfigs.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${qServerDB.config.prefix}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missingConfigs.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		let permission = await checkPermissions(message.member, client);

		if (qServerDB.config.allowed_roles && qServerDB.config.allowed_roles.length > 0 && permission > 3) {
			let hasAllowedRole = false;
			qServerDB.config.allowed_roles.forEach(roleId => {
				if (message.member.roles.cache.has(roleId)) hasAllowedRole = true;
			});
			if (!hasAllowedRole) {
				let allowedRoleList = [];
				let removed = false;
				qServerDB.config.allowed_roles.forEach(roleId => {
					if (message.guild.roles.cache.get(roleId)) {
						allowedRoleList.push({
							name: message.guild.roles.cache.get(roleId).name,
							id: message.guild.roles.cache.get(roleId).id
						});
					} else {
						let index = qServerDB.config.allowed_roles.findIndex(r => r === roleId);
						qServerDB.config.allowed_roles.splice(index, 1);
						removed = true;
					}
				});
				qServerDB.config.staff_roles.forEach(roleId => {
					if (!allowedRoleList.find(r => r.id === roleId)) {
						if (message.guild.roles.cache.get(roleId)) {
							allowedRoleList.push({
								name: message.guild.roles.cache.get(roleId).name,
								id: message.guild.roles.cache.get(roleId).id
							});
						} else {
							let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
							qServerDB.config.staff_roles.splice(index, 1);
							removed = true;
						}
					}
				});
				qServerDB.config.admin_roles.forEach(roleId => {
					if (!allowedRoleList.find(r => r.id === roleId)) {
						if (message.guild.roles.cache.get(roleId)) {
							allowedRoleList.push({
								name: message.guild.roles.cache.get(roleId).name,
								id: message.guild.roles.cache.get(roleId).id
							});
						} else {
							let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
							qServerDB.config.admin_roles.splice(index, 1);
							removed = true;
						}
					}
				});
				if (removed) await dbModify("Server", { id: message.guild.id }, qServerDB);
				return message.channel.send(`<:${emoji.x}> You do not have the role necessary to submit suggestions.\nThe following roles can submit suggestions: ${allowedRoleList.map(r => r.name).join(", ")}`, {disableMentions: "everyone"}).then(sent => {
					if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
						message.delete();
						sent.delete();
					}, 7500);
				});
			}
		}

		if (qServerDB.config.channels.commands && message.channel.id !== qServerDB.config.channels.commands) return message.channel.send(`<:${emoji.x}> Suggestions can only be submitted in the <#${qServerDB.config.channels.commands}> channel.`);

		let attachment = message.attachments.first() ? message.attachments.first().url : "";
		if (!args[0] && !attachment) return message.channel.send("Please provide a suggestion!").then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});
		if (attachment && !(checkURL(attachment))) return message.channel.send(`<:${emoji.x}> Please provide a valid attachment! Attachments can have extensions of \`jpeg\`, \`jpg\`, \`png\`, or \`gif\``).then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});

		let suggestion = args.join(" ");

		if (suggestion.length > 1024) return message.channel.send(`<:${emoji.x}> Suggestions cannot be longer than 1024 characters.`).then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});

		let id = await Suggestion.countDocuments() + 1;

		//Review
		if (qServerDB.config.mode === "review") {
			if (client.channels.cache.get(qServerDB.config.channels.staff)) {
				let perms = core.channelPermissions(client.channels.cache.get(qServerDB.config.channels.staff).permissionsFor(client.user.id), "staff", client);
				if (perms.length > 0) {
					let embed = new Discord.MessageEmbed()
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
				suggestionId: id,
				attachment: attachment,
				submitted: new Date()
			}).save();

			let replyEmbed = new Discord.MessageEmbed()
				.setAuthor(`Suggestion from ${message.author.tag}`, message.author.displayAvatarURL({dynamic: true, format: "png"}))
				.setDescription(suggestion)
				.setFooter(`Suggestion ID: ${id.toString()} | Submitted at `)
				.setTimestamp()
				.setColor(colors.default)
				.setImage(attachment);
			message.channel.send("Your suggestion has been submitted for review!", replyEmbed).then(sent => {
				if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
					message.delete();
					sent.delete();
				}, 7500);
			});

			let reviewEmbed = new Discord.MessageEmbed()
				.setTitle("Suggestion Awaiting Review (#" + id.toString() + ")")
				.setAuthor(`${message.author.tag} (ID: ${message.author.id})`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(suggestion)
				.setColor(colors.yellow)
				.addField("Approve/Deny", `Use **${qServerDB.config.prefix}approve ${id.toString()}** to send to <#${qServerDB.config.channels.suggestions}>\nUse **${qServerDB.config.prefix}deny ${id.toString()}** to deny`);

			if (attachment) {
				reviewEmbed.addField("With Attachment", attachment)
					.setImage(attachment);
			}

			client.channels.cache.get(qServerDB.config.channels.staff).send(reviewEmbed)
				.then(async (posted) => {
					await dbModify("Suggestion", { suggestionId: id }, { reviewMessage: posted.id });
				});

			if (qServerDB.config.channels.log) {
				let logEmbed = new Discord.MessageEmbed()
					.setAuthor(`${message.author.tag} submitted a suggestion for review`, message.author.displayAvatarURL({format: "png", dynamic: true}))
					.setDescription(suggestion)
					.setFooter(`Suggestion ID: ${id.toString()} | User ID: ${message.author.id}`)
					.setTimestamp()
					.setColor(colors.yellow);

				if (attachment) {
					logEmbed.setImage(attachment)
						.addField("With Attachment", attachment);
				}

				serverLog(logEmbed, qServerDB, client);
			}
		} else if (qServerDB.config.mode === "autoapprove") {
			if (client.channels.cache.get(qServerDB.config.channels.suggestions)) {
				let perms = core.channelPermissions(client.channels.cache.get(qServerDB.config.channels.suggestions).permissionsFor(client.user.id), "suggestions", client);
				if (perms.length > 0) {
					let embed = new Discord.MessageEmbed()
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
				attachment: attachment,
				submitted: new Date()
			}).save();

			let qSuggestionDB = await dbQuery("Suggestion", { suggestionId: id });
			let embedSuggest = await suggestionEmbed(qSuggestionDB, qServerDB, client);
			client.channels.cache.get(qServerDB.config.channels.suggestions)
				.send(embedSuggest)
				.then(async (posted) => {
					await dbModify("Suggestion", { suggestionId: id }, { messageId: posted.id });

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

			let replyEmbed = new Discord.MessageEmbed()
				.setAuthor(`Suggestion from ${message.author.tag}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(suggestion)
				.setFooter(`Suggestion ID: ${id.toString()} | Submitted at `)
				.setTimestamp()
				.setColor(colors.default)
				.setImage(attachment);
			message.channel.send(`Your suggestion has been added to the <#${qServerDB.config.channels.suggestions}> channel!`, replyEmbed).then(sent => {
				if (qServerDB.config.clean_suggestion_command) setTimeout(function() {
					message.delete();
					sent.delete();
				}, 7500);
			});

			if (qServerDB.config.channels.log) {
				let logEmbed = new Discord.MessageEmbed()
					.setAuthor(`${message.author.tag} submitted a suggestion`, message.author.displayAvatarURL({format: "png", dynamic: true}))
					.setDescription(suggestion)
					.setFooter(`Suggestion ID: ${id.toString()} | User ID: ${message.author.id}`)
					.setTimestamp()
					.setColor(colors.green);

				if (attachment) {
					logEmbed.setImage(attachment)
						.addField("With Attachment", attachment);
				}

				serverLog(logEmbed, qServerDB, client);
			}
		}
	}
};
