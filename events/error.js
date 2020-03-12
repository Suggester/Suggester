const { coreLog } = require("../coreFunctions.js");
module.exports = (Discord, client, error) => {
	console.log(error);
	coreLog(`:rotating_light: **Error**\n\`\`\`${error.message}\`\`\``);
};
