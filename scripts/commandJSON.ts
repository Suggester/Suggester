import {
  Command,
  Framework,
  LocalizationService,
  SubCommandGroup,
} from 'suggester';

const initCommands = (l: LocalizationService, cmds: Command[]) => {
  for (const cmd of cmds) {
    cmd.init(l);
    for (const grp of cmd.subCommands) {
      if (grp instanceof SubCommandGroup) {
        grp.init(l);
        for (const sub of grp.subCommands) {
          sub.init(l);
        }
      } else {
        grp.init(l);
      }
    }
  }
};

Framework.discoverModules().then(mods => {
  let cmds: Command[] = [];
  const l = new LocalizationService().loadAll();

  for (const Mod of mods) {
    const m = new Mod();
    initCommands(l, m.commands);
    cmds = cmds.concat(m.commands);
  }

  const json = cmds.map(c => c.toJSON());
  console.log(JSON.stringify(json));
});
