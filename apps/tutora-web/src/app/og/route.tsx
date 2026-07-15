import { ImageResponse } from 'next/og';

import { APP_NAME } from '@shared/constants';
import en from '@/messages/en.json';

/**
 * Branded social share card (1200×630) served as a static route handler rather
 * than the `opengraph-image` file convention — the pages reference it explicitly
 * via `metadataBase`, and a route handler avoids injecting a base-less image tag
 * into the auto-generated not-found page. Solid indigo, no gradients. English
 * copy, since an OG image is a single-language brand asset.
 */
export const dynamic = 'force-static';

const OG_SIZE = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#4f46e5',
        color: '#ffffff',
        padding: 80,
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: '#ffffff',
            color: '#4f46e5',
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          T
        </div>
        <div style={{ fontSize: 44, fontWeight: 700 }}>{APP_NAME}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          {en.hero.title}
        </div>
        <div style={{ fontSize: 32, opacity: 0.85, maxWidth: 840 }}>{en.hero.trustNote}</div>
      </div>
    </div>,
    OG_SIZE,
  );
}
