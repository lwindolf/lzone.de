// vim: set ts=4 sw=4:

var cachePrefix = 'lzone';
var cacheVersion = 20250615;
var cacheName = cachePrefix + '-' + cacheVersion;
var filesToCache = [
  '/',
  '/css/main.css',
  '/css/feedreader.css',

  '/js/components/pinned-apps/js/PinnedApps.js',
  
  '/js/components/dns-checker/js/DnsChecker.js',
  '/js/components/dns-checker/js/settings.js',
  '/js/components/dns-checker/css/style.css',

  '/js/components/saas-multi-status/js/MultiStatus.js',
  '/js/components/saas-multi-status/js/MultiStatusCloud.js',
  '/js/components/saas-multi-status/js/MultiStatusSettings.js',
  '/js/components/saas-multi-status/js/settings.js',
  '/js/components/saas-multi-status/css/style.css',

  '/js/app.js',
  '/js/config.js',
  '/js/CLI.js',
  '/js/commands.js',
  '/js/search.js',

  '/js/helpers/debounce.js',
  '/js/helpers/render.js',
  '/js/helpers/events.js',

  '/js/models/CheatSheetCatalog.js',
  '/js/models/DB.js',
  '/js/models/GithubRepo.js',
  '/js/models/SearchIndex.js',
  '/js/models/Section.js',
  '/js/models/Settings.js',

  '/js/vendor/asciidoctor.min.js',
  '/js/vendor/handlebars.min.js',
  '/js/vendor/lunr.min.js',
  '/js/vendor/mermaid.esm.min.mjs',
  '/js/vendor/purify.es.mjs',
  '/js/vendor/rst2html.min.js',
  '/js/vendor/showdown.min.js',
  '/js/vendor/split.es.js',
  '/js/vendor/webamp.bundle.min.js',

  '/js/views/renderers/CheatSheet.js',
  '/js/views/renderers/Pdf.js',

  '/js/views/Catalog.js',
  '/js/views/Chat.js',
  '/js/views/Checks.js',
  '/js/views/Content.js',
  '/js/views/FeedReader.js',
  '/js/views/Feeds.js',
  '/js/views/Folder.js',
  '/js/views/Home.js',
  '/js/views/Sidebar.js'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache).then(() => {
        /* Cleanup deprecated cache versions */
        caches.keys().then((keyList) => {
          for(const k of keyList) {
            if(0 == k.indexOf(cachePrefix) && k !== cacheName) {
              console.log(`Dropping cache version ${k}`);
              caches.delete(k);
            }
          }
        });
      });
    })  
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', async (e) => {
  var pathname = new URL(e.request.url).pathname;
  /* cache all webapp files of the following types (to cache stuff like chunks/images) */
  if((new URL(e.request.url).host === location.host) &&
      pathname.match(/\.(mjs|js|css|svg|png|ico)$/)) {
    console.log("cache check for "+pathname);
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
    if (event.data === 'clearCache') {
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
