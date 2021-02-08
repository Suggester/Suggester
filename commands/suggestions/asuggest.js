const { suggestionEditCommandCheck, checkURL } = require("../../utils/checks");
const { editFeedMessage } = require("../../utils/actions");
const { serverLog, mediaLog } = require("../../utils/logs");
const { dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { logEmbed } = require("../../utils/misc");
const { cleanCommand } = require("../../utils/actions");
const { slash_url } = require("../other/invite");
module.exports = {
	controls: {
		name: "asuggest",
		permission: 10,
		usage: "asuggest",
		aliases: ["anonsuggest", "anonsuggestions"],
		description: "Placeholder command for the asuggest slash command",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
		cooldown: 5,
		hidden: true
	},
	do: async (locale, message, client) => {
		return message.channel.send(`${string(locale, "ANON_SUGGEST_SLASH_NOTICE")}\n${slash_url.replace("[ID]", client.user.id).slice(0, -1)}&guild_id=${message.guild.id}>`);
	}
};
