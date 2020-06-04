const { access } = require("fs");
const { dbQuery, dbModify } = require("../../utils/db");
const { colors, support_invite, emoji } = require("../../config.json");
const { string } = require("../../utils/strings");
const { checkPermissions } = require("../../utils/checks");
const exec = (require("util").promisify((require("child_process").exec)));
module.exports = {
	controls: {
		name: "locale",
		permission: 10,
		aliases: ["language", "translate", "translation", "locales", "lang"],
		usage: "locale <locale to set>",
		description: "Sets your personal locale",
		enabled: true,
		docs: "all/locale",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (locale, message, client, args, Discord) => {
		let qUserDB = await dbQuery("User", { id: message.author.id });
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!args[0]) {
			let embed = new Discord.MessageEmbed()
				.setTitle(string(locale, "LOCALE_LIST_TITLE"))
				.setDescription(client.locales.filter(l => l.settings.code !== "owo" || qUserDB.locale === "owo").map(l => ` - [${l.settings.code}] **${l.settings.native}** (${l.settings.english}) ${qUserDB.locale && qUserDB.locale === l.settings.code ? `:arrow_left: _${string(locale, "SELECTED")}_` : ""}`).join("\n"))
				.setFooter(string(locale, "LOCALE_FOOTER"))
				.setColor(colors.default);
			return message.channel.send(embed);
		}
		let permission = await checkPermissions(message.member, client);
		if (permission <= 1 && args[0].toLowerCase() === "pull") {

			return access("i18n", async function(error) {
				if (error) {
					//Dir does not exist
					let clone = await exec("git clone https://github.com/Suggester-Bot/i18n.git ./i18n");
					return message.channel.send(clone.stdout.substr(0, 1900), { code: "xl" });
				} else {
					//Dir exists
					let pull = await exec("cd i18n && git pull");
					return message.channel.send(pull.stdout.substr(0, 1900), { code: "xl" });
				}
			});
		}
		let selection = args[0].toLowerCase();
		let found = client.locales.find(l => l.settings.code === selection || l.settings.native.toLowerCase() === selection || l.settings.english.toLowerCase() === selection);
		if (!found) {
			const easterEggChance = Math.floor(Math.random() * 100);
			if (easterEggChance === 7) {
				found = client.locales.find((l) => l.settings.code === "owo");
				console.log(easterEggChance);
				message.channel.send(string(locale, "LOCALE_EASTER_EGG_ACTIVATED", {}, "<a:owo:717918218043260969>", "<a:owo:717918218043260969>"));
			}
			else return message.channel.send(string(locale, "NO_LOCALE_ERROR", {}, "error"));
		}
		qUserDB.locale = found.settings.code;
		await dbModify("User", { id: message.author.id }, qUserDB);
		message.channel.send(`${string(found.settings.code, "USER_LOCALE_SET_SUCCESS", { name: found.settings.native, invite: `https://discord.gg/${support_invite}` }, "success")}${permission <= 2 ? `\n\n${string(found.settings.code, "LOCALE_SERVER_SETTING_PROMPT", { prefix: qServerDB.config.prefix, code: found.settings.code })}` : ""}`);
	}
};
