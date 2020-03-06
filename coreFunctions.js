const config = require("./config.json");
const { colors, emoji } = require("./config.json");
const Discord = require("discord.js");
let models = require("./utils/schemas");
const { promises } = require("fs");
const { resolve } = require("path");

/**
 * Send a message from a webhook
 * @param {Object} cfg - Where to send the webhook; contains webhook token and id
 * @param {module:"discord.js".RichEmbed} input - What to send
 * @param {module:"discord.js".RichEmbed} embed - embed to send
 */
function sendWebhook (cfg, input, embed) {
	input = Discord.Util.removeMentions(input);
	if (embed) (new Discord.WebhookClient(cfg.id, cfg.token)).send(input, embed).then(hookMessage => {
		return `https://discordapp.com/channels/${config.main_guild}/${hookMessage.channel_id}/${hookMessage.id}`;
	});
	else (new Discord.WebhookClient(cfg.id, cfg.token)).send(input).then(hookMessage => {
		return `https://discordapp.com/channels/${config.main_guild}/${hookMessage.channel_id}/${hookMessage.id}`;
	});
}

module.exports = {
	/**
	 * Returns permission level of inputted ID
	 * 
	 * 11 - Blacklisted\
	 * 10 - Everyone\
	 * 3 - Server staff\
	 * 2 - Server Admin\
	 * 1 - Global Permissions\
	 * 0 - Developer/Global Admin
	 * 
	 * @param member - Member object fetched from a server
	 * @param client - The Discord client
	 * @returns {Promise<number>}
	 */
	checkPermissions: async (member, client) => {
		if (!member || !member.id || !client) return 10;
		if (config.developer.includes(member.id)) return 0;
		let { dbQueryNoNew } = require("./coreFunctions.js");
		let qUserDB = await dbQueryNoNew("User", { id: member.id });
		let qServerDB = await dbQueryNoNew("Server", { id: member.guild.id });
		if (qUserDB && qUserDB.blocked) return 12;
		if (client.guilds.cache.get(config.main_guild)
			&& client.guilds.cache.get(config.main_guild).available
			&& client.guilds.cache.get(config.main_guild).roles.cache.get(config.global_override).members.get(member.id)) {
			return 1;
		}
		if (member.hasPermission("MANAGE_GUILD")) return 2;
		if (!qServerDB || !qServerDB.config.admin_roles || qServerDB.config.admin_roles.length < 1) return 10;
		let hasAdminRole = false;
		qServerDB.config.admin_roles.forEach(roleId => {
			if (member.roles.cache.has(roleId)) hasAdminRole = true;
		});
		if (hasAdminRole) return 2;
		if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) return 10;
		let hasStaffRole = false;
		qServerDB.config.staff_roles.forEach(roleId => {
			if (member.roles.cache.has(roleId)) hasStaffRole = true;
		});
		if (hasStaffRole) return 3;
		if (qServerDB && qServerDB.config.blacklist && qServerDB.config.blacklist.includes(member.id)) return 11;
		return 10;
	},
	guildLog: (input, embed) => {
		return sendWebhook(config.log_hooks.guild, input, embed ? embed : null);
	},
	coreLog: (input, embed) => {
		return sendWebhook(config.log_hooks.core, input, embed ? embed : null);
	},
	commandLog: (input, embed) => {
		return sendWebhook(config.log_hooks.commands, input, embed ? embed : null);
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
	/**
	 * Send a suggestion to the suggestion channel
	 * @param {Object} suggestion - The database record for the suggestion
	 * @param {Object} server - The server's database record
	 * @param {module:"discord.js".Client} client - Discord.js client
	 * @return {Promise<module:"discord.js".RichEmbed>}
	 */
	suggestionEmbed: async (suggestion, server, client) => {
		let { fetchUser } = require("./coreFunctions.js");
		let suggester = await fetchUser(suggestion.suggester, client);
		let embed = new Discord.MessageEmbed();
		// User information
		if (suggester) {
			embed.setAuthor(`Suggestion from ${suggester.tag}`, suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}));
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
	channelPermissions: (permissions, type) => {
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
		case "staff":
			required = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			list = [];
			required.forEach(permission => {
				if (!permissions.has(permission)) list.push(permissionNames[permission]);
			});
			return list;
		case "denied":
			required = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			list = [];
			required.forEach(permission => {
				if (!permissions.has(permission)) list.push(permissionNames[permission]);
			});
			return list;
		case "log":
			required = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_WEBHOOKS"];
			list = [];
			required.forEach(permission => {
				if (!permissions.has(permission)) list.push(permissionNames[permission]);
			});
			return list;
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
		} else {
			console.error((require("chalk")).red(err.error));
			errorText = err.error;
		}
		let embed = new Discord.MessageEmbed()
			.setAuthor(type)
			.setTitle(err.message ? err.message.substring(0, 256) : "No Message Value")
			.setDescription(`\`\`\`js\n${(errorText).length >= 1000 ? (errorText).substring(0, 1000) + " content too long..." : err.stack}\`\`\``)
			.setColor("DARK_RED")
			.setTimestamp()
			.setFooter(footer);

		sendWebhook(config.log_hooks.debug, embed);
	},
	/**
	 * Fetch a user
	 * @param {string} id - The Discord ID of the user
	 * @param {module:"discord.js".Client} client - The bot client
	 * @returns {Collection}
	 */
	async fetchUser(id, client) {
		if (!id) return null;
		let foundId;
		let matches = id.match(/^<@!?(\d+)>$/);
		if (!matches) foundId = id;
		else foundId = matches[1];

		function fetchUnknownUser(uid) {
			return client.users.fetch(uid, true)
				.then(() => {
					return client.users.cache.get(uid);
				})
				.catch(() => {
					return null;
				});
		}

		return client.users.cache.get(foundId)
			|| fetchUnknownUser(foundId)
			|| null;
	},
	/**
	 * Search the database for an id, creates a new entry if not found
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
	 * Search the database for some parameters and return all entries that match, does not create a new entry if not found
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQueryAll: async (collection, query) => {
		return await models[collection].find(
			query
		)
			.then((res) => {
				if (!res) {
					return null;
				} else {
					return res;
				}
			}).catch((error) => {
				console.log(error);
			});
	},
	/**
	 * Search the database for some parameters, returns one entry and does not create a new entry if not found
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQueryNoNew: async (collection, query) => {
		return await models[collection].findOne(
			query
		)
			.then((res) => {
				if (!res) {
					return null;
				} else {
					return res;
				}
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
	dbModify(collection, query, modify) {
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
	},

};

/**
 * Like readdir but recursive :eyes:
 * @param {string} dir
 * @returns {Promise<string[]>} - Array of paths
 */
const fileLoader = async function* (dir) {
	const files = await promises.readdir(dir, { withFileTypes: true });
	for (let file of files) {
		const res = resolve(dir, file.name);
		if (file.isDirectory()) {
			yield* fileLoader(res);
		} else {
			yield res;
		}
	}
};

module.exports.fileLoader = fileLoader;