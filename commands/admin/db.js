const { dbQueryNoNew, dbModify } = require("../../coreFunctions.js");
const { emoji, colors } = require("../../config.json");
module.exports = {
	controls: {
		name: "db",
		permission: 0,
		aliases: ["query"],
		usage: "db <query|modify> <collection> <query field> <query value> (modify:field) (modify:value)",
		description: "Gets a database entry",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (args.length < 4) return message.channel.send(`<:${emoji.x}> You must specify whether to query or modify, a collection name, query field, and query value.`);
		let collection = args[1];
		let field = args[2];
		let value = args[3];
		let query = {};
		query[field] = value;
		let result = await dbQueryNoNew(collection, query);
		if (result === 0) return message.channel.send(`Collection \`${collection}\` is an invalid collection.`);
		let modified = false;
		let modifyField;
		let modifyValue;
		let oldValue;
		if (args[0].toLowerCase() === "modify") {
			if (args.length < 6) return message.channel.send(`<:${emoji.x}> You must specify modification parameters!`);
			modifyField = args[4];
			oldValue = eval(`result.${modifyField}`);
			modifyValue = args[5];
			eval(`result.${modifyField} = ${modifyValue}`);
			await dbModify(collection, query, result);
			modified = true;
		}
		let embed = new Discord.MessageEmbed()
			.setTitle(`Database ${modified ? "Modified": "Query"}`)
			.setDescription(`**Collection:** ${collection}\n**Query:** ${JSON.stringify(query)}`);

		if (modified) {
			embed.addField("Modified", `**Field:** ${modifyField}\n**Old Value:** ${oldValue}\n**New Value:** ${modifyValue}`);
		}

		embed.addField("Result", result ? `\`\`\`${result.toString().substr(0, 1020)}\`\`\`` : "No Result Found")
			.setColor(result ? colors.default : "#ff0000");
		return message.channel.send(embed);
	}
};
