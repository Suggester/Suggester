const { coreLog } = require("../coreFunctions.js");
module.exports = (Discord, client, event) => {
	coreLog(`:rotating_light: **Websocket Disconnect**\n>>> Code: ${event.code}\nReason: ${event.reason}`);
};
