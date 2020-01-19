const { readFile, readFileSync, writeFileSync } = require("fs");
/**
 * Store persistent data.<br>
 * *This is NOT a replacement for a proper database. Use this for small things that would require a single database record, so we do not have to make single-document collections.*
 *
 * Make sure that the key is already in the `persistent.json` file before you try to save to it.
 *
 * @type {Class}
 *
 * @example
 * const Persist = require("./Persistent");
 * let persist = new Persist("./persistent.json", {
 *     "presence": {
 *         "activity": "me being rewritten!",
 *         "type": "WATCHING"
 *     }
 * });
 */
module.exports = class Persist {
	/**
	 * Make a new instance of the Persist class
	 * @param {string | null} [path]
	 * @param {object | null} [data] - What data is being stored
	 * @example
	 * let persist = new Persist("./persistent.json", {
	 *     "presence": {
	 *         "activity": "me being rewritten!",
	 *         "type": "WATCHING"
	 *     }
	 * });
	 *
	 */
	constructor (path, data) {
		/**
		 * Where your persistent data is stored.
		 * You CAN have multiple files by instantiating multiple instances with the `new` keyword
		 *
		 * @default "./persistent.json"
		 * @type {string}
		 */
		this.path = path || "./persistent.json";
		/**
		 * The data you are saving
		 * Make sure the keys are already in your persistent storage file. This script will not add new keys
		 *
		 * @default null
		 * @type {object}
		 */
		this.data = data || null;
	}

	/**
	 * Get all of the data from the persistent data file.
	 * **NOT A FUNCTION**
	 * @example
	 * persist.getData
	 * @returns {JSON} Entire document
	 */
	get getData () {
		return readFileSync(this.path, "utf8")
			.catch((err) => {
				throw new Error(err);
			});
	}

	/**
	 * Save data to your persistent storage file
	 * @param {string} key - Under which key should the data be stored
	 * @param {object} data - The data to be stored
	 * @example
	 * persist.save("presence", {
	 *     "activity": "suggestions!",
	 *     "type": "WATCHING"
	 * })
	 */
	save (key, data) {
		if (data) {
			readFile(this.path, async (err, jsonFile) => {
				if (err) throw err;
				let json = JSON.parse(jsonFile);
				if (!this.data && !data) return console.log("oof");

				for (let keys in data) {
					// eslint-disable-next-line no-prototype-builtins
					if (data.hasOwnProperty(keys)) {
						json[key][keys] = data[keys];
					}
				}
				this.data = json;
				await writeFileSync(this.path, JSON.stringify(json, null, 2));
			});
		}
	}

};
