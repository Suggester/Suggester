const { string } = require("../../utils/strings");
const { slash_url } = require("../other/invite");
module.exports = {
	controls: {
		name: "asuggest",
		permission: 10,
		usage: "asuggest",
		aliases: ["anonsuggest", "anonsuggestions"],
		description: "Placeholder command for the `asuggest` slash command",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
		cooldown: 5,
		hidden: true,
		docs: "topics/anonymous-suggestions"
	},
	do: async (locale, message, client) => {
		return message.channel.send(`${string(locale, "ANON_SUGGEST_SLASH_NOTICE")}\n${slash_url.replace("[ID]", client.user.id).slice(0, -1)}&guild_id=${message.guild.id}>`);
	}
};
