const FILES_TO_CACHE = [
  "/",
  "index.html",
  "styles.css",
  "index.js",
  "indexedDb.js",
  "manifest.webmanifest",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// 1. install
self.addEventListener("install", function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {//"static-cache-v2"
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);//static content
    })
  );
  //forces the waiting service worker to become the active service worker - reloads the service worker
  self.skipWaiting();
});

//2. Clean Up / activate - Clear the CACHE of all items not matching in CACHE_NAME (old CACHE)
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {//"static-cache-v2"
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Tells our new service worker to take over.
  self.clients.claim();
});

// fetch / Set new Cache Key - //"data-cache-v1"
self.addEventListener("fetch", function(evt) {
  // cache successful requests to the API
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {//"data-cache-v1" - to CACHE data from API calls
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  // if the request is not for the API, serve static assets using "offline-first" approach.
  // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
  evt.respondWith(
    caches.match(evt.request).then(function(response) {
      return response || fetch(evt.request);
    })
  );
});