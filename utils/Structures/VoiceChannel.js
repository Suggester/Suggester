const { MessageManager, Structures: { extend } } = require("discord.js");

extend("VoiceChannel", (VC) => {
	return class extends VC {
		constructor (client, data) {
			super(client, data);
			this._client = client;
			this.data = data;
			this.messages = new MessageManager(this);
		}
	};
});
