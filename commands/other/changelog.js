const { colors } = require("../../config.json");
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
		docs: "all/changelog",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
		cooldown: 25
	},
	do: async (message, client, args, Discord) => {
		get("https://api.github.com/repos/Suggester-Bot/Suggester/releases/latest").then(({ data }) => {
			let split_body = Discord.Util.splitMessage(data.body, {
				char: " "
			});

			let embeds = [];
			for (const chunk of split_body) {
				embeds.push(new Discord.MessageEmbed()
					.setTitle(string("CHANGELOG_EMBED_HEADER", { version: data.name }))
					.setDescription(chunk)
					.setURL(data.html_url)
					.setColor(colors.default)
					.setTimestamp(data.created_at)
					.setFooter(`${string("CHANGELOG_RELEASED_FOOTER")}\n${string("PAGINATION_NAVIGATION_INSTRUCTIONS")}`)
				);
			}

			pages(message, embeds);
		}).catch((e) => {
			console.log(e)
			return message.channel.send(string("ERROR", {}, "error"));
		});
	}
};
