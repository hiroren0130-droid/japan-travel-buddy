type SameOriginOptions = {
  isVercel?: boolean;
};

function parseOrigin(value: string): string | null {
  try {
    const url = new URL(value);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function getExpectedOrigin(
  request: Request,
  isVercel: boolean
): string | null {
  if (isVercel) {
    const forwardedProtocol = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");

    if (forwardedProtocol !== "https" || !forwardedHost) {
      return null;
    }

    return parseOrigin(`https://${forwardedHost}`);
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(
  request: Request,
  options: SameOriginOptions = {}
): boolean {
  const suppliedOrigin = request.headers.get("origin");

  if (!suppliedOrigin) {
    return false;
  }

  const parsedOrigin = parseOrigin(suppliedOrigin);
  const expectedOrigin = getExpectedOrigin(
    request,
    options.isVercel ?? process.env.VERCEL === "1"
  );

  return parsedOrigin !== null && parsedOrigin === expectedOrigin;
}
