/*
 * 1) register sync event p137
 *    can be ran from page
 * 2) add event listener to SW listen for sync event
 *    sync even retries until it succeeds
 *
 *    accessing sync mgr differs depending on being called from SW or page p139
 *
 * 3) function that sync mgr calls is our fetch/put to update server db
 *
 *  example: https://ponyfoo.com/articles/backgroundsync
 */


/*
 * Check connection Status
 *  navigator.onLine only knows if the user can’t connect to a LAN or router -
 *  it doesn’t know if the the user can actually connect to the internet
 */
function isOnline () {
  var connectionStatus = document.getElementById('connectionStatus');
  if (navigator.onLine){
    connectionStatus.innerHTML = 'You are currently online!';
  } else {
    connectionStatus.innerHTML = `You are currently offline. Any requests made will be queued
                                  and synced as soon as you are connected again.`;
  }
}

window.addEventListener('online', isOnline);
window.addEventListener('offline', isOnline);
isOnline();


// register sync event
self.registration.sync.register(updateIsFavoriteAPI);

/*
 * add event listener to service worker to listen for sync event
 * if a rejected promise is returned to sync event, then browser will
 * queue the event to be tried again
 */
self.addEventListener("sync", function(event) {
  if(event.tag === "updateIsFavoriteAPI") {
    event.waitUntil(function() {
      var updated = DBHelper.updateIsFavoriteAPI();
      if (updated) {
        return Promise.resolve();
      } else {
        return Promise.reject();
      }
    });
  }
});

/*
  static updateIsFavoriteAPI(restaurantID, is_favorite) {
    let putURL = `${DBHelper.DATABASE_URL}/${restaurantID}/?is_favorite=${is_favorite}`;
    console.log(`updateIsFavoriteAPI: pre-fetch: ${putURL}`);
    fetch(putURL, {method: 'PUT'})
      .then(() => {
        console.log(`updateIsFavoriteAPI: PUT: restaurantID: ${restaurantID} : is_favorite: ${is_favorite}`);
        return true;
      })
      .catch(() => {
        console.log(`Ah crap, are we offline!?`);
        return false;
      });
  }
*/

/* ------------------------------------------------------------------------------------
 * index.js - this registers sw
 * ------------------------------------------------------------------------------------
 * commented code was 1st attempt - moved this to dbhelper.js
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

/* ------------------------------------------------------------------------------------
 * serviceworker.js
 * ------------------------------------------------------------------------------------
 * commented code was 1st attempt
 * new code trying to capture url info - does not appear to work
 * note, i'm trying to do this without an action queue
 */
/*
self.addEventListener("sync", function(event) {
  if(event.tag === "updateIsFavoriteAPI") {
    event.waitUntil( DBHelper.updateIsFavoriteAPI() );
  }
});
*/
self.addEventListener("sync", function(event) {
  if (event.tag.startsWith("favorite")) {
    event.waitUntil(function() {
      let restID = event.tag.slice(8);
      let putURL = `${DBHelper.DATABASE_URL}/${restID}`;
      console.log(`SW PUT: ${putURL}`);
      return fetch(putURL, {method: 'PUT'});
    });
  }
});


/* ------------------------------------------------------------------------------------
 * dbhelper.js
 * ------------------------------------------------------------------------------------
 *
 */
  /*
   * called from main.js: createIsFavoriteButton()
   * updates IDB first and then backend server
   *
   */
   static updateIsFavorite(restaurantID, is_favorite) {
    // update IDB first - working
    DBHelper.openIDB()
      .then(function(db) {
        let tx = db.transaction(dbRestaurantOBJECTSTORE, 'readwrite');
        let store = tx.objectStore(dbRestaurantOBJECTSTORE);
        store.get(restaurantID)
          .then(restaurant => {
            restaurant.is_favorite = is_favorite;
            store.put(restaurant);
          });
      });

    // update the server data...
    // note this event is registered as a sync event to handle
    // offline case - not working
    DBHelper.updateIsFavoriteAPI(restaurantID, is_favorite);
  }

  /*
   * event listener setup
   */
  static updateIsFavoriteAPI(restaurantID, is_favorite) {
    let putURL = `${DBHelper.DATABASE_URL}/${restaurantID}/?is_favorite=${is_favorite}`;

    navigator.serviceWorker.ready.then(function(registerSync) {
      registerSync.sync.register(`favorite/${restaurantID}/?is_favorite=${is_favorite}`);
    });
    console.log(`updateIsFavoriteAPI: pre-fetch: ${putURL}`);

    /* first attempt
    return new Promise(function(resolve, reject) {
      fetch(putURL, {method: 'PUT'})
      .then(() => {
        console.log(`updateIsFavoriteAPI: PUT: restaurantID: ${restaurantID} : is_favorite: ${is_favorite}`);
        resolve(true);
      })
      .catch((err) => {
        console.log(` PUT: restaurantID: ${restaurantID} : is_favorite: ${is_favorite} \n Fetch Error: ${err}`);
        reject(false);
      });
    });
    */
  }





