require("dotenv").config();

const Discord = require("discord.js");
const { errorLog, fileLoader } = require("./coreFunctions.js");
const { connect, connection } = require("mongoose");
const autoIncrement = require("mongoose-sequence");
const { basename } = require("path");
const { presence } = require("./persistent.json");
if (process.env.SENTRY_DSN) {
	const {init} = require("@sentry/node");
	if (process.env.NODE_ENV === "production") init({dsn: process.env.SENTRY_DSN});
}

const client = new Discord.Client({
	disabledEvents: [
		"GUILD_SYNC",
		"GUILD_MEMBERS_CHUNK",
		"GUILD_INTEGRATIONS_UPDATE",
		"GUILD_BAN_ADD",
		"GUILD_BAN_REMOVE",
		"CHANNEL_PINS_UPDATE",
		"USER_UPDATE",
		"USER_NOTE_UPDATE",
		"USER_SETTINGS_UPDATE",
		"PRESENCE_UPDATE",
		"VOICE_STATE_UPDATE",
		"TYPING_START",
		"VOICE_SERVER_UPDATE",
		"RELATIONSHIP_ADD",
		"RELATIONSHIP_REMOVE",
		"WEBHOOKS_UPDATE"
	],
	disableMentions: "everyone",
	presence: { activity: { name: presence.activity || "", type: presence.type || "PLAYING" }, status: presence.status || "online" }
});

connect(process.env.MONGO, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})
	.catch((err) => {
		throw new Error(err);
	});
autoIncrement(connection);
connection.on("open", () => {
	console.log("Connected to MongoDB!");
});
connection.on("error", (err) => {
	console.error("Connection error: ", err);
});

client.commands = new Discord.Collection();
(async () => {
	let eventFiles = await fileLoader("events");
	for await (let file of eventFiles) {
		if (!file.endsWith(".js")) continue;

		let event = require(file);
		let eventName = basename(file).split(".")[0];

		client.on(eventName, (...args) => {
			try {
				event(Discord, client, ...args);
			}
			catch (err) {
				errorLog(err, "Event Handler", `Event: ${eventName}`);
			}
		});
		console.log("[Event] Loaded", eventName);
	}

	let commandFiles = await fileLoader("commands");
	for await (let file of commandFiles) {
		if (!file.endsWith(".js")) return;

		let command = require(file);
		let commandName = basename(file).split(".")[0];

		client.commands.set(commandName, command);
		console.log("[Command] Loaded", commandName);
	}
})();

client.login(process.env.TOKEN)
	.catch(console.error);

client.on("error", (err) => {
	errorLog(err, "error", "something happened and idk what");
});
client.on("warn", (warning) => {
	console.warn(warning);
});
process.on("unhandledRejection", (err) => { // this catches unhandledPromiserejectionWarning and other unhandled rejections
	errorLog(err, "unhandledRejection", "oof something is broken x.x");
});

/**
 * Define the chunk method in the prototype of an array
 * that returns an array with arrays of the given size.
 *
 * @param chunkSize {Integer} Size of every group
 */
Object.defineProperty(Array.prototype, "chunk", {
	value: function(chunkSize){
		let temporal = [];
		for (let i = 0; i < this.length; i+= chunkSize){
			temporal.push(this.slice(i,i+chunkSize));
		}
		return temporal;
	}
});
