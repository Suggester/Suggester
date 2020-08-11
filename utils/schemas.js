const { Schema, model } = require("mongoose");
const { prefix } = require("../config.json");
// IMPORTANT: Snowflakes MUST be Strings, not Numbers

const settings = new Schema({
	id: { type: String, required: true }, // server id
	blocked: { type: Boolean, default: false },
	allowlist: { type: Boolean, default: false },
	flags: [ String ],
	config: {
		prefix: { type: String, default: prefix },
		locale: { type: String, default: "en" },
		admin_roles: [String],
		staff_roles: [String],
		allowed_roles: [String],
		voting_roles: [String],
		blocked_roles: [String],
		ping_role: String,
		approved_role: { type: String },
		channels: {
			suggestions: { type: String },
			staff: { type: String },
			log: { type: String },
			denied: { type: String },
			archive: { type: String },
			commands: { type: String }
		},
		reactionOptions: {
			suggester: { type: Boolean, default: true },
			one: { type: Boolean, default: true },
			color_threshold: { type: Number, default: 15 },
			color: { type: String, default: "#FFD700" }
		},
		notify: { type: Boolean, default: true },
		react: { type: Boolean, default: true },
		clean_suggestion_command: { type: Boolean, default: false },
		mode: { type: String, default: "review" },
		in_channel_suggestions: { type: Boolean, default: false },
		blocklist: [String],
		emojis: {
			up: { type: String, default: "👍" },
			mid: { type: String, default: "🤷" },
			down: { type: String, default: "👎" }
		},
		loghook: {
			id: String,
			token: String
		}
	}
});

const suggestion = new Schema({
	id: { type: String, required: true }, // server id
	suggester: String,
	suggestion: String,
	status: String,
	submitted: { type: Date },
	suggestionId: Number,
	displayStatus: String,
	reviewMessage: String,
	staff_member: String,
	denial_reason: String,
	emojis: {
		up: { type: String, default: "👍" },
		mid: { type: String, default: "🤷" },
		down: { type: String, default: "👎" }
	},
	reviewEmojis: {
		approve: String,
		deny: String
	},
	messageId: String,
	comments: [
		{
			comment: String,
			author: String,
			id: { type: String, min: 1, max: 23 },
			created: { type: Date },
			deleted: Boolean,
		}
	],
	attachment: String,
	implemented: { type: Boolean, default: false },
	imported: String
});

const user = new Schema({
	id: { type: String, required: true }, // user id
	ack: String,
	blocked: { type: Boolean, default: false },
	notify: { type: Boolean, default: true },
	locale: { type: String },
	protips: { type: Boolean, default: true },
	displayed_protips: [String],
	flags: [ String ],
	verifyColor: String
});

const command = new Schema({
	command: { type: String, required: true },
	fullCommand: { type: String, required: true },
	success: { type: Boolean, required: false },

	user: { type: String, required: true },
	guild: String,
	channel: { type: String, required: true },
	message: { type: String, required: true },

	date: { type: Date, required: true },
	executionTime: { type: Number, required: true }
}/*, { capped: { size: 10000000 }}*/); // can be made into a capped collection if needed

const serverLog = new Schema({
	id: { type: String, required: true },
	action: { type: String, required: true },
	joinedAt: { type: Date, required: false }, // if the bot left a server, when did it join?
	timesJoined: { type: Number, required: false },
	date: { type: Date, required: true }
}/*, { capped: true, size: 10000000 }*/); // can be made into a capped collection if needed.

module.exports = {
	Server: model("servers", settings, "settings"),
	Suggestion: model("suggestions", suggestion, "suggestions"),
	User: model("user", user, "users"),
	Command: model("commands", command, "commands"),
	ServerLog: model("serverlog", serverLog, "serverLogs")
};
