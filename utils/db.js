let models = require("./schemas");
const cache = require("./cache");

module.exports = {
	/**
	 * Search the database for an id, creates a new entry if not found
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQuery: async (collection, query, useCache = true) => {
		let fromCache;

		if (useCache && query.id || query.suggestionId) {
			const cache = collectionToCache(collection);

			if (cache) {
				fromCache = cache.get(query.suggestionId || query.id);
			}
		}

		if (fromCache) {
			return fromCache;
		} else {
			const n = await models[collection].findOne(
				query
			)
				.then((res) => {
					if (!res) {
						return new models[collection](
							query
						).save();
					}
					return res;
				}).catch((error) => {
					console.log(error);
				});

			const cache = collectionToCache(collection);

			if (cache) {
				cache.set(query.suggestionId || query.id, n.toJSON());
			}

			return n;
		}
	},

	// TODO: is this realistic to cache?
	/**
	 * Search the database for some parameters and return all entries that match, does not create a new entry if not found
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQueryAll: async (collection, query, writeToCache = true) => {
		const found = await models[collection].find(
			query
		)
			.then((res) => {
				if (!res) {
					return null;
				} else {
					return res;
				}
			}).catch((error) => {
				console.log(error);
			});

		if (writeToCache) {
			const cache = collectionToCache(collection);

			if (cache && found?.length) {
				if (collection === "Suggestion") {
					found.forEach((f) => cache.set(f.suggestionId, f));
				} else {
					found.forEach((f) => cache.set(f.id, f));
				}
			}
		}

		return found;
	},
	/**
	 * Search the database for some parameters, returns one entry and does not create a new entry if not found
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQueryNoNew: async (collection, query, useCache = true) => {
		if (!models[collection]) return 0;
		let fromCache;

		if (useCache && query.id || query.suggestionId) {
			const cache = collectionToCache(collection);

			if (cache) {
				fromCache = cache.get(query.suggestionId || query.id);
			}
		}

		if (fromCache) {
			return fromCache;
		}

		const found = await models[collection].findOne(
			query
		)
			.then((res) => {
				if (!res) {
					return null;
				} else {
					return res;
				}
			}).catch((error) => {
				console.log(error);
			});

		if (found && useCache && query.id || query.suggestionId) {
			const cache = collectionToCache(collection);
			if (cache) {
				cache.set(query.suggestionId || query.id, found.toJSON());
			}
		}

		return found;
	},
	/**
	 * Modify the database by providing either the userId or serverId
	 * @param {string} collection - Who should be modified, user or server.
	 * @param  {Snowflake | string} id - The id of the user/server
	 * @param {Object} modify - Should the user/server be blocked or unblocked
	 * @returns {Object}
	 */
	dbModifyId: async (collection, id, modify, useCache = true) => {
		modify.id = id;
		const modified = await models[collection].findOne({
			id: id
		})
			.then(async (res) => {
				if (!res) {
					return new models[collection](
						modify
					).save();
				}
				await res.update(modify);
				return res;
			});

		if (useCache) {
			const cache = collectionToCache(collectionToCache);

			if (cache) {
				cache.set(id, modified.toJSON());
			}
		}

		return modified;
	},
	/**
	 * Modify the database by providing either the userId or serverId.
	 *
	 * *Note: Does not create new if not found.*
	 * @param {string} collection - Who should be modified, user or server.
	 * @param {Object} term - Which to modify
	 * @param {Object} query - Which to modify
	 * @param {Object} modify - What to change it to
	 * @returns {Promise}
	 */
	async dbModify(collection, query, modify, useCache = true) {
		await models[collection].updateOne(query, modify);
		// TODO: is there a better way to do this? `findOneAndUpdate` returns the old document, not the new one :thinking:
		const modified = await models[collection].findOne(query);

		if (useCache && modified && modified.id || modified.suggestionId) {
			const cache = collectionToCache(collection);

			if (cache) {
				cache.set(modified.suggestionId || modified.id, modified.toJSON());
			}
		}
	},
	/**
	 * Delete one document
	 * @param {string} collection - Which collection the document is in
	 * @param {Object} query - Which to delete
	 * @returns {Promise<void>}
	 */
	dbDeleteOne: async (collection, query, useCache = true) => {
		if (useCache && query.id || query.suggestionId) {
			const cache = collectionToCache(collection);

			if (cache) {
				cache.del(query.suggestionId || query.id);
			}
		}

		return await models[collection].findOne(
			query
		)
			.then(async (res) => {
				if (!res) return undefined;
				await res.deleteOne();
				return res;
			});
	}
};

// this is literally the hackiest thing in the world
// but it works and doing it any other way would be
// way too much work so deal with it
function collectionToCache(collection) {
	switch (collection) {
	case "Server": {
		return cache.guilds;
	}

	case "User": {
		return cache.users;
	}

	case "Suggestion": {
		return cache.suggestions;
	}
	}
}
