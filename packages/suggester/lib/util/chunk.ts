/**
 * Chunks an array into an array of arrays with max length `chunkSize`
 * @param list the array to chunk
 * @param chunkSize the max size of a chunk
 * @returns the chunked array
 */
export const chunk = <T>(list: T[], chunkSize: number): T[][] => {
  return list.reduce((acc, curr, i) => {
    const cn = Math.floor(i / chunkSize);
    acc[cn] = ([] as T[]).concat(acc[cn] || [], curr);
    return acc;
  }, [] as T[][]);
};

/**
 * Splits a string into parts with a max length. Tries to split at a specified delimeter to avoid splitting mid-word
 * @param str the string to split
 * @param chunkSize the max size of the substring
 * @param at the delimeter
 * @returns the split string
 */
export const chunkStringAt = (str: string, chunkSize: number, at = ' ') => {
  const chunks: string[] = [];
  const split = str.split(at);

  let curr: string[] = [];
  while (split.length) {
    const fst = split.shift()!;

    // there's no way to make the string fit into any chunk,
    // it must create a new chunk
    if (fst.length > chunkSize) {
      chunks.push(curr.join(at));

      const keep = fst.substring(0, chunkSize);
      const rest = fst.substring(chunkSize);

      chunks.push(keep);
      split.unshift(rest);

      // fst can fit into current chunk
    } else if (curr.concat(fst).join(at).length <= chunkSize) {
      curr.push(fst);

      // fst cannot fit into current chunk
    } else {
      chunks.push(curr.join(at));
      curr = [fst];
    }
  }

  if (curr.length) {
    chunks.push(curr.join(at));
  }

  return chunks;
};
