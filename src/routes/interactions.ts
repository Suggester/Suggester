import {APIInteraction, InteractionType} from 'discord-api-types/v9';
import {FastifyPluginCallback} from 'fastify';

import {Database, HttpStatusCode, verifyInteraction} from 'suggester';

export const registerInteractionRoutes = (
  db: Database
): FastifyPluginCallback => {
  return (server, _, done) => {
    server.post<{
      Body: APIInteraction;
      Params: {id: string};
      Headers: {
        'x-signature-ed25519': string;
        'x-signature-timestamp': string;
      };
    }>('/:id(^\\d{16,20}$)', async (r, w) => {
      const instance = await db.instances.get(r.params.id);
      if (!instance) {
        w.code(HttpStatusCode.NOT_FOUND);
        return;
      }

      const time = r.headers['x-signature-timestamp'];
      const sig = r.headers['x-signature-ed25519'];
      const body = r.body;

      const isVerified = await verifyInteraction(
        instance.publicKey,
        body,
        time,
        sig
      );

      if (!isVerified) {
        w.code(HttpStatusCode.UNAUTHORIZED);
        return;
      }

      if (!instance.public && body.type !== InteractionType.Ping) {
        if (body.guild_id) {
          const canUse = await db.instanceGuilds.get({
            botId: r.params.id,
            guildId: body.guild_id,
          });

          if (!canUse) {
            w.code(HttpStatusCode.NOT_FOUND);
            return;
          }
        } else {
          // TODO: should commands in DMs work?
          w.code(HttpStatusCode.NOT_FOUND);
          return;
        }
      }

      switch (body.type) {
        case InteractionType.Ping: {
          return {type: 1};
        }

        case InteractionType.ApplicationCommand: {
          if (!body.member) {
            return;
          }

          const {username, discriminator} = body.member.user;

          console.log(
            `${username}#${discriminator} used command ${body.data.name} in ${body.guild_id}`
          );
        }
      }

      return;
    });

    done();
  };
};
