module.exports = {
	controls: {
		permission: 0,
		usage: "configserver",
		description: "Server Configuration Test Command",
		enabled: true,
		hidden: false
	},
	do: async (message, client, args, Discord) => {

		const {Server} = require("../utils/schemas");
		await new Server({
			id: message.guild.id,
			whitelist: true,
			config: {
				prefix: ".//", // you can remove this line if you want to use the default prefix (.)
				admin_roles: ["566029680168271892"],
				staff_roles: ["566029680168271892"],
				channels: {
					suggestions: "566352198271893589",
					staff: "566352198271893589",
					log: "566352198271893589",
					denied: "566352198271893589"
				}
			}
		}).save();
	}
}