const Discord = require("discord.js");
const fs = require("fs");

const client = new Discord.Client();
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
