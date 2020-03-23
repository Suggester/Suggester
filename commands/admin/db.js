const { dbQueryNoNew } = require("../../coreFunctions.js");
const { emoji, colors } = require("../../config.json");
module.exports = {
	controls: {
		name: "db",
		permission: 0,
		aliases: ["query"],
		usage: "db <collection> <query field> <query value>",
		description: "Gets a database entry",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (!args[0] || !args[1] || !args[2]) return message.channel.send(`<:${emoji.x}> You must specify a collection name, query field, and query value.`);
		let collection = args[0];
		let field = args[1];
		let value = args[2];
		let query = {};
		query[field] = value;
		let result = await dbQueryNoNew(collection, query);
		if (result === 0) return message.channel.send(`Collection \`${collection}\` is an invalid collection.`);
		let embed = new Discord.MessageEmbed()
			.setTitle("Database Query")
			.setDescription(`**Collection:** ${collection}\n**Query:** ${JSON.stringify(query)}`)
			.addField("Result", result ? `\`\`\`${result.toString().substr(0, 1020)}\`\`\`` : "No Result Found")
			.setColor(result ? colors.default : "#ff0000");
		return message.channel.send(embed);
	}
};
