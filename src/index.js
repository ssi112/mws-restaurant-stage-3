/*
 * index.js
 */

// register our service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/serviceworker.js")
    .then(function(registration) {
      console.log("Service Worker registered with scope: ", registration.scope);
    }).catch(function(err) {
      console.log("Service Worker registration failed: ", err);
    });
}


// register sync event
/*
navigator.serviceWorker.ready.then(function(registerSync) {
  return registerSync.sync.register("updateIsFavoriteAPI");
});
*/
