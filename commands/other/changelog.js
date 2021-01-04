const { get } = require("axios");
const { string } = require("../../utils/strings");
const { pages } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "changelog",
		permission: 10,
		aliases: ["changes"],
		usage: "changelog",
		description: "Shows the latest Suggester release",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS"],
		cooldown: 25,
		dmAvailable: true,
		docs: "sumup"
	},
	do: async (locale, message, client, args, Discord) => {
		get("https://api.github.com/repos/Suggester/Suggester/releases/latest").then(({ data }) => {
			let split_body = Discord.Util.splitMessage(data.body, {
				char: " "
			});

			let embeds = [];
			for (const chunk of split_body) {
				embeds.push(new Discord.MessageEmbed()
					.setTitle(string(locale, "CHANGELOG_EMBED_HEADER", { version: data.name }))
					.setDescription(chunk)
					.setURL(data.html_url)
					.setColor(client.colors.default)
					.setTimestamp(data.created_at)
					.setAuthor(split_body.length > 1 ? string(locale, "PAGINATION_PAGE_COUNT") : "")
					.setFooter(`${split_body.length > 1 ? `${string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS")}\n` : ""}${string(locale, "CHANGELOG_RELEASED_FOOTER")}`)
				);
			}

			pages(locale, message, embeds);
		}).catch((e) => {
			console.log(e);
			return message.channel.send(string(locale, "ERROR", {}, "error"));
		});
	}
};
