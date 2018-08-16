let restaurants,
  neighborhoods,
  cuisines;
var newMap;
var markers = [];
var apiKey = config.MapBoxKey;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  window.initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.label = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.label = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/*
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=' + apiKey, {
    // mapboxToken: apiKey,
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}


/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/*
 * Create restaurant HTML
 *
 * stage 3: added is favorites button
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img lazyload';

  // ORIGINAL
  // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  // this creates the default (smallest) image
  image.src = defaultImgSRC(restaurant);

  // setup for lazysizes
  image.setAttribute("data-src", defaultImgSRC(restaurant));

  // added for accessibility
  image.alt = `image of ${restaurant.name}`;
  image.title = `You could be dining at ${restaurant.name}`;
  // added for accessibility

  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  const isFavButton = createIsFavoriteButton(restaurant.id, restaurant.is_favorite);
  li.append(isFavButton);

  return li;
}

/*
 * creates the is favorite button
 */
function createIsFavoriteButton(restID, is_favorite) {
  let button = document.createElement("button");
  // make button id unique for aria accessibility
  button.setAttribute("id", `isYourFavorite${restID}`);
  button.setAttribute("title", "My Favorite Restaurants!");
  button.innerHTML = "&#9829;"; // &#9829; html entity = heart '❤'

  // test to make sure we are getting booleans
  // console.log(`restID ${restID} typeof is_favorite = ${typeof is_favorite}`);

  if( is_favorite ) {
    button.setAttribute("class", "isFavorite");
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", "mark this as not a favorite");
  } else {
    button.setAttribute("class", "isNotFavorite");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "mark this as a favorite");
  }

  button.onclick = () => {
      if (button.getAttribute('aria-pressed') === 'false') {
        button.setAttribute("class", "isFavorite");
        button.setAttribute("aria-pressed", "true");
        button.setAttribute("aria-label", "mark this as not a favorite");
      } else {
        button.setAttribute("class", "isNotFavorite");
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", "mark this as a favorite");
      }
      // alert(`pressed favorite state = ${button.getAttribute('aria-pressed')}`);
      DBHelper.updateIsFavorite(restID, !is_favorite);
    };
  return button;
}


/*
 * images stored in DB server as 1.jpg, 2.jpg, etc
 * DBHelper function returns /img/1.jpg
 * convert to the smallest default image size
 *
 * <img src="/img/1_320px.jpg"
 */
defaultImgSRC = (restaurant) => {
  let imgSRC = DBHelper.imageUrlForRestaurant(restaurant);
  let position = imgSRC.indexOf(".jpg");
  imgSRC = imgSRC.slice(0, position) + '_320px' + imgSRC.slice(position);
  // testing
  // console.log(`defaultImgSRC:imgSRC: ${imgSRC}`);
  return imgSRC;
}


/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}

