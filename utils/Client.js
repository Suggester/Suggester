require("./Structures/GuildMember");
require("./Structures/User");
require("./Structures/Guild");

const { Client, Team, TeamMember, Collection } = require("discord.js");
const config = require("../config.json");
const chalk = require("chalk");

module.exports = class extends Client {
	constructor (options) {
		super (options);

		this.admins = new Set();
		this.commands = new Collection();
		this.cooldowns = new Collection();

		// add admins from the config to the team
		if (config.developer && config.developer.length > 0) {
			for (const admin of config.developer) {
				this.admins.add(admin);
				console.log(chalk`{blue [{bold INFO}] Found {bold ${admin}} in {bold config.json}}`);
			}
		}
	}

	async fetchTeam () {
		const { owner } = await super.fetchApplication();

		if (owner instanceof Team) {
			return owner.members.map(({ user }) => user);
		}
		if (owner instanceof TeamMember) {
			return [owner.user];
		}
		throw new Error("Error fetching team members");
	}
};
