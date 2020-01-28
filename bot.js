const Discord = require("discord.js");
const fs = require("fs");

const client = new Discord.Client({disabledEvents:[
	"GUILD_SYNC",
	"GUILD_UPDATE",
	"GUILD_MEMBER_ADD",
	"GUILD_MEMBER_REMOVE",
	"GUILD_MEMBER_UPDATE",
	"GUILD_MEMBERS_CHUNK",
	"GUILD_INTEGRATIONS_UPDATE",
	"GUILD_ROLE_CREATE",
	"GUILD_ROLE_DELETE",
	"GUILD_ROLE_UPDATE",
	"GUILD_BAN_ADD",
	"GUILD_BAN_REMOVE",
	"CHANNEL_CREATE",
	"CHANNEL_DELETE",
	"CHANNEL_UPDATE",
	"CHANNEL_PINS_UPDATE",
	"MESSAGE_DELETE",
	"MESSAGE_DELETE_BULK",
	"MESSAGE_REACTION_ADD",
	"MESSAGE_REACTION_REMOVE",
	"MESSAGE_REACTION_REMOVE_ALL",
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
]});
const core = require("./coreFunctions.js");
const { connect, connection } = require("mongoose");
const autoIncrement = require("mongoose-sequence");

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
/*
const DBL = require("dblapi.js");
const dbl = new DBL(process.env.DBL_TOKEN, client);

// Optional events
dbl.on("posted", () => {
	core.coreLog(":hash: **Server Count Posted to Discord Bot List (.org)**", client);
});

dbl.on("error", e => {
	core.coreLog(`:rotating_light: **DBL (.org) ERROR** \n\`\`\`${e}\`\`\``, client);
});
*/
/*
const Enmap = require("enmap");

if (!client.suggestions) {
	client.suggestions = new Enmap({
		name: "suggestions"
	});
}

if (!client.servers) {
	client.servers = new Enmap({
		name: "servers"
	});
}
if (!client.core) {
	client.core = new Enmap({
		name: "core"
	});
}
*/
fs.readdir("./events/", (err, files) => {
	files.forEach(file => {
		const eventHandler = require(`./events/${file}`);
		const eventName = file.split(".")[0];

		client.on(eventName, (...args) => {
			try {
				eventHandler(Discord, client, ...args);
			} catch (err) {
				core.errorLog(err, "Event Handler", `Event: ${eventName}`);
			}

		});
	});
});

client.login(process.env.TOKEN)
	.catch((err) => {
		throw new Error(err);
	});

// core.errorLog(err, type, footer)
client.on("error", (err) => {
	core.errorLog(err, "error", "something happened and idk what");
});
client.on("warn", (warning) => {
	console.warn(warning);
});
process.on("unhandledRejection", (err) => { // this catches unhandledPromiserejectionWarning and other unhandled rejections
	core.errorLog(err, "unhandledRejection", "oof something is broken x.x");
});
