const config = require("./config.json");
const { colors, emoji } = require("./config.json");
const Discord = require("discord.js");
let models = require("./utils/schemas");

/**
 * Send a message from a webhook
 * @param {Object} cfg - Where to send the webhook; contains webhook token and id
 * @param {module:"discord.js".RichEmbed} input - What to send
 */
function sendWebhook (cfg, input) {
	(new Discord.WebhookClient(cfg.id, cfg.token)).send(input).then(hookMessage => {
		return `https://discordapp.com/channels/${config.main_guild}/${hookMessage.channel_id}/${hookMessage.id}`;
	});
}

module.exports = {
	//checkPermissions: Returns permission level of inputted ID
	checkPermissions: (member, client) => {
		if (config.developer.includes(member.id)) return 0;
		return 15;
		if (client.core.get("blacklist") && client.core.get("blacklist", "users").includes(member.id)) return 12;
		if (client.guilds.get(config.main_guild) && client.guilds.get(config.main_guild).available && client.guilds.get(config.main_guild).roles.get(config.global_override).members.get(member.id)) return 1;
		if (member.hasPermission("MANAGE_GUILD")) return 2;
		if (!client.servers.get(member.guild.id) || !client.servers.get(member.guild.id, "admin_roles")) return 10;
		var adminRoles = 0;
		client.servers.get(member.guild.id, "admin_roles").forEach(roleid => {
			if (member.roles.has(roleid)) adminRoles++;
		});
		if (adminRoles > 0) return 2;
		if (!client.servers.get(member.guild.id, "staff_roles")) return 10;
		var staffRoles = 0;
		client.servers.get(member.guild.id, "staff_roles").forEach(roleid => {
			if (member.roles.has(roleid)) staffRoles++;
		});
		if (staffRoles > 0) return 3;
		if (client.servers.get(member.guild.id) && client.servers.get(member.guild.id, "blacklist") && client.servers.get(member.guild.id, "blacklist").includes(member.id)) return 11;
		return 10;
	},
	guildLog: (input) => {
		return sendWebhook(config.log_hooks.guild, input);
	},
	coreLog: (input) => {
		return sendWebhook(config.log_hooks.core, input);
	},
	commandLog: (input) => {
		return sendWebhook(config.log_hooks.commands, input);
	},
	permLevelToRole: (permLevel) => {
		switch (permLevel) {
		case -1:
			return "No Users";
		case 0:
			return "Bot Administrator";
		case 1:
			return "Global Permissions+";
		case 2:
			return "Server Administrator (Manage Server or Admin Role)+";
		case 3:
			return "Server Staff (Staff Role)+";
		case 10:
			return "All Users";
		default:
			return "Undefined, permission level not mapped in `core.permLevelToRole()`";
		}
	},
	suggestionEmbed: async (suggestion, server, client) => {
		let { fetchUser } = require("./coreFunctions.js");
		let suggester = await fetchUser(suggestion.suggester, client);
		let embed = new Discord.RichEmbed();
		// User information
		if (suggester) {
			embed.setAuthor(`Suggestion from ${suggester.tag}`, suggester.displayAvatarURL)
				.setThumbnail(suggester.displayAvatarURL);
		} else {
			embed.setTitle("Suggestion from Unknown User");
		}
		// Suggestion
		embed.setDescription(suggestion.suggestion)
		// Footer
			.setTimestamp(suggestion.submitted)
			.setFooter(`Suggestion ID: ${suggestion.suggestionId} | Submitted at`);
		// Side Color
		switch (suggestion.displayStatus) {
		case "implemented": {
			embed.setColor(colors.green)
				.addField("Status", "Implemented");
			break;
		}
		case "working": {
			embed.addField("Status", "In Progress")
				.setColor(colors.orange);
			break;
		}
		case "no": {
			embed.addField("Status", "Not Happening")
				.setColor(colors.gray);
			break;
		}
		default: {
			if (suggestion.votes.upvotes - suggestion.votes.downvotes >= server.config.gold_threshold) {
				embed.setColor(colors.gold);
			} else {
				embed.setColor(colors.default);
			}
		}
		}
		// Comments
		if (suggestion.comments) {
			for (const comment of suggestion.comments) {
				if (!comment.deleted || comment.deleted !== true) {
					let user = await fetchUser(comment.author, client);
					let title;
					!user ? title = `Staff Comment (ID: ${suggestion.suggestionId}_${comment.id})` : title = `Comment from ${user.tag} (ID: ${suggestion.suggestionId}_${comment.id})`;
					embed.addField(title, comment.comment);
				}
			}
		}
		// Attachment
		if (suggestion.attachment) embed.setImage(suggestion.attachment);

		return embed;
	},
	channelPermissions: (permissions, type, client) => {
		const permissionNames = require("./utils/permissions.json");
		let required = [];
		let list = [];
		switch (type) {
		case "suggestions":
			required = ["ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			list = [];

			required.forEach(permission => {
				if (!permissions.has(permission)) list.push(permissionNames[permission]);
			});
			return list;
			break;
		case "staff":
			required = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			list = [];
			required.forEach(permission => {
				if (!permissions.has(permission)) list.push(permissionNames[permission]);
			});
			return list;
			break;
		case "denied":
			required = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			list = [];
			required.forEach(permission => {
				if (!permissions.has(permission)) list.push(permissionNames[permission]);
			});
			return list;
			break;
		case "log":
			required = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_WEBHOOKS"];
			list = [];
			required.forEach(permission => {
				if (!permissions.has(permission)) list.push(permissionNames[permission]);
			});
			return list;
			break;
		}
	},
	/**
	 * Logs an input to the specified server's log channel
	 * @param input - What to send
	 * @param {Object} server - Server configuration settings
	 * @returns null
	 */
	serverLog: (input, server) => {
		if (!server.config.loghook) return `<:${emoji.x}> No log hook configured, please reconfigure a log channel`;
		(new Discord.WebhookClient(server.config.loghook.id, server.config.loghook.token)).send(input);
	},
	errorLog: (err, type, footer) => {
		let errorText = "Error Not Set";
		if (err.stack) {
			console.error((require("chalk")).red(err.stack));
			errorText = err.stack;
		}
		else {
			console.error((require("chalk")).red(err.error));
			errorText = err.error;
		}
		let embed = new Discord.RichEmbed()
			.setAuthor(type)
			.setTitle(err.message.substring(0, 256))
			.setDescription(`\`\`\`js\n${(errorText).length >= 1000 ? (errorText).substring(0, 1000) + " content too long..." : err.stack}\`\`\``)
			.setColor("DARK_RED")
			.setTimestamp()
			.setFooter(footer);

		sendWebhook(config.log_hooks.debug, embed);
		//sendWebhook(config.log_hooks.commands, ("<@255834596766253057>" + embed));

	},
	/**
	 * Fetch a user
	 * @param {string} id - The Discord ID of the user
	 * @param {module:"discord.js".Client} client - The bot client
	 * @returns {Collection}
	 */
	fetchUser: async (id, client) => {
		if (client.users.get(id)) {
			return client.users.get(id);
		} else {
			client.fetchUser(id, true).then(user => {
				return user;
			}).catch(notFound => {
				return null;
			});
		}
		return null;
	},
	/**
	 * Search the database for an id
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQuery: async (collection, query) => {
		return await models[collection].findOne(
			query
		)
			.then((res) => {
				if (!res) {
					return new models[collection](
						query
					).save();
				}
				return res;
			}).catch((error) => {
				console.log(error);
			});
	},
	/**
	 * Search the database for some parameters
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQueryNoNew: async (collection, query) => {
		return await models[collection].findOne(
			query
		)
			.then((res) => {
				if (!res) return null;
				else return res;
			}).catch((error) => {
				console.log(error);
			});
	},
	/**
	 * Modify the database by providing either the userId or serverId
	 * @param {string} collection - Who should be modified, user or server.
	 * @param  {Snowflake | string} id - The id of the user/server
	 * @param {Object} modify - Should the user/server be blocked or unblocked
	 * @returns {Object}
	 */
	dbModifyId: async (collection, id, modify) => {
		modify.id = id;
		return await models[collection].findOne({
			id: id
		})
			.then(async (res) => {
				if (!res) {
					return new models[collection](
						modify
					).save();
				}
				await res.update(modify);
				return res;
			});
	},
	/**
	 * Modify the database by providing either the userId or serverId.
	 *
	 * *Note: Does not create new if not found.*
	 * @param {string} collection - Who should be modified, user or server.
	 * @param {Object} term - Which to modify
	 * @param {Object} query - Which to modify
	 * @param {Object} modify - What to change it to
	 * @returns {Promise}
	 */
	dbModify (collection, query, modify) {
		return models[collection].findOneAndUpdate(query, modify)
			.then((res) => {
				return res;
			});
	},
	/**
	 * Delete one document
	 * @param {string} collection - Which collection the document is in
	 * @param {Object} query - Which to delete
	 * @returns {Promise<void>}
	 */
	dbDeleteOne: async (collection, query) => {
		return await models[collection].findOne(
			query
		)
			.then(async (res) => {
				if (!res) return undefined;
				await res.deleteOne();
				return res;
			});
	}
};
