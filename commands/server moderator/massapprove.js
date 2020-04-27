const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, checkConfig, checkChannel, fetchUser, suggestionEmbed, serverLog } = require("../../coreFunctions.js");
const { Suggestion } = require("../../utils/schemas");
module.exports = {
	controls: {
		name: "massapprove",
		permission: 3,
		usage: "massapprove <suggestion ids> -r (comment)",
		aliases: ["mapprove", "multiapprove"],
		description: "Approves all specified suggestions",
		enabled: true,
		docs: "staff/massapprove",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
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

		let missingSuggestionPerms = checkChannel(qServerDB.config.channels.suggestions, message.guild.channels.cache, "suggestions", client);
		if (!missingSuggestionPerms) return message.channel.send(`<:${emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestions channel.`);
		if (missingSuggestionPerms !== true) return message.channel.send(missingSuggestionPerms);

		let missingReviewPerms = checkChannel(qServerDB.config.channels.staff, message.guild.channels.cache, "staff", client);
		if (!missingReviewPerms) return message.channel.send(`<:${emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
		if (missingReviewPerms !== true) return message.channel.send(missingReviewPerms);

		if (!args[0]) return message.channel.send("You must specify at least one suggestion!");

		let reason;
		let reasonSplit = args.join(" ").split("-r");
		if (reasonSplit[1]) {
			reason = reasonSplit[1].split(" ").splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(`<:${emoji.x}> Comments cannot be longer than 1024 characters.`);
		}
		let suggestions = reasonSplit[0].split(" ");

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send(`<:${emoji.x}> One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers. If you're trying to specify a comment, add \`-r\` between the suggestion IDs and the comment.`);
		let su = suggestions.map(Number);
		let msg = await message.channel.send("Processing... this may take a moment");

		let preApprove = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let alreadyApproved = preApprove.filter((s) => s.status === "approved");

		let notApprovedId = alreadyApproved.map((s) => s.suggestionId);

		let { n, nModified } = await Suggestion.update({
			suggestionId: { $in: su },
			status: "awaiting_review"
		}, {
			$set: {
				status: "approved",
				staff_member: message.author.id
			},
		}, {
			multi: true
		});

		let postApprove = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let approved = postApprove.filter((s) => s.status === "approved" && !notApprovedId.includes(s.suggestionId));
		let approvedId = approved.map((s) => s.suggestionId);

		if (n !== 0) {
			await msg.edit(
				new Discord.MessageEmbed()
					.setDescription(`<:${emoji.check}> ${nModified !== 0 ? "Successfully approved" : "Approved"} ${nModified}/${postApprove.length} suggestions`)
					.addField("Result", `**Approved**: ${approvedId.length > 0 ? approvedId.join(", ") : "No suggestions were approved."}\n${notApprovedId.length > 0 ? "**Could Not Approve**: " + notApprovedId.join(", ") : ""}`)
					.setColor(colors.green)
					.setFooter(nModified !== su.length
						? "One or more of these suggestions could not be approved. Please make sure the suggestion IDs you have provided exist and have not already been approved."
						: "All of these suggestions have been approved."
					)
			);
		} else {
			return await msg.edit(
				new Discord.MessageEmbed()
					.setDescription(`<:${emoji.x}> None of the suggestions you provided could be approved. Please make sure the suggestion IDs you have provided exist and have not already been approved.`)
					.setColor(colors.red)
			);
		}

		for (let s in approved) {
			// eslint-disable-next-line no-prototype-builtins
			if (approved.hasOwnProperty(s)) {
				let suggester = await fetchUser(approved[s].suggester, client);

				let msg = await client.channels.cache.get(qServerDB.config.channels.suggestions)
					.send(await suggestionEmbed(approved[s], qServerDB, client));

				if (qServerDB.config.react) {
					let reactEmojiUp = qServerDB.config.emojis.up;
					let reactEmojiMid = qServerDB.config.emojis.mid;
					let reactEmojiDown = qServerDB.config.emojis.down;
					if (reactEmojiUp !== "none") await msg.react(reactEmojiUp).catch(async () => {
						await msg.react("👍");
						reactEmojiUp = "👍";
					});
					if (reactEmojiMid !== "none") await msg.react(reactEmojiMid).catch(async () => {
						await msg.react("🤷");
						reactEmojiMid = "🤷";
					});
					if (reactEmojiDown !== "none") await msg.react(reactEmojiDown).catch(async () => {
						await msg.react("👎");
						reactEmojiDown = "👎";
					});
					approved[s].emojis.up = reactEmojiUp;
					approved[s].emojis.mid = reactEmojiMid;
					approved[s].emojis.down = reactEmojiDown;
				}

				let qUserDB = await dbQuery("User", { id: suggester.id });
				let selfNotify;
				if (suggester.id === message.author.id) qUserDB.selfnotify ? selfNotify = true : selfNotify = false;
				else selfNotify = true;
				if (qServerDB.config.notify && qUserDB.notify && selfNotify) {
					let dmEmbed = new Discord.MessageEmbed()
						.setTitle(`Your Suggestion in **${message.guild.name}** Was Approved!`)
						.setFooter(`Suggestion ID: ${approved[s].suggestionId}`)
						.setDescription(approved[s].suggestion || "[No Suggestion Content]")
						.addField("Suggestions Feed Post", `[Jump to Suggestion](https://discordapp.com/channels/${message.guild.id}/${qServerDB.config.channels.suggestions}/${msg.id})`)
						.setColor(colors.green);
					if (reason) dmEmbed.addField("Comment Added", reason);

					await suggester.send(dmEmbed).catch(() => {});
				}

				if (qServerDB.config.channels.log) {
					let logEmbed = new Discord.MessageEmbed()
						.setAuthor(`${message.author.tag} approved #${approved[s].suggestionId}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
						.addField("Suggestion", approved[s].suggestion || "[No Suggestion Content]")
						.setFooter(`Suggestion ID: ${approved[s].suggestionId} | Approver ID: ${message.author.id}`)
						.setTimestamp()
						.setColor(colors.green);
					if (reason) logEmbed.addField("Comment Added by Approver", reason);
					serverLog(logEmbed, qServerDB, client);
				}

				let updateEmbed = new Discord.MessageEmbed()
					.setTitle(`Suggestion Awaiting Review (${approved[s].suggestionId})`)
					.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
					.setDescription(approved[s].suggestion)
					.setColor(colors.green)
					.addField("A change was processed on this suggestion", "This suggestion has been approved");
				client.channels.cache.get(qServerDB.config.channels.staff)
					.messages.fetch(approved[s].reviewMessage)
					.then((fetched) => fetched.edit(updateEmbed));

				let modified = approved[s];
				if (reason) {
					modified.comments = [{
						comment: reason,
						author: message.author.id,
						id: 1,
						created: new Date()
					}];
				}
				approved[s] = modified;
				modified.messageId = msg.id;
				await approved[s].save();
			}
		}
	}
};
