import {readdir as fsReaddir, readlink} from 'node:fs/promises';
import path from 'node:path';

// https://stackoverflow.com/a/45130990
export async function* readdir(
  dir: string,
  ext?: string
): AsyncGenerator<string> {
  const dirents = await fsReaddir(dir, {withFileTypes: true});
  for (const dirent of dirents) {
    if (
      ext &&
      ((dirent.isFile() && !dirent.name.endsWith(ext)) ||
        (dirent.isSymbolicLink() &&
          (await readlink(path.resolve(dir, dirent.name)).then(
            d => !d.endsWith(ext)
          ))))
    ) {
      continue;
    }

    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* readdir(res, ext);
    } else {
      yield res;
    }
  }
}
