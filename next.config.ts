import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` on styles is unavoidable: Tailwind and next/font both emit
 * inline style blocks. Scripts allow `'unsafe-eval'` only outside production —
 * React Fast Refresh needs it, the deployed bundle does not.
 *
 * connect-src has to name the Supabase project because auth, PostgREST and
 * Storage are all called straight from the browser. It is read from the same
 * env var the client uses, so a project change cannot leave the policy stale.
 */
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

/**
 * Google Analytics เสิร์ฟไลบรารีจาก googletagmanager.com แล้วส่ง hit ไปที่
 * google-analytics.com กับ analytics.google.com — ถ้าไม่ระบุไว้ CSP จะบล็อก
 * ตั้งแต่โหลดสคริปต์ และ Google จะรายงานว่า "ตรวจไม่พบแท็กในเว็บไซต์"
 */
const gtagScript = "https://www.googletagmanager.com";
const gtagConnect = [
  "https://*.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
].join(" ");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${gtagScript}${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace("https://", "wss://")} ${gtagConnect}`.trim(),
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // Deliberately no `upgrade-insecure-requests`: it rewrites same-origin
  // navigations to https, which breaks reaching a production build over plain
  // http on localhost. Strict-Transport-Security below already forces https on
  // the public domain, which is the case that matters.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt and braces with frame-ancestors above, for anything that predates CSP.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Only meaningful over HTTPS; the tunnel terminates TLS, so it applies.
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Wallet balances, orders and delivered game accounts must never sit in a
      // shared cache or come back from the bfcache after signing out.
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
