// vim: set ts=4 sw=4:
/*jshint esversion: 8 */

var homeRepo = 'https://raw.githubusercontent.com/lwindolf/'
var cachePrefix = 'lzone-cheat-sheets';
var cacheVersion = 20250502;
var cacheName = cachePrefix + '-' + cacheVersion;
var filesToCache = [
  '/',
  '/css/glightbox.min.css',
  '/css/main.css',

  '/js/components/check-info/js/CheckInfo.js',

  '/js/components/dns-checker/js/DnsChecker.js',
  '/js/components/dns-checker/js/settings.js',
  '/js/components/dns-checker/css/style.css',

  '/js/components/saas-multi-status/js/MultiStatus.js',
  '/js/components/saas-multi-status/js/MultiStatusCloud.js',
  '/js/components/saas-multi-status/js/MultiStatusSettings.js',
  '/js/components/saas-multi-status/js/settings.js',
  '/js/components/saas-multi-status/css/style.css',

  '/js/app.js',
  '/js/cheat-sheet-installer.js',
  '/js/cheat-sheet-renderer.js',
  '/js/CLI.js',
  '/js/commands.js',
  '/js/content-view.js',
  '/js/doctree.js',
  '/js/github-repo.js',
  '/js/runbook.js',
  '/js/search-index.js',
  '/js/search.js',
  '/js/section.js',
  '/js/settings.js',
  '/js/sidebar.js',
  '/js/helpers/debounce.js',
  '/js/helpers/render.js',
  '/js/vendor/asciidoctor.min.js',
  '/js/vendor/glightbox.min.js',
  '/js/vendor/handlebars.min.js',
  '/js/vendor/lunr.min.js',
  '/js/vendor/mermaid.min.js',
  '/js/vendor/purify.es.js',
  '/js/vendor/rst2html.min.js',
  '/js/vendor/showdown.min.js',
  '/js/views/Chat.js',
  '/js/views/CheatSheet.js',
  '/js/views/Checks.js',
  '/js/views/Home.js',
  '/js/views/LWindolf.js',
  '/js/views/Settings.js'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache).then(() => {
        /* Cleanup deprecated cache versions */
        caches.keys().then((keyList) => {
          for(k of keyList) {
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
  /* cache all webapp files and stuff from our github home repo */
  if(e.request.url.startsWith(homeRepo) ||
     (0 == e.request.url.indexOf(location.origin) &&
      pathname.match(/\.(html|js|css|svg|json)$/))) {
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
