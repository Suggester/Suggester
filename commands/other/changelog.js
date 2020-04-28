const { colors } = require("../../config.json");
const request = require("request");
const { string } = require("../../utils/strings");
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
		/**
		 * Paginate a message
		 * @param {Message} message Discord.js Messsage object
		 * @param {string[] | MessageEmbed[]} content The text to paginate
		 * @param {PageOptions} [options] Options for pagination
		 * @param {object} [options.emojis] Emojis to use for controls
		 * @param {string} [options.emojis.left='⬅'] The emoji used for going to the previous page
		 * @param {string} [options.emojis.end='⏹'] The emoji used for deleting the message
		 * @param {string} [options.emojis.right='➡'] The emoji used for going to the next page
		 * @param {number} [options.time=300000] How long to 'watch' for reactions
		 * @param {number} [options.startPage=0] Which page to start on (counting starts at 0)
		 * @param {boolean} [options.removeReaction=true] Remove user's reaction (note: the bot must have `MANAGE_MESSAGES`)
		 * @param {boolean} [options.hideControlsSinglePage=true] Hide the controls if there is only one page
		 * @param {boolean} [options.timeoutRemoveReactions=true] Remove the reactions after the time expires
		 * @returns {Promise<void>}
		 * @example
		 * const content: string[] = ['First page', 'Second page', 'Third page']
		 *
		 * const options: PageOptions = {
		 *   time: 150000,
		 *   startPage: 2
		 * }
		 *
		 * pages(message, content, options)
		 */
		async function pages(message, content, options = {
			time: 300000,
			startPage: 0,
			hideControlsSinglePage: true,
			timeoutRemoveReactions: true,
			removeReaction: true
		}) {
			if (!(content instanceof Array)) throw new TypeError("Content is not an array");
			if (!content.length) throw new Error("Content array is empty");
			let removeReaction = options.removeReaction;

			if (!message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) removeReaction = false;

			const emojis = {
				left: "⬅️",
				end: "⏹️",
				right: "➡️"
			};
			const time = options.time;
			const hideControlsSinglePage = options.hideControlsSinglePage;

			if (hideControlsSinglePage && content.length === 1) {
				await message.channel.send(content instanceof Discord.MessageEmbed ? { embed: content[0] } : content[0]);
				return;
			}
			const filter = (reaction, user) => (Object.values(emojis).includes(reaction.emoji.name) || Object.values(emojis).includes(reaction.emoji.id)) && !user.bot && user.id === message.author.id;

			let page = options.startPage;
			content[page].setFooter(`${string("PAGINATION_NAV_INSTRUCTIONS")}\n${string("PAGINATION_PAGE_COUNT", { current: page+1, total: content.length })}\n${string("CHANGELOG_RELEASED_FOOTER")}`);

			const msg = await message.channel.send(content[page] instanceof Discord.MessageEmbed ? { embed: content[page] } : content[page]);

			for (const emoji in emojis) await msg.react(emojis[emoji]);

			const collector = msg.createReactionCollector(filter, { time: time });
			collector.on("collect", ({ users, emoji: { id, name } }, user) => {
				if (emojis.left && (id === emojis.left || name === emojis.left)) {
					page = page > 0 ? page - 1 : content.length - 1;
					if (removeReaction) users.remove(user.id);
				}
				else if (emojis.right && (id === emojis.right || name === emojis.right)) {
					page = page + 1 < content.length ? page + 1 : 0;
					if (removeReaction) users.remove(user.id);
				}
				else if (emojis.end && (id === emojis.end || name === emojis.end)) {
					msg.edit("Changelog exited.", {embed: null});
					collector.stop();
					return;
				}
				if (msg) {
					content[page].setFooter(`${string("PAGINATION_NAV_INSTRUCTIONS")}\n${string("PAGINATION_PAGE_COUNT", { current: page+1, total: content.length })}\n${string("CHANGELOG_RELEASED_FOOTER")}`);
					if (content[page] instanceof Discord.MessageEmbed) msg.edit({ embed: content[page] });
					else msg.edit(content[page]);
				}
			});
			collector.on("end", () => {
				msg.reactions.removeAll();
			});
		}

		request({
			url: "https://api.github.com/repos/Suggester-Bot/Suggester/releases/latest",
			method: "GET",
			headers: {
				"User-Agent": "Suggester-Bot"
			}
		}, (err, res) => {
			if (err) return message.channel.send(string("ERROR", {}, "error"));
			let release = JSON.parse(res.body);
			let split_body = Discord.Util.splitMessage(release.body, {
				char: " "
			});

			let embeds = [];
			for (const chunk of split_body) {
				embeds.push(new Discord.MessageEmbed()
					.setTitle(string("CHANGELOG_EMBED_HEADER", { version: release.name }))
					.setDescription(chunk)
					.setURL(release.html_url)
					.setColor(colors.default)
					.setTimestamp(release.created_at)
					.setFooter(string("CHANGELOG_RELEASED_FOOTER"))
				);
			}

			pages(message, embeds);
		});
	}
};
