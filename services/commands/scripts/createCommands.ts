import path from 'node:path';

import {Framework} from '@suggester/framework';
import {LocalizationService} from '@suggester/i18n';
import {parseConfigFile} from '@suggester/util';

const main = async () => {
  const config = parseConfigFile(path.join(process.cwd(), 'config.toml'))!;

  const l = new LocalizationService().loadAll();
  const created = await Framework.bulkCreateCommands(
    l,
    config.discord_application.token,
    config.meta.admin_servers
  );

  console.dir(created, {depth: null});
};

main().catch(e => console.dir(e, {depth: null}));
