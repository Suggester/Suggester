const { emoji } = require("../../config.json");
const { dbQuery, dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { confirmation } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "autosetup",
		permission: 2,
		aliases: ["autoconfig"],
		usage: "autosetup",
		description: "Automatically sets up channels and configures the bot",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "MANAGE_CHANNELS"],
		cooldown: 60,
		docs: "admin/autosetup"
	},
	do: async (locale, message, client, args, Discord) => {
		if ((
			await confirmation(
				message,
				string(locale, "AUTOSETUP_WARNING", { check: `<:${emoji.check}>`, x: `<:${emoji.x}>`}),
				{
					denyMessage: string(locale, "SETUP_CANCELLED", {}, "error"),
					confirmMessage: string(locale, "PROCESSING"),
					keepReactions: false
				}
			)
		)) {
			//Start auto setup
			let qServerDB = await dbQuery("Server", {id: message.guild.id});
			const guildLocale = qServerDB.config.locale || "en";

			let roles = message.guild.roles.cache.filter(role => role.permissions.has("MANAGE_GUILD") && !role.managed).map(r => r.id);
			let category = await message.guild.channels.create(string(guildLocale, "AUTOSETUP_CATEGORY") || "Suggester", { type: "category", reason: string(locale, "AUTOMATIC_SETUP") });
			let suggestions = await message.guild.channels.create(string(guildLocale, "AUTOSETUP_SUGGESTIONS") || "suggestions", { type: "text", reason: string(locale, "AUTOMATIC_SETUP"), parent: category.id, permissionOverwrites: [{
				id: client.user.id,
				allow: ["ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"]
			},
			{
				id: message.guild.id,
				deny: ["ADD_REACTIONS", "SEND_MESSAGES"]
			}]
			});
			let denied = await message.guild.channels.create(string(guildLocale, "AUTOSETUP_DENIED") || "denied-suggestions", { type: "text", reason: string(locale, "AUTOMATIC_SETUP"), parent: category.id, permissionOverwrites: [{
				id: client.user.id,
				allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"]
			},
			{
				id: message.guild.id,
				deny: ["ADD_REACTIONS", "SEND_MESSAGES"]
			}]
			});
			let reviewPerms = [{
				id: client.user.id,
				allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"]
			}, {
				id: message.guild.id,
				deny: ["VIEW_CHANNEL"]
			}];
			roles.forEach(r => reviewPerms.push({
				id: r,
				allow: ["VIEW_CHANNEL"]
			}));
			let review = await message.guild.channels.create(string(guildLocale, "AUTOSETUP_REVIEW") || "suggestion-review", { type: "text", reason: string(locale, "AUTOMATIC_SETUP"), parent: category.id, permissionOverwrites: reviewPerms });
			let logPerms = [{
				id: client.user.id,
				allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_WEBHOOKS"]
			}, {
				id: message.guild.id,
				deny: ["VIEW_CHANNEL"]
			}];
			roles.forEach(r => reviewPerms.push({
				id: r,
				allow: ["VIEW_CHANNEL"]
			}));
			let log = await message.guild.channels.create(string(guildLocale, "AUTOSETUP_LOG") || "suggestion-log", { type: "text", reason: string(locale, "AUTOMATIC_SETUP"), parent: category.id, permissionOverwrites: logPerms });
			let webhook = await log.createWebhook("Suggester Logs", {avatar: client.user.displayAvatarURL({format: "png"}), reason: string(locale, "CREATE_LOG_CHANNEL")});
			qServerDB.config.loghook = {};
			qServerDB.config.loghook.id = webhook.id;
			qServerDB.config.loghook.token = webhook.token;
			qServerDB.config.admin_roles = roles;
			qServerDB.config.staff_roles = roles;
			qServerDB.config.channels.suggestions = suggestions.id;
			qServerDB.config.channels.staff = review.id;
			qServerDB.config.channels.denied = denied.id;
			qServerDB.config.channels.log = log.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(string(locale, "AUTOMATIC_SETUP_COMPLETE_NEW", { prefix: Discord.escapeMarkdown(qServerDB.config.prefix) }, "success"));
		}
	}
};
