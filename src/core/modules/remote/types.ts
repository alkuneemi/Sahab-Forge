export interface GitHubSourceConfig {
  owner: string;
  repo: string;
  branch: string; // e.g. "main"
  folder?: string; // optional subfolder containing sahab.modules.json and bundle assets
  token?: string; // only used to read the manifest via the GitHub API (private repos)
}

/** One entry inside the repo's sahab.modules.json manifest. */
export interface RemoteModuleManifestEntry {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  version: string;
  /** Path inside the repo to the built, self-registering bundle (e.g. "dist/module.js"). */
  entry: string;
}

export interface RemoteModuleManifest {
  modules: RemoteModuleManifestEntry[];
}
