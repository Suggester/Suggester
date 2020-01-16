const { Schema, model  } = require("mongoose");
const { prefix } = require("../config.json");
//const autoIncrement = require("mongoose-sequence")(connection);

// IMPORTANT: Snowflakes MUST be Strings, not Numbers

const settings = new Schema({
	id: { type: String, required: true }, // server id
	blocked: { type: Boolean, default: false },
	whitelist: { type: Boolean, default: false },
	config: {
		prefix: { type: String, default: prefix },
		admin_roles: [String],
		staff_roles: [String],
		channels: {
			suggestions: { type: String },
			staff: { type: String },
			log: { type: String },
			denied: { type: String }
		},
		gold_threshold: { type: Number, default: 20 },
		notify: { type: Boolean, default: true },
		react: { type: Boolean, default: true },
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
	submitted: { type: Date, default: new Date() },
	suggestionId: Number,
	displayStatus: String,
	reviewMessage: String,
	staff_member: String,
	denial_reason: String,
	votes: {
		upvotes: { type: Number, default: 0 },
		downvotes: { type: Number, default: 0 }
	},
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
			deleted: Boolean,
		}
	],
	attachment: String
});
//suggestion.plugin(autoIncrement, {inc_field: "autoIncId"});
/*
const core = new Schema({
	presence: {
		type: String,
		activity: String,
		status: String
	}
});
*/
const user = new Schema({
	id: { type: String, required: true }, // user id
	ack: String,
	blocked: { type: Boolean, default: false },
	beans: {
		sent: {
			bean: { type: Number, default: 0 },
			megabean: { type: Number, default: 0 },
			nukebean: { type: Number, default: 0 }
		},
		received: {
			bean: { type: Number, default: 0 },
			megabean: { type: Number, default: 0 },
			nukebean: { type: Number, default: 0 }
		}
	}
});

module.exports = {
	Server: model("servers", settings, "settings"),
	Suggestion: model("suggestions", suggestion, "suggestions"),
	//Core: model("core", core, "core"),
	User: model("user", user, "users")
};
