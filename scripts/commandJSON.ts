import {Command, Framework} from 'suggester';

Framework.discoverModules().then(mods => {
  let cmds: Command[] = [];

  for (const Mod of mods) {
    const m = new Mod();
    cmds = cmds.concat(m.commands);
  }

  const json = cmds.map(c => c.toJSON());
  console.log(JSON.stringify(json));
});
