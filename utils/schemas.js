const { Schema, model } = require("mongoose");
const { prefix } = require("../config.json");
// IMPORTANT: Snowflakes MUST be Strings, not Numbers

const settings = new Schema({
	id: { type: String, required: true }, // server id
	blocked: { type: Boolean, default: false },
	whitelist: { type: Boolean, default: false },
	flags: [ String ],
	config: {
		prefix: { type: String, default: prefix },
		admin_roles: [String],
		staff_roles: [String],
		allowed_roles: [String],
		approved_role: { type: String },
		channels: {
			suggestions: { type: String },
			staff: { type: String },
			log: { type: String },
			denied: { type: String },
			archive: { type: String },
			commands: { type: String }
		},
		notify: { type: Boolean, default: true },
		react: { type: Boolean, default: true },
		clean_suggestion_command: { type: Boolean, default: false },
		mode: { type: String, default: "review" },
		blacklist: [String],
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
	implemented: Boolean
});

const user = new Schema({
	id: { type: String, required: true }, // user id
	ack: String,
	blocked: { type: Boolean, default: false },
	notify: { type: Boolean, default: true },
	selfnotify: { type: Boolean, default: true},
	flags: [ String ]
});

module.exports = {
	Server: model("servers", settings, "settings"),
	Suggestion: model("suggestions", suggestion, "suggestions"),
	User: model("user", user, "users")
};
