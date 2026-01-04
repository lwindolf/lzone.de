// vim: set ts=4 sw=4:

var cachePrefix = 'lzone';
var cacheVersion = 20260104;
var cacheName = cachePrefix + '-' + cacheVersion;
var filesToCache = [
    '/',
    '/css/main.css',
    '/css/feedreader.css',

    '/js/components/badge-checker/css/style.css',
    '/js/components/dns-checker/css/style.css',

    '/js/config.js',
    '/js/bundle-main.js',
    '/js/bundle-components.js',

    '/js/vendor/handlebars.min.js',
    '/js/vendor/lunr.min.js',
    '/js/vendor/purify.es.mjs',
    '/js/vendor/showdown.min.js',
    '/js/vendor/split.es.js'
];

self.addEventListener('install', async (e) => {
    console.log('Install');

    e.waitUntil(async () => {
        const cache = await caches.open(cacheName);
        for (const file of filesToCache) {
            await cache.add(file);
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage('log [worker] Cached ' + file);
                });
            });
        }
    });
});

self.addEventListener('activate', async (e) => {
    console.log("Activate version " + cacheVersion);

    e.waitUntil(async () => {
        /* Cleanup deprecated cache versions */
        const keyList = await caches.keys();
        for (const k of keyList) {
            if (0 == k.indexOf(cachePrefix) && k !== cacheName) {
                console.log(`Dropping cache version ${k}`);
                await caches.delete(k);
            }
        }
    });
});

/* Serve cached content when offline */
self.addEventListener('fetch', async (e) => {
    var pathname = new URL(e.request.url).pathname;
    /* cache all webapp files of the following types (to cache stuff like chunks/images) */
    if ((new URL(e.request.url).host === location.host) &&
        pathname.match(/\.(mjs|js|css|svg|png|ico|json|xml)$/)) {
        e.respondWith(caches.open(cacheName).then((cache) => {
            return cache.match(e.request).then((cachedResponse) => {
                return cachedResponse || fetch(e.request.url).then((fetchedResponse) => {
                    cache.put(e.request, fetchedResponse.clone());
                    return fetchedResponse;
                });
            });
        }));
    } else {
        return;
    }
});

self.addEventListener('message', (event) => {
    console.log('Worker received message:', event);
    if (event.data === 'version') {
        console.log('Worker cache version requested:', cacheVersion);
        event.ports[0].postMessage(cacheVersion);
    }
    if (event.data === 'clearCache') {
        console.log('Worker clearing cache as requested');
        caches.keys().then((keyList) => {
            keyList.forEach((key) => {
                if (key.startsWith(cachePrefix)) {
                    console.log(`Clearing cache: ${key}`);
                    caches.delete(key);
                }
            });
        });
    }
});