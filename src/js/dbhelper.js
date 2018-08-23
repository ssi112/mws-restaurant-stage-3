/*
 * Common database helper functions.
 * curl "http://localhost:1337/restaurants"
 * curl "http://localhost:1337/restaurants/{3}"
 *
 * Relies on Jake Archibald's IndexedDB Promise library
 * https://github.com/jakearchibald/idb
 * found in js/idb.js
 *
 */

/*
if (typeof idb === "undefined") {
  self.importScripts('js/idb.js');
}
*/

/*
 * filled by call to getNeighborhoodsCuisinesSelect
 * used in select lists to filter restaurants
 */
var restaurantCuisines;
var restaurantNeighborhoods;

/*
 * holds all the restaurants
 */
var allRestaurants;

const dbVERSION = 1;
const dbNAME = 'restaurant_reviews';
const dbRestaurantOBJECTSTORE = 'restaurants';
const dbReviewsOBJECTSTORE = 'reviews';

// port for Sails dev server
const PORT = 1337;

class DBHelper {
  // Database URL.
  static get DATABASE_URL() {
    // const port = 1337 // Change this to your server port
    return `http://localhost:${PORT}/restaurants`;
  }

  static get DATABASE_REVIEWS_URL() {
    // will need the restaurant id appended to make it work
    return `http://localhost:${PORT}/reviews/?restaurant_id=`;
  }

  /*
   * open indexedDB and upgrade if needed
   */
  static openIDB() {
    // Does the browser support service worker?
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    // make sure IndexdDB is supported
    if (!self.indexedDB) {
      reject("Uh oh, IndexedDB is NOT supported in this browser!");
    }
    return idb.open(dbNAME, dbVERSION, function(upgradeDb) {
      switch (dbVERSION) {
        case 0:
        case 1: { // stage 2
          var restStore = upgradeDb.createObjectStore(dbRestaurantOBJECTSTORE, { keyPath: 'id' });
          restStore.createIndex('restID', 'id');
        }
        case 2: { // stage 3
          var reviewStore = upgradeDb.createObjectStore(dbReviewsOBJECTSTORE, { keyPath: 'id' });
          reviewStore.createIndex('reviewID', 'id');
          reviewStore.createIndex('restID', 'restaurant_id');
        }
      } // switch
    });
  }

  /*
   * takes the restaurangt data from the API and stores it in IDB
   */
  static storeAllInIDB(data) {
    return DBHelper.openIDB().then(function(db) {
      if(!db) return;

      var tx = db.transaction(dbRestaurantOBJECTSTORE, 'readwrite');
      var store = tx.objectStore(dbRestaurantOBJECTSTORE);
      data.forEach(function(restaurant) {
        store.put(restaurant);
      });
      return tx.complete;
    });
  }

  /*
   * fetches restaurant data from API and sends it to be stored in IDB
   */
  static getFromAPIsaveToIDB() {
    return fetch(DBHelper.DATABASE_URL)
      .then(function(response){
        return response.json();
    }).then(restaurants => {
      DBHelper.storeAllInIDB(restaurants);
      return restaurants;
    });
  }

  /*
   * gets all the retaurant data from IDB
   */
  static getAllFromIDB() {
    return DBHelper.openIDB().then(function(db){
      if(!db) return;
      var store = db.transaction(dbRestaurantOBJECTSTORE).objectStore(dbRestaurantOBJECTSTORE);
      // console.log(store); // testing
      return store.getAll();
    });
  }


  /*
   * Filters the neighborhoods and cuisines that are used in the
   * select lists on main page
   */
  static getNeighborhoodsCuisinesSelect(restaurants) {
    // Get the neighborhoods from restaurants
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);

    // filter the neighborhoods
    restaurantNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

    // Get cuisines from restaurant data
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);

    // filter the cuisines - only unique
    restaurantCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);

    // store all the restaurants for reuse if needed
    allRestaurants = restaurants;
  }


  /*
   * Fetch all restaurants either from IDB or API
   * then update vars that hold
   * cuisines and neighborhoods
   */
  static fetchRestaurants(callback) {
    return DBHelper.getAllFromIDB().then(restaurants => {
      if(restaurants.length) {
        return Promise.resolve(restaurants);
      } else {
        return DBHelper.getFromAPIsaveToIDB();
      }
    })
    .then(restaurants=> {
      DBHelper.getNeighborhoodsCuisinesSelect(restaurants);
      callback(null, restaurants);
    })
    .catch(error => {
      callback(error, null);
    })
  }

  /*
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else {
          callback(`Restaurant with ID=${id} does not exist`, null);
        }
      }
    });
  }


  /*
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /*
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    if (restaurantNeighborhoods) {
      // data already fetched, so just return it
      callback(null, restaurantNeighborhoods);
      return;
    }

    // Fetch all restaurants in order to prefill restaurantNeighborhoods
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, restaurantNeighborhoods);
      }
    });
  }

  /*
   * Fetch all cuisines in order to prefill restaurantCuisines
   */
    static fetchCuisines(callback) {
    if (restaurantCuisines) {
      // data already fetched, so just return it
      callback(null, restaurantCuisines);
      return;
    }

    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, restaurantCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /*
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // in case record has no photograph property
    if (restaurant.photograph) {
      return (`/img/${restaurant.photograph}.jpg`);
    } else {
      // default image if missing
      return ('/img/default-annie-spratt.jpg');
      // alternative is to use id - if image exists
      // return (`/img/${restaurant.id}.jpg`);
    }
  }

  /*
   * called from main.js: createIsFavoriteButton()
   * updates IDB first and then backend server
   *
   */
   static updateIsFavorite(restaurantID, is_favorite) {
    // update IDB first
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
    DBHelper.updateIsFavoriteAPI(restaurantID, is_favorite);
  }


  /*
   * event listener setup in service worker to catch offline cases
   */
  static updateIsFavoriteAPI(restaurantID, is_favorite) {
    let putURL = `${DBHelper.DATABASE_URL}/${restaurantID}/?is_favorite=${is_favorite}`;
    console.log(`updateIsFavoriteAPI: pre-fetch: ${putURL}`);

    /* */
    return new Promise(function(resolve, reject) {
      fetch(putURL, {method: 'PUT'})
      .then(() => {
        console.log(`updateIsFavoriteAPI: PUT: restaurantID: ${restaurantID} : is_favorite: ${is_favorite}`);
        resolve(true);
      })
      .catch((err) => {
        console.log(` PUT: restaurantID: ${restaurantID} : is_favorite: ${is_favorite} \n Fetch Error: ${err}`);
        // most likely offline, in any case put in local storage for later update
        DBHelper.storeFavoriteTillOnline(restaurantID, putURL);
        // reject(false);
      });
    });
    /* */
  }

  /*
   * store the put url in local storage - update when back online
   */
  static storeFavoriteTillOnline(restaurantID, putURL) {
    console.log(`storeFavoriteTillOnline: ${putURL}`);
    localStorage.setItem(restaurantID, putURL);
    // add event listener for back online to try again
    window.addEventListener('online', event => {
      console.log('online event, yay!');
      let favURL = "";
      // get from local storage and update API
      Object.keys(localStorage).forEach( key => {
        favURL = localStorage.getItem(key);
        console.log(favURL);
        fetch(favURL, {method: 'PUT'});
      });
      // remove items from local storage
      Object.keys(localStorage).forEach( key => {
        localStorage.removeItem(key);
      });
    });
  }


  /* Used for Mapbox / Leaflet */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

  /* ----------------------------------------------------------------------
   *
   * !!!!! PRELIMINARY WORK TO GET REVIEWS INTO IDB AND BEYOND !!!!!
   *
   * allRestaurantIDs - array of rest IDs
   * ----------------------------------------------------------------------
   */
   static getAndStoreAllReviews(allRestaurantIDs) {
    allRestaurantIDs.forEach( id => {
      DBHelper.getReviewsFromAPIsaveToIDB(id);
    });
   }


  /*
   * fetches restaurant review data from API and stores it in IDB
   */
  static getReviewsFromAPIsaveToIDB(id) {
    let reviewURL = `${DBHelper.DATABASE_REVIEWS_URL}${id}`;
    return fetch(reviewURL)
      .then(function(response){
        return response.json();
    }).then(reviews => {
      DBHelper.storeAllReviewsInIDB(reviews);
      return reviews;
    });
  }


  /*
   * takes the restaurant data from the API and stores it in IDB
   */
  static storeAllReviewsInIDB(reviewData) {
    return DBHelper.openIDB().then(function(db) {
      if(!db) return;

      var tx = db.transaction(dbReviewsOBJECTSTORE, 'readwrite');
      var store = tx.objectStore(dbReviewsOBJECTSTORE);
      reviewData.forEach(function(review) {
        store.put(review);
      });
      return tx.complete;
    });
  }


  /* -----------------------------------------------------------------------
   * get a restaurant's reviews by ID
   * get 1st from IDB, if no data then try to get it from API
   *
   * called from restaurant_info.js -> fillRestaurantHTML()
   *
   */
  static getRestaurantReviewsById(id, callback) {
    DBHelper.getReviewFromIDB(id)
      .then(restReviews => {
        console.log(restReviews);
      });

    let getURL = DBHelper.DATABASE_REVIEWS_URL + id;
    // console.log(`getURL = ${getURL}`);

    fetch(getURL).then(response => {
      // if (!response.clone().ok && !response.clone().redirected) {
      if (!response.ok) {
        console.log(`Problem retrieving reviews: ${response.statusText}`);
      }
      response.json()
        .then(reviews => {
          callback(null, reviews);
        })
    }).catch(error => callback(error, null));
  }


  /*
   * gets all review data from IDB for given restaurant
   */
  static getReviewFromIDB(restaurant_id) {
    return DBHelper.openIDB().then(function(db){
      if(!db) return null;
      var store = db.transaction(dbReviewsOBJECTSTORE)
                    .objectStore(dbReviewsOBJECTSTORE);
      // console.log(store); // testing
      let restIDIdx = store.index('restID');
      return restIDIdx.getAll(restaurant_id);
    });
  }

} // end class DBHelper
self.DBHelper = DBHelper;
