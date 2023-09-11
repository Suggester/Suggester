export type DeepReadonly<T> = {readonly [P in keyof T]: DeepReadonly<T[P]>};
export type DeepMutable<T> = {-readonly [P in keyof T]: DeepMutable<T[P]>};

export type UnionToIntersection<U> = (
  U extends never ? never : (arg: U) => never
) extends (arg: infer I) => void
  ? I
  : never;

export type UnionToTuple<T> = UnionToIntersection<
  T extends never ? never : (t: T) => T
> extends (_: never) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : [];

export type DistributiveOmit<T, K extends keyof T> = T extends any
  ? Omit<T, K>
  : never;

export interface GitHubReleaseData {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: 'User';
    site_admin: boolean;
  };
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: false;
  prerelease: false;
  created_at: string;
  published_at: string;
  assets: unknown[];
  tarball_url: string;
  zipball_url: string;
  body: string;
}

export type DelimCaseToCamelCase<
  S extends string,
  Delim extends string
> = S extends `${infer Fst}${Delim}${infer SndFstLetter}${infer Snd}`
  ? `${Fst}${Uppercase<SndFstLetter>}${DelimCaseToCamelCase<Snd, Delim>}`
  : UppercaseID<S>;

// I'm picky and like ID more than Id
export type UppercaseID<S extends string> = S extends `${infer Fst}Id`
  ? `${Fst}ID`
  : S;

export type KebabCaseToCamelCase<S extends string> = UppercaseID<
  DelimCaseToCamelCase<S, '-'>
>;

export type SnakeCaseToCamelCase<S extends string> = UppercaseID<
  DelimCaseToCamelCase<S, '_'>
>;
