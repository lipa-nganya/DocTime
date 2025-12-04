#!/usr/bin/env node

/**
 * Post-build script to generate PWA manifest.json and service worker
 * This runs after `expo export` to add PWA support
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found. Run "npm run build:web" first.');
  process.exit(1);
}

// Create manifest.json
const manifest = {
  name: 'Doc Time',
  short_name: 'DocTime',
  description: 'Medical case management app for doctors',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#4ECDC4',
  background_color: '#F8F9FA',
  icons: [
    {
      src: '/favicon.ico',
      sizes: '64x64 32x32 24x24 16x16',
      type: 'image/x-icon'
    },
    {
      src: '/assets/icon.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/assets/icon.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    }
  ]
};

// Write manifest.json
const manifestPath = path.join(distDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ Created manifest.json');

// Create service worker with timestamp-based cache version
const cacheVersion = `doctime-v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create service worker
const serviceWorker = `// Doc Time PWA Service Worker
const CACHE_NAME = '${cacheVersion}';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache resources individually to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn('Failed to cache:', url, err);
              return null;
            });
          })
        );
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
        // Continue even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete ALL old caches to force fresh load
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => {
      console.log('All caches cleared, claiming clients');
      // Unregister this service worker and reload all clients
      return Promise.all([
        self.registration.unregister().catch(() => {}),
        self.clients.claim(),
        // Send message to all clients to reload
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'FORCE_RELOAD' });
          });
        })
      ]);
    })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Don't cache API requests (PUT, POST, DELETE, PATCH) or non-GET requests
  const method = event.request.method;
  if (method !== 'GET') {
    // Let all non-GET requests pass through without caching
    return;
  }
  
  // Always fetch HTML files from network first (to get latest bundle references)
  if (event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful GET responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  } else {
    // For other resources, try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request).then((response) => {
            // Only cache successful GET responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }
});
`;

// Write service worker
const swPath = path.join(distDir, 'service-worker.js');
fs.writeFileSync(swPath, serviceWorker);
console.log('✅ Created service-worker.js');

// Update index.html to include manifest and service worker
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Add manifest link if not present
  if (!html.includes('manifest.json')) {
    html = html.replace(
      '<link rel="icon" href="/favicon.ico" />',
      '<link rel="icon" href="/favicon.ico" />\n    <link rel="manifest" href="/manifest.json" />'
    );
  }
  
  // Add service worker registration script if not present
  if (!html.includes('service-worker.js')) {
    const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  </script>`;
    html = html.replace('</body>', `${swScript}\n</body>`);
  }
  
  fs.writeFileSync(indexPath, html);
  console.log('✅ Updated index.html with PWA links');
} else {
  console.warn('⚠️  index.html not found, skipping update');
}

// Copy icon to dist if it doesn't exist
const iconDest = path.join(distDir, 'assets', 'icon.png');
const iconSrc = path.join(assetsDir, 'icon.png');
if (fs.existsSync(iconSrc)) {
  const assetsDistDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDistDir)) {
    fs.mkdirSync(assetsDistDir, { recursive: true });
  }
  if (!fs.existsSync(iconDest)) {
    fs.copyFileSync(iconSrc, iconDest);
    console.log('✅ Copied icon.png to dist/assets/');
  }
}

console.log('✅ PWA files generated successfully!');
console.log('📦 Ready to deploy from:', distDir);

