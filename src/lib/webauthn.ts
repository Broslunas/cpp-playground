export function getWebAuthnRpConfig(requestUrl?: string) {
  const envRpId = process.env.WEBAUTHN_RP_ID;
  const envOrigin = process.env.WEBAUTHN_ORIGIN || process.env.NEXT_PUBLIC_APP_URL;

  let origin = envOrigin || "http://localhost:3000";
  let rpID = envRpId || "localhost";

  if (requestUrl) {
    try {
      const parsed = new URL(requestUrl);
      origin = `${parsed.protocol}//${parsed.host}`;
      rpID = envRpId || parsed.hostname;
    } catch {}
  }

  return {
    rpName: "ejecuta.tech",
    rpID,
    origin,
  };
}
