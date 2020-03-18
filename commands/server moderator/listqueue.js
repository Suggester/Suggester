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
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
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
		if (!listarray[0]) {
			return message.channel.send("There are no suggestions awaiting approval!");
		} else {
			let chunks = listarray.chunk(25);
			for await (let chunk of chunks) {
				let embed = new Discord.MessageEmbed()
					.setTitle("Suggestions Pending Review")
					.setColor(colors.yellow);

				chunk.forEach(smallchunk => {
					embed.addField(smallchunk.fieldTitle, smallchunk.fieldDescription);
				});

				await message.channel.send(embed);
			}
		}
	}
};
