const { prefix, colors, emoji } = require("../../config.json");
const { dbQueryAll, dbQuery, checkConfig } = require("../../coreFunctions.js");

module.exports = {
	controls: {
		name: "listqueue",
		permission: 3,
		aliases: ["queue", "showqueue"],
		usage: "listqueue",
		description: "Shows the queue of suggestions awaiting review",
		enabled: true,
		docs: "staff/listqueue",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
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
			const savedContent = content;

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

			content[page].title = `Suggestions Pending Review (Page ${page+1}/${content.length})`;

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
					msg.edit("Queue exited.", {embed: null});
					collector.stop();
					return;
				}
				if (msg) {
					content[page].title = `Suggestions Pending Review (Page ${page+1}/${content.length})`;
					if (content[page] instanceof Discord.MessageEmbed) msg.edit({ embed: content[page] });
					else msg.edit(content[page]);
				}
			});
			collector.on("end", () => {
				msg.reactions.removeAll();
			});
		}

		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(`<:${emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

		let missing = checkConfig(qServerDB);

		if (missing.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		let listarray = [];
		let queuedSuggestions = await dbQueryAll("Suggestion", { status: "awaiting_review", id: message.guild.id });
		queuedSuggestions.forEach(suggestion => {
			listarray.push({
				"fieldTitle": `Suggestion #${suggestion.suggestionId.toString()}`,
				"fieldDescription": `[Queue Post](https://discordapp.com/channels/${suggestion.id}/${qServerDB.config.channels.staff}/${suggestion.reviewMessage})`
			});
		});
		if (!listarray[0]) return message.channel.send("There are no suggestions awaiting approval!");

		let chunks = listarray.chunk(10);
		let embeds = [];
		for await (let chunk of chunks) {
			let embed = new Discord.MessageEmbed()
				.setColor(colors.yellow);
			chunk.forEach(smallchunk => {
				embed.addField(smallchunk.fieldTitle, smallchunk.fieldDescription);
			});
			if (chunks.length > 1) embed.setFooter("Use the arrow reactions to navigate pages, and the ⏹ reaction to close the queue embed");
			embeds.push(embed);
		}

		pages(message, embeds);
	}
};
