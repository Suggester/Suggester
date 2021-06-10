require("./Structures/GuildMember");
require("./Structures/User");
require("./Structures/Guild");

const { Client, Team, Collection, User } = require("discord.js");
const config = require("../config.json");
const chalk = require("chalk");

module.exports = class extends Client {
	constructor (options) {
		super (options);

		this.admins = new Set();
		this.commands = new Collection();
		this.slashcommands = new Collection();
		this.locales = new Collection();
		this.cooldowns = new Collection();
		this.config = config;
		this.reactInProgress = false;
		this.topInProgress = false;
		let baseColors = {
			"default": "#5865F2",
			"red": "#e74c3c",
			"green": "#2ecc71",
			"blue": "#3498db",
			"gray": "#979c9f",
			"orange": "#e67e22",
			"yellow": "#f1c40f",
			"gold": "#FFD700",
			"teal": "#53d0e1",
			"protip": "#1abc9c",
			"bean": "#aad136"
		};
		for (let c of Object.keys(baseColors)) {
			if (config.colors && config.colors[c]) baseColors[c] = config.colors[c];
		}
		this.colors = baseColors;


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
		if (owner instanceof User) {
			return [owner.user];
		}
		throw new Error("Error fetching team members");
	}
};
