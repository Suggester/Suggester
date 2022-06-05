import path from 'path';
import {inspect} from 'util';

import {Framework, LocalizationService, parseConfigFile} from 'suggester';

const main = async () => {
  const config = parseConfigFile(path.join(process.cwd(), 'config.toml'));
  if (!config.success) {
    const formattedErrors = config.error.format();
    console.error(inspect(formattedErrors, {depth: null}));

    throw new Error('One or more invalid items in configuration file');
  }

  const l = new LocalizationService().loadAll();

  if (config.data.dev) {
    for (const devSetup of config.data.dev) {
      await Framework.bulkCreateCommands(
        l,
        devSetup.token,
        devSetup.guild_id
      ).then(console.log);
    }
  }

  if (config.data.init) {
    for (const initSetup of config.data.init) {
      await Framework.bulkCreateCommands(l, initSetup.token).then(console.log);
    }
  }
};

main().catch(console.error);
