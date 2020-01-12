const { coreLog } = require("../coreFunctions.js");
module.exports = (Discord, client, error) => {
	coreLog(`:rotating_light: **Error**\n\`\`\`${error.message}\`\`\``);
	console.log(error);
};
