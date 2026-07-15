import type { MetadataRoute } from 'next';

import { APP_NAME } from '@shared/constants';
import en from '@/messages/en.json';

/** PWA web app manifest. Description reuses the canonical default-locale copy. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: en.metadata.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
