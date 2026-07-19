import type { GitHubSourceConfig, RemoteModuleManifest } from "./types";

const MANIFEST_PATH = "sahab.modules.json";

function normalizePathSegment(segment: string): string {
  return segment.replace(/^\/+|\/+$/g, "");
}

function buildGitHubPath(source: GitHubSourceConfig, relativePath: string): string {
  const parts = [] as string[];
  if (source.folder) {
    const normalizedFolder = normalizePathSegment(source.folder);
    if (normalizedFolder) {
      parts.push(normalizedFolder);
    }
  }
  const normalizedRelative = normalizePathSegment(relativePath);
  if (normalizedRelative) {
    parts.push(normalizedRelative);
  }
  return parts.join("/");
}

function normalizeBranch(branch: string): string {
  return normalizePathSegment(branch);
}

function githubHeaders(token?: string): HeadersInit {
  return {
    Accept: "application/vnd.github.v3+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchGitHubApi<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(url, { headers: githubHeaders(token) });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`GitHub resource not found at ${url}. Verify owner, repo, branch, and path.`);
    }
    throw new Error(`GitHub API request failed for ${url}: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function listGitHubRepositories(
  token?: string,
  owner?: string
): Promise<Array<{ name: string; fullName: string; owner: string }>> {
  const apiUrl = owner
    ? `https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100`
    : `https://api.github.com/user/repos?per_page=100`;
  const data = await fetchGitHubApi<Array<{ name: string; full_name: string; owner: { login: string } }>>(apiUrl, token);
  return data.map((repo) => ({ name: repo.name, fullName: repo.full_name, owner: repo.owner.login }));
}

export async function listGitHubBranches(owner: string, repo: string, token?: string): Promise<string[]> {
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`;
  const data = await fetchGitHubApi<Array<{ name: string }>>(apiUrl, token);
  return data.map((branch) => branch.name);
}

export async function listGitHubDirectories(
  owner: string,
  repo: string,
  branch: string,
  path?: string,
  token?: string
): Promise<string[]> {
  const normalizedPath = normalizePathSegment(path ?? "");
  const pathSegment = normalizedPath ? `/${encodeURIComponent(normalizedPath)}` : "";
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${pathSegment}?ref=${encodeURIComponent(normalizeBranch(branch))}`;
  const data = await fetchGitHubApi<Array<{ type: string; name: string }>>(apiUrl, token);

  if (!Array.isArray(data)) {
    throw new Error(`GitHub path ${normalizedPath || '/'} is not a directory. Select a folder path that points to a directory.`);
  }

  return data.filter((entry) => entry.type === "dir").map((entry) => entry.name).sort();
}

/** jsDelivr serves raw GitHub files with the right Content-Type for <script> tags. */
export function cdnUrl(source: GitHubSourceConfig, path: string): string {
  return `https://cdn.jsdelivr.net/gh/${source.owner}/${source.repo}@${normalizeBranch(source.branch)}/${buildGitHubPath(source, path)}`;
}

/**
 * Reads sahab.modules.json from the repo (optionally inside a subfolder) via the
 * GitHub Contents API (so a token can be supplied for private repos), then
 * returns it parsed. The module *bundles* themselves are always loaded from
 * jsDelivr (public CDN) — private-repo module code isn't supported by this
 * simple client.
 */
export async function fetchManifest(source: GitHubSourceConfig): Promise<RemoteModuleManifest> {
  const normalizedBranch = normalizeBranch(source.branch);
  const pathsToTry = [buildGitHubPath(source, normalizePathSegment(MANIFEST_PATH))];
  if (source.folder) {
    pathsToTry.push(normalizePathSegment(MANIFEST_PATH));
  }

  let lastError: Error | null = null;
  for (const manifestPath of pathsToTry) {
    const apiUrl = `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${manifestPath}?ref=${normalizedBranch}`;
    try {
      const data = await fetchGitHubApi<{ content: string }>(apiUrl, source.token);
      const content = atob(data.content.replace(/\n/g, ""));
      const manifest = JSON.parse(content) as RemoteModuleManifest;
      if (!Array.isArray(manifest.modules)) throw new Error("invalid_manifest");
      return manifest;
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        lastError = new Error(
          `GitHub manifest not found at ${apiUrl}. Verify owner, repo, branch, folder, and that '${MANIFEST_PATH}' exists.`
        );
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error(`Failed to fetch GitHub manifest for ${source.owner}/${source.repo} on branch ${normalizedBranch}.`);
}
