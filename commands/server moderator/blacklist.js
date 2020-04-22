const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, dbModify, serverLog, checkConfig, checkPermissions, fetchUser } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "blacklist",
		permission: 3,
		usage: "blacklist <user>",
		aliases: ["disallow", "bl"],
		description: "Blacklists a user from using the bot in the server",
		enabled: true,
		docs: "staff/blacklist",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
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
				await message.channel.send("These users are blacklisted from using Suggester on this server:", content instanceof Discord.MessageEmbed ? { embed: content[0] } : content[0]);
				return;
			}
			const filter = (reaction, user) => (Object.values(emojis).includes(reaction.emoji.name) || Object.values(emojis).includes(reaction.emoji.id)) && !user.bot && user.id === message.author.id;

			let page = options.startPage;
			content[page].title = `Page ${page+1}/${content.length}`;
			const msg = await message.channel.send("These users are blacklisted from using Suggester on this server:", content[page] instanceof Discord.MessageEmbed ? { embed: content[page] } : content[page]);

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
					msg.edit("Blacklist list exited.", {embed: null});
					collector.stop();
					return;
				}
				if (msg) {
					content[page].title = `Page ${page+1}/${content.length}`;
					if (content[page] instanceof Discord.MessageEmbed) msg.edit("These users are blacklisted from using Suggester on this server:", { embed: content[page] });
					else msg.edit("These users are blacklisted from using Suggester on this server:", content[page]);
				}
			});
			collector.on("end", () => {
				msg.reactions.removeAll();
			});
		}

		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		let missing = checkConfig(qServerDB);

		if (missing.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		if (!args[0]) return message.channel.send(`<:${emoji.x}> You must specify a user or \`list\` to show a list of blacklisted users!`);

		if (args[0].toLowerCase() === "list") {
			if (qServerDB.config.blacklist.length < 1) return message.channel.send("There are no users blacklisted from using the bot on this server!");
			let chunks = qServerDB.config.blacklist.chunk(20);
			let embeds = [];
			for await (let chunk of chunks) {
				let list = [];
				for await (let blacklisted of chunk) {
					let u = await fetchUser(blacklisted, client);
					u ? list.push(`${u.tag} (\`${u.id}\`)`) : list.push(`Unknown User (\`${blacklisted}\`)`);
				}

				embeds.push(new Discord.MessageEmbed()
					.setDescription(list.join("\n"))
					.setColor(colors.default)
					.setFooter(chunks.length > 1 ? "Use the arrow reactions to navigate pages, and the ⏹ reaction to close the blacklist list embed" : ""));
			}
			pages(message, embeds);
			return;
		}

		let user = await fetchUser(args[0], client);
		if (!user) return message.channel.send("You must specify a valid user!");
		let qUserDB = await dbQuery("User", {id: user.id});

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(`<:${emoji.x}> Blacklist reasons must be 1024 characters or less in length.`);
		}

		await message.guild.members.fetch(user.id).catch(() => {});

		if (user.bot) return message.channel.send(`<:${emoji.x}> This user is a bot, and therefore cannot be blacklisted.`);
		if (qUserDB.flags.includes("STAFF")) return message.channel.send(`<:${emoji.x}> This user would not be affected by a blacklist because they are a global Suggester staff member.`);
		if (message.guild.members.cache.get(user.id)) {
			let memberPermission = await checkPermissions(message.guild.members.cache.get(user.id), client);
			if (memberPermission <= 2) return message.channel.send(`<:${emoji.x}> This user would not be affected by a blacklist because they are a staff member.`);
		}

		if (qServerDB.config.blacklist.includes(user.id)) return message.channel.send(`<:${emoji.x}> This user is already blacklisted from using the bot on this server!`);
		qServerDB.config.blacklist.push(user.id);
		await dbModify("Server", {id: message.guild.id}, qServerDB);
		let embed = new Discord.MessageEmbed();
		if (reason) {
			embed.setDescription(`**Reason:** ${reason}`)
				.setColor(colors.default);
		}
		message.channel.send(`<:${emoji.check}> **${Discord.Util.removeMentions(user.tag)}** (\`${user.id}\`) has been blacklisted from using the bot on this server.`, reason ? embed : "");

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(`${message.author.tag} blacklisted ${user.tag}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(`Tag: ${user.tag}\nID: ${user.id}\nMention: <@${user.id}>`)
				.setFooter(`Staff Member ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.red);

			reason ? logEmbed.addField("Reason", reason)  : "";
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
