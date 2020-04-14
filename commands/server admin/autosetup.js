const { emoji } = require("../../config.json");
const { dbQuery, dbModify } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "autosetup",
		permission: 2,
		aliases: ["autoconfig"],
		usage: "autosetup",
		description: "Automatically sets up channels and configures the bot",
		enabled: true,
		docs: "admin/autosetup",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "MANAGE_CHANNELS"],
		cooldown: 60
	},
	do: async (message, client, args, Discord) => {
		message.channel.send(`⚠️ Automatic Setup Warning ⚠️\n**This setup will overwrite any previous configuration and add channels to your server.**\n\nIf you would like to continue with automatic setup, click the <:${emoji.check}> reaction. If you would like to abort automatic setup, click the <:${emoji.x}> reaction.`).then(async (checkMsg) => {
			await checkMsg.react(emoji.check);
			await checkMsg.react(emoji.x);
			let checkMatches = emoji.check.match(/[a-z0-9~-]+:([0-9]+)/i)[1] || null;
			let xMatches = emoji.x.match(/[a-z0-9~-]+:([0-9]+)/i)[1] || null;

			const filter = (reaction, user) =>
				(reaction.emoji.id === checkMatches || reaction.emoji.id === xMatches) &&
					user.id === message.author.id;
			await checkMsg
				.awaitReactions(filter, {
					time: 15000,
					max: 1,
					errors: ["time"]
				})
				.then(async (collected) => {
					if (collected.first().emoji.id === xMatches) {
						return checkMsg.edit(`<:${emoji.x}> **Setup Cancelled**`);
					} else {
						checkMsg.delete();
						//Start auto setup
						let qServerDB = await dbQuery("Server", {id: message.guild.id});

						let roles = message.guild.roles.cache.filter(role => role.permissions.has("MANAGE_GUILD") && !role.managed).map(r => r.id);
						let category = await message.guild.channels.create("Suggester", { type: "category", reason: "Automatic setup" });
						let suggestions = await message.guild.channels.create("suggestions", { type: "text", reason: "Automatic setup", parent: category.id, permissionOverwrites: [{
							id: client.user.id, 
							allow: ["ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"]
						}, 
						{
							id: message.guild.id,
							deny: ["ADD_REACTIONS", "SEND_MESSAGES"]
						}]
						});
						let denied = await message.guild.channels.create("denied-suggestions", { type: "text", reason: "Automatic setup", parent: category.id, permissionOverwrites: [{
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
						let review = await message.guild.channels.create("suggestion-review", { type: "text", reason: "Automatic setup", parent: category.id, permissionOverwrites: reviewPerms });
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
						let log = await message.guild.channels.create("suggestion-log", { type: "text", reason: "Automatic setup", parent: category.id, permissionOverwrites: logPerms });
						let webhook = await log.createWebhook("Suggester Logs", {avatar: client.user.displayAvatarURL({format: "png"}), reason: "Create log channel"});
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
						return message.channel.send(`<:${emoji.check}> Automatic setup complete!\n>>> Want to use more advanced configuration elements like custom reactions, a role given on approved suggestions, and more? Try the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command: https://suggester.js.org/#/admin/config`);
					}
				});
		});
	}
};