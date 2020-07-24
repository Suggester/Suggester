const { string } = require("../../utils/strings");
const { suggestionEmbed, fetchUser } = require("../../utils/misc");
const { checkSuggestions, checkDenied, baseConfig, channelPermissions, checkPermissions } = require("../../utils/checks");
const { checkVotes, deleteFeedMessage, confirmation } = require("../../utils/actions");
const { dbQueryAll } = require("../../utils/db");
const { Suggestion } = require("../../utils/schemas");
const humanizeDuration = require("humanize-duration");
const { support_invite, emoji } = require("../../config.json");

function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
	controls: {
		name: "import",
		permission: 2,
		usage: "import",
		description: "Imports suggestions from a channel",
		enabled: true,
		docs: "admin/import",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
		cooldown: 60
	},
	do: async (locale, message, client, args, Discord) => {
		function ziraReason (e) {
			let reasonZField = e.fields.find(f => f.name.endsWith("Reason"));
			if (!reasonZField) return ["0", null];
			let titleMatch = reasonZField.name.match(/([\s\S]+)'s Reason/);
			if (!titleMatch) return ["0", null];
			let staffMember = message.guild.members.cache.find(m => m.user.username === titleMatch[1]) ? message.guild.members.cache.find(m => m.user.username === titleMatch[1]).id : "0";
			return [staffMember, reasonZField.value];
		}
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);

		let checkSuggest = checkSuggestions(locale, message.guild, qServerDB);
		if (checkSuggest) return message.channel.send(checkSuggest);

		let deniedCheck = checkDenied(locale, message.guild, qServerDB);
		if (deniedCheck) return message.channel.send(deniedCheck);

		if (qServerDB.config.channels.archive) {
			if (message.guild.channels.cache.get(qServerDB.config.channels.archive)) {
				let perms = channelPermissions(locale, "denied", message.guild.channels.cache.get(qServerDB.config.channels.archive), client);
				if (perms) return message.channel.send(perms);
			} else return message.channel.send(string(locale, "NO_ARCHIVE_CHANNEL_ERROR", {}, "error"));
		}

		let bots = [
			"235148962103951360",
			"275813801792634880",
			"281041859692855296",
			"292953664492929025",
			"356950275044671499",
			"393848142585397248",
			"424137718961012737",
			"448156485470388224",
			"474051954998509571",
			"538816846712012800",
			"566616056165302282",
			"567033485882163200",
			"597776518441336862",
			"668116464351576085",
			"699677631372853248"
		];
		let botArr = [];
		for await (let b of bots) {
			botArr.push(`- <@${b}> (${(await fetchUser(b, client)).tag})`);
		}
		let permission = await checkPermissions(message.member, client);
		let cEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "IMPORT_TITLE"))
			.setDescription(string(locale, "IMPORT_DESC", { support_invite: `https://discord.gg/${support_invite}`, check: `<:${emoji.check}>`, x: `<:${emoji.x}>`, bots: botArr.join("\n") }))
			.setColor(client.colors.default);
		let num = 30;
		if ((permission <= 1 || qServerDB.flags.includes("NO_IMPORT_LIMIT")) && args[0]) {
			num = parseInt(args[0]);
			if (!num || num < 1 || num > 100) return message.channel.send(string(locale, "IMPORT_TOO_MANY_ERROR", {}, "error"));
			cEmbed.addField(string(locale, "IMPORT_OVERRIDE_TITLE"), string(locale, "IMPORT_OVERRIDE_DESC", { num }));
		}
		if (!(
			await confirmation(
				message,
				cEmbed,
				{
					deleteAfterReaction: true
				}
			)
		)) return;

		await message.guild.members.fetch();

		let startTime = Date.now();
		message.channel.messages.fetch({ limit: num, before: message.id }).then(async messages => {
			const importedIds = (await dbQueryAll("Suggestion", { id: message.guild.id, imported: { $ne: null } })).map(s => s.imported);
			let sent = await message.channel.send(string(locale, "IMPORT_START", { time: humanizeDuration(4000*messages.size) }));
			let successCount = 0;
			let errorCount = 0;
			for await (let m of messages.array().reverse()) {
				if (importedIds.includes(m.id) || message.content.length > 1024) {
					errorCount++;
					continue;
				}
				let suggestionInfo = {
					id: message.guild.id,
					suggester: null,
					suggestion: null,
					status: null,
					submitted: m.createdAt,
					suggestionId: await Suggestion.countDocuments() + 1,
					displayStatus: null,
					reviewMessage: null,
					staff_member: client.user.id,
					denial_reason: null,
					messageId: null,
					comments: [],
					implemented: false,
					imported: m.id
				};
				let embed = m.embeds.length > 0 ? m.embeds[0] : null;
				switch (m.author.id) {
				case "393848142585397248": //Havoc
					if (!embed) {
						errorCount++;
						continue;
					}
					// eslint-disable-next-line no-case-declarations
					let suggesterMatch = embed.author.name.match(/\((\d+)\)💡$/);
					if (!suggesterMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = suggesterMatch[1];
					// eslint-disable-next-line no-case-declarations
					let suggestionField = embed.fields.find(f => f.name === "Suggestion:");
					// eslint-disable-next-line no-case-declarations
					let statusField = embed.fields.find(f => f.name === "Status:");
					if (!suggestionField || !statusField) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggestion = suggestionField.value;
					if (statusField.value.startsWith("Approved")) {
						let statusMatch = statusField.value.match(/Approved by (?:([\s\S]+#[\d]{4}) - ([\S\s]+)|([\s\S]+#[\d]{4}))/);
						if (!statusMatch) {
							errorCount++;
							continue;
						}
						suggestionInfo.staff_member = client.users.cache.find(u => u.tag === (statusMatch[1] || statusMatch[3])).id || "0";
						if (statusMatch[2]) {
							suggestionInfo.comments.push({
								comment: statusMatch[2],
								author: suggestionInfo.staff_member,
								id: 1,
								created: new Date(),
								deleted: false
							});
						}
						suggestionInfo.status = "approved";
					} else if (statusField.value.startsWith("Denied")) {
						let statusMatch = statusField.value.match(/Denied by (?:([\s\S]+#[\d]{4}) - ([\S\s]+)|([\s\S]+#[\d]{4}))/);
						if (!statusMatch) {
							errorCount++;
							continue;
						}
						suggestionInfo.staff_member = client.users.cache.find(u => u.tag === (statusMatch[1] || statusMatch[3])).id || "0";
						suggestionInfo.denial_reason = statusMatch[2];
						suggestionInfo.status = "denied";
					} else {
						suggestionInfo.status = "approved";
					}
					break;
				case "448156485470388224": //Anchor
					suggestionInfo.status = "approved";
					if (!embed) {
						errorCount++;
						continue;
					}
					// eslint-disable-next-line no-case-declarations
					let anchorMatch = (embed.author.iconURL ? embed.author.iconURL.match(/https:\/\/cdn\.discordapp\.com\/avatars\/([\d]+)\/[\S\s]+/) : null) || embed.author.name.match(/()([\S\s]+) \| Suggestion/);
					if (!anchorMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = anchorMatch[1] ? anchorMatch[1] : (message.guild.members.cache.find(m => m.user.username === anchorMatch[2]) ? message.guild.members.cache.find(m => m.user.username === anchorMatch[2]).id : "0");
					suggestionInfo.suggestion = embed.description.match(/\*\*([\S\s]+)\*\*/)[1];
					break;
				case "597776518441336862": //AXVin
					if (!embed) {
						errorCount++;
						continue;
					}
					// eslint-disable-next-line no-case-declarations
					let axvMatch = embed.author ? ((embed.author.iconURL ? embed.author.iconURL.match(/https:\/\/cdn\.discordapp\.com\/avatars\/([\d]+)\/[\S\s]+/) : null) || [null, null, embed.author.name]) : [null, "0"];
					if (!axvMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = axvMatch[1] ? axvMatch[1] : (client.users.cache.find(u => u.tag === axvMatch[2]) ? client.users.cache.find(u => u.tag === axvMatch[2]).id : "0");
					suggestionInfo.suggestion = embed.description;
					suggestionInfo.status = "approved";
					if (embed.fields[0]) {
						let axvStatusMatch = embed.fields[0].name.match(/(\w+) by ([\s\S]+)/);
						if (!axvStatusMatch) {
							errorCount++;
							continue;
						}
						switch (axvStatusMatch[1]) {
						case "Implemented":
							suggestionInfo.displayStatus = "implemented";
							break;
						case "Considered":
							suggestionInfo.displayStatus = "consideration";
							break;
						case "Denied":
							suggestionInfo.status = "denied";
							break;
						}
						suggestionInfo.staff_member = client.users.cache.find(u => u.tag === axvStatusMatch[2]).id || "0";
						if (embed.fields[0].value !== "​") {
							if (suggestionInfo.status === "denied") suggestionInfo.denial_reason = embed.fields[0].value;
							else {
								suggestionInfo.comments.push({
									comment: embed.fields[0].value,
									author: suggestionInfo.staff_member,
									id: 1,
									created: new Date(),
									deleted: false
								});
							}
						}
					}
					break;
				case "235148962103951360": //Carl-bot
					if (!embed) {
						errorCount++;
						continue;
					}
					// eslint-disable-next-line no-case-declarations
					let carlMatch = embed.author ? ((embed.author.iconURL ? embed.author.iconURL.match(/https:\/\/cdn\.discordapp\.com\/avatars\/([\d]+)\/[\S\s]+/) : null) || [null, null, embed.author.name]) : [null, "0"];
					if (!carlMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = carlMatch[1] ? carlMatch[1] : (client.users.cache.find(u => u.tag === carlMatch[2]) ? client.users.cache.find(u => u.tag === carlMatch[2]).id : "0");
					suggestionInfo.suggestion = embed.description;
					suggestionInfo.status = "approved";
					if (embed.fields[0]) {
						let carlStatusMatch = embed.title.match(/([\w]+[^0-9])$/);
						if (!carlStatusMatch) {
							errorCount++;
							continue;
						}
						switch (carlStatusMatch[1]) {
						case "Implemented":
							suggestionInfo.displayStatus = "implemented";
							break;
						case "Considered":
							suggestionInfo.displayStatus = "consideration";
							break;
						case "Denied":
							suggestionInfo.status = "denied";
							break;
						}
						if (embed.fields[0]) {
							let carlUser = embed.fields[0].name.match(/Reason from ([\s\S]+)/);
							suggestionInfo.staff_member = carlUser ? (client.users.cache.find(u => u.tag === carlUser[1]).id || "0") : "0";
							if (embed.fields[0].value !== "No reason given") {
								if (suggestionInfo.status === "denied") suggestionInfo.denial_reason = embed.fields[0].value;
								else {
									suggestionInfo.comments.push({
										comment: embed.fields[0].value,
										author: suggestionInfo.staff_member,
										id: 1,
										created: new Date(),
										deleted: false
									});
								}
							}
						}
					}
					break;
				case "699677631372853248": //Fast Bot
					if (!embed) {
						errorCount++;
						continue;
					}
					// eslint-disable-next-line no-case-declarations
					let fastMatch = embed.author ? ((embed.author.iconURL ? embed.author.iconURL.match(/https:\/\/cdn\.discordapp\.com\/avatars\/([\d]+)\/[\S\s]+/) : null) || embed.author.name.match(/\(ID: (\d+)\)$/) || [null, "0"]) : [null, "0"];
					if (!fastMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = fastMatch[1];
					suggestionInfo.suggestion = embed.description.match(/\*\*Suggestion:\*\* \n > ([\s\S]+)/)[1];
					suggestionInfo.status = "approved";
					// eslint-disable-next-line no-case-declarations
					let replyField = embed.fields.find(f => f.name === "Reply:");
					if (replyField && replyField.value !== "> No reply yet.") suggestionInfo.comments.push({
						comment: embed.fields[0].value.match(/> ([\s\S]+)/)[1],
						author: "0",
						id: 1,
						created: new Date(),
						deleted: false
					});
					break;
				case "538816846712012800": //Juzo
					if (!embed) {
						errorCount++;
						continue;
					}
					// eslint-disable-next-line no-case-declarations
					let juzoMatch = embed.author ? ((embed.author.iconURL ? embed.author.iconURL.match(/https:\/\/cdn\.discordapp\.com\/avatars\/([\d]+)\/[\S\s]+/) : null) || [null, null, embed.author.name.match(/Suggestion by ([\s\S]+)$/)[1] || null] || [null, "0"]) : [null, "0"];
					if (!juzoMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = juzoMatch[1] ? juzoMatch[1] : (client.users.cache.find(u => u.tag === juzoMatch[2]) ? client.users.cache.find(u => u.tag === juzoMatch[2]).id : "0");
					// eslint-disable-next-line no-case-declarations
					let descMatch = embed.description.match(/Description: ([\s\S]+)\n\n Status: ([\w]+)/);
					if (!descMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggestion = descMatch[1];
					// eslint-disable-next-line no-case-declarations
					let juzoNote = embed.fields.find(f => f.name === "Note") ? embed.fields.find(f => f.name === "Note").value : null;
					if (descMatch[2] === "Closed" && embed.color === 15158332) {
						suggestionInfo.status = "denied";
						suggestionInfo.denial_reason = juzoNote;
					} else {
						suggestionInfo.status = "approved";
						suggestionInfo.comments.push({
							comment: juzoNote,
							author: "0",
							id: 1,
							created: new Date(),
							deleted: false
						});
					}
					break;
				case "424137718961012737": //Kashima
					if (!embed) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggestion = embed.description;
					// eslint-disable-next-line no-case-declarations
					let kstatusField = embed.fields.find(f => f.name === "Status") ? embed.fields.find(f => f.name === "Status").value : null;
					if (!kstatusField) {
						errorCount++;
						continue;
					}
					suggestionInfo.status = "approved";
					// eslint-disable-next-line no-case-declarations
					let userTag = embed.fields.find(f => f.name === "Handled by") ? embed.fields.find(f => f.name === "Handled by").value : null;
					suggestionInfo.staff_member = (client.users.cache.find(u => u.tag === userTag) ? client.users.cache.find(u => u.tag === userTag).id : null) || "0";
					suggestionInfo.suggester = embed.fields.find(f => f.name === "Suggestion Info") ? (embed.fields.find(f => f.name === "Suggestion Info").value.match(/\*\*- Author\*\*: (\d+)/)[1] || "0") : "0";
					switch (kstatusField) {
					case "Approved":
						// eslint-disable-next-line no-case-declarations
						let kReasonField = embed.fields.find(f => f.name === "Reason") && embed.fields.find(f => f.name === "Reason").value !== "Not Specified" ? embed.fields.find(f => f.name === "Reason").value : null;
						if (kReasonField) suggestionInfo.comments.push({
							comment: kReasonField,
							author: suggestionInfo.staff_member,
							id: 1,
							created: new Date(),
							deleted: false
						});
						break;
					case "Rejected":
						suggestionInfo.status = "denied";
						suggestionInfo.denial_reason = embed.fields.find(f => f.name === "Reason") && embed.fields.find(f => f.name === "Reason").value !== "Not Specified" ? embed.fields.find(f => f.name === "Reason").value : null;
						break;
					case "In Consideration":
						suggestionInfo.displayStatus = "consideration";
						// eslint-disable-next-line no-case-declarations
						let kNoteField = embed.fields.find(f => f.name === "Note") && embed.fields.find(f => f.name === "Note").value !== "Not Specified" ? embed.fields.find(f => f.name === "Note").value : null;
						if (kNoteField) suggestionInfo.comments.push({
							comment: kNoteField,
							author: "0",
							id: 1,
							created: new Date(),
							deleted: false
						});
						break;
					}
					break;
				case "567033485882163200": //Suggestion#2670
					if (!embed) {
						errorCount++;
						continue;
					}
					if (embed.author.name.endsWith("Denied")) {
						suggestionInfo.suggestion = embed.fields.find(f => f.name === "Description:").value;
						suggestionInfo.suggester = embed.fields.find(f => f.name === "User who suggested:").value.match(/<@!?(\d+)>/)[1];
						suggestionInfo.status = "denied";
						suggestionInfo.denial_reason = embed.fields.find(f => f.name === "Reason:") ? embed.fields.find(f => f.name === "Reason:").value : null;
						suggestionInfo.staff_member = embed.fields.find(f => f.name === "Denied by:") ? (message.guild.members.cache.find(m => m.user.username === embed.fields.find(f => f.name === "Denied by:").value) ? message.guild.members.cache.find(m => m.user.username === embed.fields.find(f => f.name === "Denied by:").value).id : null) : "0";
					} else if (embed.author.name.endsWith("Accepted")) {
						suggestionInfo.suggestion = embed.fields.find(f => f.name.includes("Description")).value;
						suggestionInfo.suggester = embed.fields.find(f => f.name.includes("User who suggested")).value.match(/<@!?(\d+)>/)[1];
						suggestionInfo.status = "approved";
						let acceptedField = embed.fields.find(f => f.name.includes("Accepted by")).value;
						suggestionInfo.staff_member = acceptedField ? (message.guild.members.cache.find(m => m.user.username === acceptedField) ? message.guild.members.cache.find(m => m.user.username === acceptedField).id : null) : "0";
						if (embed.fields.find(f => f.name === "Reason:")) suggestionInfo.comments.push({
							comment: embed.fields.find(f => f.name === "Reason:").value,
							author: suggestionInfo.staff_member,
							id: 1,
							created: new Date(),
							deleted: false
						});
					} else {
						suggestionInfo.suggestion = embed.fields.find(f => f.name.includes("Suggestion")).value;
						suggestionInfo.suggester = embed.fields.find(f => f.name === "User:").value.match(/<@!?(\d+)>/)[1];
						suggestionInfo.status = "approved";
					}
					break;
				case "281041859692855296": //Suggestions#3153
					if (!embed) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggestion = `**${embed.fields.find(f => f.name === "Title").value}**\n${embed.fields.find(f => f.name === "Description").value}`;
					if (suggestionInfo.suggestion.length > 1024) {
						errorCount++;
						continue;
					}
					suggestionInfo.status = "approved";
					// eslint-disable-next-line no-case-declarations
					let suggestingUser = embed.footer ? ((embed.footer.iconURL ? embed.footer.iconURL.match(/https:\/\/cdn\.discordapp\.com\/avatars\/([\d]+)\/[\S\s]+/) : null) || [null, null, embed.footer.text.match(/^Posted by ([\s\S]+)$/)[1]] || [null, "0"]) : [null, "0"];
					if (!suggestingUser) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = suggestingUser[1] ? suggestingUser[1] : (client.users.cache.find(u => u.tag === suggestingUser[2]) ? client.users.cache.find(u => u.tag === suggestingUser[2]).id : "0");
					break;
				case "474051954998509571": //Suggestions#2602
					if (!embed) {
						errorCount++;
						continue;
					}
					suggestionInfo.status = "approved";
					// eslint-disable-next-line no-case-declarations
					let suggestionMatch = embed.description.match(/\*\*Suggestion\*\*\n([\s\S]+)/);
					// eslint-disable-next-line no-case-declarations
					let userFooterMatch = embed.footer.text.match(/User ID: (\d+)/);
					if (!suggestionMatch || !userFooterMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggestion = suggestionMatch[1];
					suggestionInfo.suggester = userFooterMatch[1];
					if (embed.fields.find(f => f.name === "Staff Note")) {
						let commenterMatch = embed.fields.find(f => f.name === "Staff Member") ? embed.fields.find(f => f.name === "Staff Member").value.match(/<@!?(\d+)>/) : null;
						suggestionInfo.comments.push({
							comment: embed.fields.find(f => f.name === "Staff Note").value,
							author: commenterMatch ? commenterMatch[1] : "0",
							id: 1,
							created: new Date(),
							deleted: false
						});
					}
					break;
				case "566616056165302282": //Suggestions#6994
					if (!embed) {
						errorCount++;
						continue;
					}
					// eslint-disable-next-line no-case-declarations
					let suggestionDescMatch = embed.description.match(/\*\*Description:\*\* ([\s\S]+)\n\n\*\*Status:\*\* (\w+)/);
					if (!suggestionDescMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggestion = suggestionDescMatch[1];
					suggestionInfo.status = suggestionDescMatch[2] === "Rejected" ? "denied" : "approved";
					// eslint-disable-next-line no-case-declarations
					let userAuthorMatch = embed.author ? ((embed.author.iconURL ? embed.author.iconURL.match(/https:\/\/cdn\.discordapp\.com\/avatars\/([\d]+)\/[\S\s]+/) : null) || [null, null, embed.author.name]) : [null, "0"];
					if (!userAuthorMatch) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = userAuthorMatch[1] ? userAuthorMatch[1] : (client.users.cache.find(u => u.tag === userAuthorMatch[2]) ? client.users.cache.find(u => u.tag === userAuthorMatch[2]).id : "0");
					break;
				case "668116464351576085": //Ticks
					if (!embed) {
						errorCount++;
						continue;
					}
					suggestionInfo.status = "approved";
					suggestionInfo.suggestion = embed.description.match(/> ([\s\S]+)/)[1];
					// eslint-disable-next-line no-case-declarations
					let tickReplyField = embed.fields.find(f => f.name === "Reply:");
					if (tickReplyField && tickReplyField.value !== "No reply yet.") {
						let commentInfo = tickReplyField.value.match(/\[<@!?(\d+)>\]: ([\s\S]+)/);
						if (commentInfo) suggestionInfo.comments.push({
							comment: commentInfo[2],
							author: commentInfo[1],
							id: 1,
							created: new Date(),
							deleted: false
						});
					}
					// eslint-disable-next-line no-case-declarations
					let tickUser = (embed.author && embed.author.iconURL ? (embed.author.iconURL.match(/https:\/\/cdn\.discordapp\.com\/avatars\/([\d]+)\/[\S\s]+/) || null) : null) || (embed.footer && embed.footer.text ? [null, null, embed.footer.text.match(/^submitted by ([\s\S]+) -/)[1]] : null) || [null, "0"];
					if (!tickUser) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = tickUser[1] ? tickUser[1] : (client.users.cache.find(u => u.tag === tickUser[2]) ? client.users.cache.find(u => u.tag === tickUser[2]).id : "0");
					break;
				case "275813801792634880": //Zire
					if (!embed) {
						errorCount++;
						continue;
					}
					suggestionInfo.suggester = embed.author.name.match(/(\d+)$/) ? embed.author.name.match(/(\d+)$/)[1] : "0";
					suggestionInfo.suggestion = embed.description;
					suggestionInfo.status = "approved";
					// eslint-disable-next-line no-case-declarations
					let [staff, staffReason] =  ziraReason(embed);
					suggestionInfo.staff_member = staff;
					switch (embed.title.split(" ")[0]) {
					case "Potential":
						suggestionInfo.displayStatus = "consideration";
						if (staffReason) suggestionInfo.comments.push({
							comment: staffReason,
							author: staff,
							id: 1,
							created: new Date(),
							deleted: false
						});
						break;
					case "Denied":
						suggestionInfo.status = "denied";
						suggestionInfo.denial_reason = staffReason;
						break;
					case "Approved":
						if (staffReason) suggestionInfo.comments.push({
							comment: staffReason,
							author: staff,
							id: 1,
							created: new Date(),
							deleted: false
						});
						break;
					case "Invalid":
						suggestionInfo.displayStatus = "no";
						if (staffReason) suggestionInfo.comments.push({
							comment: staffReason,
							author: staff,
							id: 1,
							created: new Date(),
							deleted: false
						});
						break;
					}
					break;
				default:
					if (m.author.bot) {
						//UnbelievaBoat
						if (embed && embed.footer && embed.footer.text && embed.footer.text.endsWith("Powered by UnbelievaBoat")) {
							let unbMatch = embed.footer.text.match(/User ID: (\d+)/);
							if (!unbMatch) {
								errorCount++;
								continue;
							}
							suggestionInfo.status = "approved";
							suggestionInfo.suggester = unbMatch[1];
							suggestionInfo.suggestion = embed.description;
						} else continue;
					} else {
						suggestionInfo.suggester = m.author.id;
						suggestionInfo.suggestion = m.content;
						suggestionInfo.status = "approved";
					}
				}

				let embedSuggest = await suggestionEmbed(qServerDB.config.locale, suggestionInfo, qServerDB, client);
				if (suggestionInfo.displayStatus === "implemented" && qServerDB.config.channels.archive) {
					let deleteMsg = await deleteFeedMessage(locale, suggestionInfo, qServerDB, client);
					if (deleteMsg[0]) return message.channel.send(deleteMsg[0]);

					suggestionInfo.implemented = true;

					client.channels.cache.get(qServerDB.config.channels.archive).send(embedSuggest);
				} else if (suggestionInfo.status === "denied") {
					if (qServerDB.config.channels.denied) {
						let suggester = await fetchUser(suggestionInfo.suggester, client);
						let deniedEmbed = new Discord.MessageEmbed()
							.setTitle(string(qServerDB.config.locale, "SUGGESTION_DENIED_TITLE"))
							.setAuthor(string(qServerDB.config.locale, "SUGGESTION_FROM_TITLE", {user: suggester.tag}), suggester.displayAvatarURL({
								format: "png",
								dynamic: true
							}))
							.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
							.setDescription(suggestionInfo.suggestion || string(qServerDB.config.locale, "NO_SUGGESTION_CONTENT"))
							.setFooter(string(qServerDB.config.locale, "SUGGESTION_FOOTER", {id: suggestionInfo.suggestionId.toString()}))
							.setTimestamp(suggestionInfo.submitted)
							.setColor(client.colors.red);
						suggestionInfo.denial_reason ? deniedEmbed.addField(string(qServerDB.config.locale, "REASON_GIVEN"), suggestionInfo.denial_reason) : "";
						suggestionInfo.attachment ? deniedEmbed.setImage(suggestionInfo.attachment) : "";
						message.guild.channels.cache.get(qServerDB.config.channels.denied).send(deniedEmbed);
					}
				} else {
					let err = await client.channels.cache.get(qServerDB.config.channels.suggestions).send(embedSuggest).then(async posted => {
						suggestionInfo.messageId = posted.id;

						if (qServerDB.config.react) {
							let reactEmojiUp = qServerDB.config.emojis.up;
							let reactEmojiMid = qServerDB.config.emojis.mid;
							let reactEmojiDown = qServerDB.config.emojis.down;
							if (reactEmojiUp !== "none") await posted.react(reactEmojiUp).catch(async () => {
								await posted.react("👍");
								reactEmojiUp = "👍";
							});
							await timeout(750);
							if (reactEmojiMid !== "none") await posted.react(reactEmojiMid).catch(async () => {
								await posted.react("🤷");
								reactEmojiMid = "🤷";
							});
							await timeout(750);
							if (reactEmojiDown !== "none") await posted.react(reactEmojiDown).catch(async () => {
								await posted.react("👎");
								reactEmojiDown = "👎";
							});
							await timeout(750);
							suggestionInfo.emojis = {
								up: reactEmojiUp,
								mid: reactEmojiMid,
								down: reactEmojiDown
							};
						}

						return true;
					}).catch(() => {
						return "Error";
					});
					if (err === "Error") return message.channel.send(string(locale, "ERROR", {}, "error"));
				}
				await new Suggestion(suggestionInfo).save();
				successCount++;
				await timeout(1750);
			}
			if (successCount === 0) return sent.edit(string(locale, "IMPORTED_NONE", {}, "error"));
			sent.edit(string(locale, errorCount > 0 ? "IMPORTED_SOME_ERROR" : "IMPORTED_SUCCESS", { count: successCount.toString() }, "success"));
			console.log(`Import took ${humanizeDuration(Date.now()-startTime)}`);
		}).catch(err => {
			console.log("Import catch", err);
			return message.channel.send(string(locale, "ERROR", {}, "error"));
		});
	}
};
