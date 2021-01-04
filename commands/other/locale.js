const { access } = require("fs");
const { dbQuery, dbModify } = require("../../utils/db");
const { support_invite } = require("../../config.json");
const { string, list } = require("../../utils/strings");
const { checkPermissions } = require("../../utils/checks");
const exec = (require("util").promisify((require("child_process").exec)));
const { reloadLocales } = require("../../utils/misc");
const { cleanCommand } = require("../../utils/actions");

module.exports = {
	controls: {
		name: "locale",
		permission: 10,
		aliases: ["language", "translate", "translation", "locales", "lang"],
		usage: "locale <locale to set>",
		description: "Sets the language the bot responds to you in",
		examples: "`{{p}}locale`\nShows the list of available languages\n\n`{{p}}locale fr`\nSets your language to French",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "EMBED_LINKS"],
		cooldown: 5,
		docs: "sumup"
	},
	do: async (locale, message, client, args, Discord) => {
		let qUserDB = await dbQuery("User", { id: message.author.id });
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!args[0]) {
			let totalStrings = Object.keys(list).length;
			let localesDone = client.locales.filter(l => (Object.keys(l.list).filter(s => list[s]).length/totalStrings) > 0.65 || l.settings.force);
			let localesProgress = client.locales.filter(l => !localesDone.find(d => d.settings.code === l.settings.code));
			let embed = new Discord.MessageEmbed()
				.setTitle(string(locale, "LOCALE_LIST_TITLE"))
				.setDescription(localesDone.filter(l => !l.settings.hidden || qUserDB.locale === l.settings.code).map(l => ` - [${l.settings.code}] **${l.settings.native}** (${l.settings.english}) ${qUserDB.locale && qUserDB.locale === l.settings.code ? `:arrow_left: _${string(locale, "SELECTED")}_` : ""}`).join("\n"))
				.addField(string(locale, "LOCALE_LIST_INCOMPLETE_TITLE"), `${string(locale, "LOCALE_LIST_INCOMPLETE_DESC", { support_invite: `https://discord.gg/${support_invite}` })}\n${localesProgress.filter(l => !l.settings.hidden || qUserDB.locale === l.settings.code).map(l => ` - [${l.settings.code}] **${l.settings.native}** (${l.settings.english}) ${qUserDB.locale && qUserDB.locale === l.settings.code ? `:arrow_left: _${string(locale, "SELECTED")}_` : ""}`).join("\n")}`)
				.setFooter(string(locale, "LOCALE_FOOTER"))
				.setColor(client.colors.default);
			return message.channel.send(embed).then(sent => cleanCommand(message, sent, qServerDB));
		}
		let permission = await checkPermissions(message.member, client);
		if (permission <= 1 && args[0].toLowerCase() === "pull") {
			return access("i18n", async function(error) {
				let m;
				if (error) {
					//Dir does not exist
					let clone = await exec("git submodule update --init");
					m = await message.channel.send(clone.stdout.substr(0, 1900), { code: "xl" });
				} else {
					//Dir exists
					let pull = await exec("git submodule foreach git pull origin master");
					m = await message.channel.send(pull.stdout.substr(0, 1900), { code: "xl" });
				}
				reloadLocales(client)
					.then((count) => m.edit(`${m.content.match(/```..([\s\S]+)```/)[1]}\n${string(locale, "LOCALE_REFRESH_SUCCESS", { count })}`, { code: "xl" }))
					.catch((err) => message.channel.send(err.toString().substr(0, 2000), { code: "js" }));
			});
		} else if (permission <= 1 && args[0].toLowerCase() === "refresh") {
			reloadLocales(client)
				.then((count) => message.channel.send(string(locale, "LOCALE_REFRESH_SUCCESS", { count }, "success")))
				.catch((err) => message.channel.send(err.toString().substr(0, 2000), { code: "js" }));
			return;
		}

		let selection = args[0].toLowerCase();
		let found = client.locales.find(l => l.settings.code === selection || l.settings.native.toLowerCase() === selection || l.settings.english.toLowerCase() === selection);
		if (!found) {
			const easterEggChance = Math.floor(Math.random() * 100);
			if (easterEggChance === 7) {
				found = client.locales.find((l) => l.settings.code === "owo");
				console.log(easterEggChance);
				message.channel.send(string(locale, "LOCALE_EASTER_EGG_ACTIVATED", {}, "<a:owo:717918218043260969>", "<a:owo:717918218043260969>")).then(sent => cleanCommand(message, sent, qServerDB));
			}
			else return message.channel.send(string(locale, "NO_LOCALE_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		}
		qUserDB.locale = found.settings.code;
		await dbModify("User", { id: message.author.id }, qUserDB);
		message.channel.send(`${string(found.settings.code, "USER_LOCALE_SET_SUCCESS", { name: found.settings.native, invite: `https://discord.gg/${support_invite}` }, "success")}${permission <= 2 ? `\n\n${string(found.settings.code, "LOCALE_SERVER_SETTING_PROMPT", { prefix: qServerDB.config.prefix, code: found.settings.code })}` : ""}`).then(sent => cleanCommand(message, sent, qServerDB));
	}
};
