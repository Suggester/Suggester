const { dbQuery, dbModify } = require("../../utils/db");
const { colors, support_invite } = require("../../config.json");
const { string } = require("../../utils/strings");
const { checkPermissions } = require("../../utils/checks");
const exec = (require("util").promisify((require("child_process").exec)));
module.exports = {
	controls: {
		name: "locale",
		permission: 10,
		aliases: ["language", "translate", "translation", "locales"],
		usage: "locale <locale to set>",
		description: "Sets your personal locale",
		enabled: true,
		docs: "all/locale",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (locale, message, client, args, Discord) => {
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) {
			let embed = new Discord.MessageEmbed()
				.setTitle(string(locale, "LOCALE_LIST_TITLE"))
				.setDescription(client.locales.map(l => ` - [${l.settings.code}] **${l.settings.native}** (${l.settings.english}) ${qUserDB.locale && qUserDB.locale === l.settings.code ? `_${string(locale, "SELECTED")}_` : ""}`).join("\n"))
				.setColor(colors.default);
			return message.channel.send(embed);
		}
		if ((await checkPermissions(message.member, client)) <= 1 && args[0].toLowerCase() === "pull") {
			const fs = require("fs");

			return fs.access("i18n", async function(error) {
				if (error) {
					//Dir does not exist
					let clone = await exec("git clone https://github.com/Suggester-Bot/i18n.git");
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
		if (!found) return message.channel.send(string(locale, "NO_LOCALE_ERROR", {}, "error"));
		qUserDB.locale = found.settings.code;
		await dbModify("User", { id: message.author.id }, qUserDB);
		message.channel.send(string(locale, "USER_LOCALE_SET_SUCCESS", { name: found.settings.native, invite: `https://discord.gg/${support_invite}` }, "success"));
	}
};
