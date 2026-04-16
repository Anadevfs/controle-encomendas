const API_PATH_PREFIX = "/api";
const DEFAULT_API_BASE_URL = "http://localhost:8080";

const getApiBaseCandidates = () => {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBase) {
    return [configuredBase.replace(/\/$/, "")];
  }

  return [DEFAULT_API_BASE_URL];
};

const normalizeApiPath = (path: string) =>
  path.startsWith(API_PATH_PREFIX)
    ? path
    : `${API_PATH_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;

export async function apiGet<T>(path: string): Promise<T> {
  const normalizedPath = normalizeApiPath(path);
  const candidates = getApiBaseCandidates();

  let lastError: Error | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${normalizedPath}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error("Invalid API response");
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("API request failed");
    }
  }

  throw lastError ?? new Error("API request failed");
}

export async function apiPost<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const normalizedPath = normalizeApiPath(path);
  const candidates = getApiBaseCandidates();

  let lastError: Error | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${normalizedPath}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error("Invalid API response");
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("API request failed");
    }
  }

  throw lastError ?? new Error("API request failed");
}

export async function apiPostForm<TResponse>(path: string, body: FormData): Promise<TResponse> {
  const normalizedPath = normalizeApiPath(path);
  const candidates = getApiBaseCandidates();

  let lastError: Error | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${normalizedPath}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error("Invalid API response");
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("API request failed");
    }
  }

  throw lastError ?? new Error("API request failed");
}

export async function apiPatch<TResponse>(path: string): Promise<TResponse> {
  const normalizedPath = normalizeApiPath(path);
  const candidates = getApiBaseCandidates();

  let lastError: Error | null = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${normalizedPath}`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error("Invalid API response");
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("API request failed");
    }
  }

  throw lastError ?? new Error("API request failed");
}
