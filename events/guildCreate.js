const { dbQuery, guildLog } = require("../coreFunctions.js");
const { release, prefix, support_invite, colors } = require("../config.json");
module.exports = async (Discord, client, guild) => {
	let qServerDB = await dbQuery("Server", { id: guild.id });
	if (qServerDB && qServerDB.blocked) {
		await guild.leave();
		return guildLog(`:no_entry: I was added to blacklisted guild **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`) and left`, client);
	}

	let enforceWhitelist = [
		"special",
		"premium"
	];
	if ((enforceWhitelist.includes(release)) && (!qServerDB || !qServerDB.whitelist)) {
		await guild.leave();
		return guildLog(`:no_entry: I was added to non-whitelisted guild **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`) and left`, client);
	}

	await guildLog(`:inbox_tray: New Guild: **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`)\n>>> **Owner:** ${guild.owner && guild.owner.user ? `${guild.owner.user.tag} (\`${guild.owner.id}\`)` : "Owner Tag Unknown"}\n**Member Count:** ${guild.memberCount ? guild.memberCount : "Member Count Unknown"}`, client);

	await guild.members.fetch(client.user.id);
	if (guild.me.joinedTimestamp+60000<Date.now()) return;
	
	let embed = new Discord.MessageEmbed()
		.setAuthor("Thanks for adding Suggester!", client.user.displayAvatarURL({format: "png"}))
		.setColor(colors.default)
		.setDescription(`Suggester will help you easily and efficiently manage your server's suggestions, letting you get feedback from your community while also keeping out spam/unwanted suggestions! Staff members can also do things like add comments, mark statuses on suggestions, and more! The bot's prefix is \`${prefix}\` by default, but can be changed at any time.`)
		.addField("Let's Get Started!", `Before users can submit suggestions, someone with the **Manage Server** permission needs to do a bit of configuration. An easy way to do this is to run \`${prefix}setup\`, which will start a walkthrough for setting up the most essential elements of the bot.`)
		.addField("What's Next?", `After you run \`${prefix}setup\`, users can submit suggestions and the bot will work. If you are looking for more advanced configuration options like custom suggestion feed reactions and auto-cleaning of suggestion commands, take a look at https://suggester.js.org/#/admin/config.\n\nIf you've got an issue, or just want to find out more about the bot, head over to the __Suggester support server__: https://discord.gg/${support_invite}`);
	let names = ["staff", "admin", "mod", "bot", "general"];
	let channelsFetch = guild.channels.cache.filter(c => names.filter(a => c.name.includes(a)).length > 0 && c.type === "text" && c.permissionsFor(client.user.id).has(["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"]) && !c.name.includes("log"));
	if (channelsFetch.size > 0) return channelsFetch.first().send(embed);
	let notNames = ["rules", "announcements", "news", "info", "welcome", "log"];
	let channelsFetch2 = guild.channels.cache.filter(c => notNames.filter(a => c.name.includes(a)).length === 0 && c.type === "text" && c.permissionsFor(client.user.id).has(["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"]));
	if (channelsFetch2.size > 0) return channelsFetch2.first().send(embed);
};
