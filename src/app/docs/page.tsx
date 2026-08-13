'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { ArrowLeft, Download } from 'lucide-react';

const SWAGGER_VERSION = '5.29.5';

type SwaggerUIFactory = (options: Record<string, unknown>) => unknown;

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerUIFactory;
  }
}

/**
 * Swagger UI for public/openapi.json.
 *
 * Swagger UI is loaded from a CDN instead of bundled, so the app keeps no extra
 * dependency for a page only developers open. Requests fired from "Try it out"
 * carry the session cookie, so they authenticate as the logged-in user.
 */
export default function ApiDocsPage() {
  const [failed, setFailed] = useState(false);
  const rendered = useRef(false);

  const render = () => {
    if (rendered.current || !window.SwaggerUIBundle) return;
    rendered.current = true;

    window.SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      docExpansion: 'list',
      defaultModelsExpandDepth: 0,
      persistAuthorization: true,
      withCredentials: true,
      tryItOutEnabled: true,
    });
  };

  // Covers the case where the script was already cached from a previous visit.
  useEffect(render, []);

  return (
    <div className="min-h-screen bg-white">
      <link
        rel="stylesheet"
        href={`https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`}
      />

      <header className="sticky top-0 z-10 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-xs font-semibold hover:text-indigo-300">
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าร้านค้า</span>
          </Link>
          <span className="text-xs font-bold tracking-wide">NEO APP API DOCS</span>
          <a
            href="/openapi.json"
            download
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-indigo-300"
          >
            <Download className="w-4 h-4" />
            <span>openapi.json</span>
          </a>
        </div>
      </header>

      {failed && (
        <div className="max-w-3xl mx-auto m-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          โหลด Swagger UI จาก CDN ไม่สำเร็จ (ออฟไลน์หรือถูกบล็อก) — ดาวน์โหลด{' '}
          <a href="/openapi.json" className="underline font-semibold" download>
            openapi.json
          </a>{' '}
          แล้วเปิดใน editor.swagger.io หรือ import เข้า Postman แทนได้
        </div>
      )}

      <div id="swagger-ui" />

      <Script
        src={`https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`}
        onReady={render}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
