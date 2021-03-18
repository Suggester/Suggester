const { dbQueryNoNew, dbModify } = require("../../utils/db.js");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "db",
		permission: 0,
		aliases: ["query"],
		usage: "db [query|modify] [collection] [query field] [query value] (modify:field) (modify:value)",
		examples: "`{{p}}db query Suggestion suggestionId 1`\nGets data for a document in the `Suggestion` collection with a `suggestionId` of `1`\n\n`{{p}}db modify Suggestion suggestionId 1 suggester 327887845270487041`\nSets the `suggester` value of a document in the `Suggestion` collection with a `suggestionId` of `1` to `327887845270487041`",
		description: "Gets or modifies a database entry",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (locale, message, client, args, Discord) => {
		if (args.length < 4) return message.channel.send(string(locale, "NO_DB_PARAMS_SPECIFIED_ERROR", {}, "error"));
		let collection = args[1];
		let field = args[2];
		let value = args[3];
		let query = {};
		query[field] = value;
		let result = await dbQueryNoNew(collection, query);
		if (result === 0) return message.channel.send(string(locale, "INVALID_COLLECTION_ERROR", { collection: collection }, "error"));
		let modified = false;
		let modifyField;
		let modifyValue;
		let oldValue;
		if (args[0].toLowerCase() === "modify") {
			if (args.length < 6) return message.channel.send(string(locale, "NO_MODIFICATION_PARAMS_ERROR", {}, "error"));
			modifyField = args[4];
			oldValue = eval(`result.${modifyField}`);
			modifyValue = args.splice(5).join(" ");
			eval(`result.${modifyField} = ${modifyValue}`);
			await dbModify(collection, query, result);
			modified = true;
		}
		let embed = new Discord.MessageEmbed()
			.setTitle(string(locale, modified ? "DB_EMBED_TITLE_MODIFIED" : "DB_EMBED_TITLE_QUERY"))
			.setDescription(string(locale, "DB_EMBED_QUERY_INFO", { collection: collection, query: JSON.stringify(query) }));

		if (modified) {
			embed.addField(string(locale, "DB_EMBED_TITLE_MODIFIED"), string(locale, "DB_EMBED_MODIFY_INFO", { field: modifyField, oldValue: oldValue, newValue: modifyValue }));
		}

		embed.addField(string(locale, "RESULT_FIELD_TITLE"), result ? `\`\`\`${result.toString().substr(0, 1005)}\`\`\`` : string(locale, "DB_NO_RESULT_FOUND"))
			.setColor(result ? client.colors.default : "#ff0000");
		return message.channel.send(embed);
	}
};
