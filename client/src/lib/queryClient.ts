import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Flexible API helper supporting both signatures:
// - apiRequest(url, options)
// - apiRequest(method, url, bodyOrOptions)
export async function apiRequest(arg1: string, arg2?: any, arg3?: any): Promise<Response> {
  const { auth } = await import("./firebase");
  const token = await auth.currentUser?.getIdToken();

  let url = "";
  let options: RequestInit = {};

  const isMethod = ["GET","POST","PUT","PATCH","DELETE"].includes(arg1?.toUpperCase?.());
  if (isMethod && typeof arg2 === 'string') {
    url = arg2;
    const maybeBody = arg3;
    options = { method: arg1.toUpperCase() } as RequestInit;
    if (maybeBody && typeof maybeBody === 'object' && !('headers' in maybeBody) && !('method' in maybeBody)) {
      options.body = JSON.stringify(maybeBody);
    } else if (maybeBody) {
      options = { ...options, ...(maybeBody as RequestInit) };
    }
  } else {
    url = arg1;
    options = (arg2 as RequestInit) || {};
  }

  // Auto-JSON stringify if body is object
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }

  // Prefer same-origin calls to use Hosting rewrites in production
  const baseUrl = ""; // same-origin
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
  const { auth } = await import("./firebase");
  const token = await auth.currentUser?.getIdToken();

  const finalUrl = queryKey.join("/") as string; // use same-origin

  const res = await fetch(finalUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
