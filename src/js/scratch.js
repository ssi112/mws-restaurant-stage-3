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

// -------------------------------
/*
GET Endpoints

Get all restaurants

http://localhost:1337/restaurants/

Get favorite restaurants

http://localhost:1337/restaurants/?is_favorite=true

Get a restaurant by id

http://localhost:1337/restaurants/<restaurant_id>

Get all reviews for a restaurant

http://localhost:1337/reviews/?restaurant_id=<restaurant_id>

Get all restaurant reviews

http://localhost:1337/reviews/

Get a restaurant review by id

http://localhost:1337/reviews/<review_id>


// -------------------------------
POST Endpoints

Create a new restaurant review

http://localhost:1337/reviews/

Parameters

{
    "restaurant_id": <restaurant_id>,
    "name": <reviewer_name>,
    "rating": <rating>,
    "comments": <comment_text>
}

// -------------------------------
PUT Endpoints

Favorite a restaurant

http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=true

Unfavorite a restaurant

http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=false

Update a restaurant review

http://localhost:1337/reviews/<review_id>

Parameters

{
    "name": <reviewer_name>,
    "rating": <rating>,
    "comments": <comment_text>
}

DELETE Endpoints
Delete a restaurant review

http://localhost:1337/reviews/<review_id>
*/

const element = document.getElementById('div');

if (element.getAttribute('listener') !== 'true') {
     element.addEventListener('click', function (e) {
         const elementClicked = e.target;
         elementClicked.setAttribute('listener', 'true');
         console.log('event has been attached');
    });
}

// works in Chrome not FireFox
// getEventListeners(window);

// get review data loaded into IDB

// call from main.js -> fillRestaurantsHTML()
// line 136
restaurants = self.restaurants;

// loop over restaurants in memory
// fetch the reviews for each one
// put into IDB
restaurants.forEach(restaurant => {
  console.log(restaurant.id);
});


for(let i = 0; i < allRestaurants.length; i++) {
  console.log(allRestaurants[i].id);
}

/* ------------------------------------------------------------------------
 * TESTING: REVIEWS_IDB
 *
 * ONLINE:
 *  All working - no errors or warnings
 *  CSS
 *    restaurant_info.js - adjust review headings and ratings for smaller
 *    displays sizes
 *
 * Some info messages displaying - can hide them
 *  updateIsFavoriteAPI
 *  DBHelper.getReviewFromIDB(id)=2
 *
 * OFFLINE:
 *  All working - some expected errors/warning displayed
 *    Get: net::ERR_INTERNET_DISCONNECTED
 *
 *    Leaflet - maps are not cached (could do this, but not required)
 *
 *    Catch the following and display message *** DONE ***
 *    Uncaught in promise Type: Failed to fetch
 *      getReviewsFromAPIsaveToIDB
 *
 *    is_favorites
 *      online/offline only works if you stay on the page
 *      turn offline
 *      toggle favorite switch
 *      navigate to details page
 *      return to main page
 *      turn online - EVENT NEVER FIRES
 *      data sits in local storage

      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          may want to rework this
          navigator.onLine
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    storeFavoriteTillOnline() *** DONE ***
      moved local storage code to it's own function
      can call it independently

   ------------------------------------------------------------------------ */

