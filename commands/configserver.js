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
				prefix: "./", // you can remove this line if you want to use the default prefix (.)
				admin_roles: ["566029680168271892"],
				staff_roles: ["566029680168271892"],
				channels: {
					suggestions: "615249868998574081",
					staff: "615249847926128650",
					log: "654517672201027584",
					denied: "615249906608766999"
				},
				loghook: {
					id: "654517711463776316",
					token: "SuPCEtaM_q4QpayybMHRPaOWYG2U3QDOkP5YvpjO6p2yMWl3Nsk2pX3aei14h4wLVG0U"
				}
			}
		}).save();
	}
}