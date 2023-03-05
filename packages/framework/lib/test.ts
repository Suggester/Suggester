import path from 'node:path';
import {inspect} from 'node:util';

import {LocalizationService} from '@suggester/i18n';
import {parseConfigFile} from '@suggester/util';

import {Framework} from '.';

// TODO: use env instead of config

const main = async () => {
  const config = parseConfigFile(path.join(process.cwd(), 'config.toml'))!;
  // if (!config.success) {
  //   const formattedErrors = config.error.format();
  //   console.error(inspect(formattedErrors, {depth: null}));

  //   throw new Error('One or more invalid items in configuration file');
  // }

  const l = new LocalizationService().loadAll();
  for (const gid of config.meta.admin_servers) {
    const created = await Framework.bulkCreateCommands(
      l,
      config.discord_application.token
      // gid
    );

    console.log(created);
  }

  // if (config.data.dev) {
  // for (const devSetup of config.data.dev) {
  //   await Framework.bulkCreateCommands(
  //     l,
  //     devSetup.token,
  //     devSetup.guild_id
  //   ).then(r => console.dir(r, {depth: null}));
  // }
  // }

  // if (config.data.init) {
  //   for (const initSetup of config.data.init) {
  //     await Framework.bulkCreateCommands(l, initSetup.token).then(r =>
  //       console.dir(r, {depth: null})
  //     );
  //   }
  // }
};

main().catch(console.error);
