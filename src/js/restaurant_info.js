let restaurant;
var newMap;
var apiKey = config.MapBoxKey;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  window.initMap();
});

window.addEventListener('load', function() {
  function updateOnlineStatus(event) {
    var condition = navigator.onLine ? "online" : "offline";
    // turn on/off the offline message
    if (condition === "offline") {
      document.getElementById("offline").style.display = "block";
    } else {
      document.getElementById("offline").style.display = "none";
    }
  }
  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

window.onload = function() {
  // check if anything is in local storage waiting to update
  if (navigator.onLine) {
    DBHelper.moveLocalStorageToAPI();
  }
}

/*
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=' + apiKey, {
        // mapboxToken: '<your MAPBOX API KEY HERE>',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery � <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img lazyload';

  // ORIGINAL
  // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  // this creates the default (smallest) image
  image.src = responsiveImgSRC(restaurant);

  // test for lazysizes
  image.setAttribute("data-src", responsiveImgSRC(restaurant));

  // this creates the srcset in the HTML so browser
  // can decide which image to request
  image.srcset = responsiveImgSRCSET(restaurant);


  // added for accessibility
  image.alt = `image of ${restaurant.name}`;
  image.title= `You could be dining at ${restaurant.name}`;
  //

  let figure_caption = document.getElementById('figure-caption');
  figure_caption.innerHTML = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fill reviews (new method for stage 3)
  DBHelper.getRestaurantReviewsById(restaurant.id, fillReviewsHTML);
}


/* ----------------------------------------------------------------------
 * images stored in DB server as 1.jpg, 2.jpg, etc
 * DBHelper function returns /img/1.jpg
 * convert to the smallest default image size
 *
 * <img src="/img/1_320px.jpg"
 */
responsiveImgSRC = (restaurant) => {
  let imgSRC = DBHelper.imageUrlForRestaurant(restaurant);
  let position = imgSRC.indexOf(".jpg");
  imgSRC = imgSRC.slice(0, position) + '_320px' + imgSRC.slice(position);
  // testing
  // console.log(`responsiveImgSRC:imgSRC: ${imgSRC}`);
  return imgSRC;
}

/* ----------------------------------------------------------------------
 * build string for responsive images
 *
 *   srcset="/img/1_320px.jpg 320w,    // smallest image available
 *           /img/1_480px.jpg 480w,    // medium image size
 *           /img/1.jpg 800w"          // largest image
 */
responsiveImgSRCSET = (restaurant) => {
  let imgSRC = DBHelper.imageUrlForRestaurant(restaurant);
  let dot = imgSRC.lastIndexOf('.');
  let imgSRCSET = `${imgSRC.slice(0, dot)}_320px.jpg 320w,`;
  imgSRCSET += `\n ${imgSRC.slice(0, dot)}_480px.jpg 480w,`;
  imgSRCSET += `\n ${imgSRC.slice(0, dot)}.jpg 800w`;
  // console.log(`[${imgSRCSET}]`);
  return imgSRCSET;
}


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/* ----------------------------------------------------------------------
 * Create all reviews HTML and add them to the webpage
 *  added descending sort to display reviews
 * called by fillRestaurantHTML
 */
fillReviewsHTML = (error, reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  // get the restaurant id in order to get the reviews
  // let restID = self.restaurant.id;
  // let reviews = DBHelper.getRestaurantReviewsById(restID);
  // console.log(`restaurant-info.js:fillReviewsHTML: \n ${reviews}`);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = `No reviews yet for restaurant with ID = ${self.restaurant.id}`;
    container.appendChild(noReviews);
    return;
  }

  // sort by descending date
  // see here for explanation on sorting objects:
  //    https://davidwalsh.name/array-sort
  // see also this for sort info
  //    https://www.w3schools.com/js/js_array_sort.asp
  reviews.sort(function(obj1, obj2) {
    // put dates in a consistent format
    obj2.updateDate = new Date(obj2.updatedAt);
    obj1.updateDate = new Date(obj1.updatedAt);
    // reversing objects will put them in ascending order
    return obj2.updateDate - obj1.updateDate;
  });

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const div = document.createElement('div');
  li.appendChild(div);

  const reviewer_name = document.createElement('h2');
  reviewer_name.className = 'align-left';
  reviewer_name.innerHTML = review.name;
  div.appendChild(reviewer_name);

  const review_date = document.createElement('h2');
  review_date.className = 'align-right';
  review_date.innerHTML = convertTimeStamp(review.updatedAt);
  div.appendChild(review_date);

  const br = document.createElement('br');
  br.className = 'clear-both';
  div.appendChild(br);

  const rating = document.createElement('p');
  rating.className = 'rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'rating-comments';
  comments.innerHTML = review.comments;
  li.appendChild(comments);
  return li;
}


/* ----------------------------------------------------------------------
 * takes the review just created and updates this page
 * puts the new review 1st
 * reviews-container is a section id
 * reviews-list is a ul
 * createReviewHTML returns a li to be appended as first child
 */
addNewReviewToPage = (newReviewObj) => {
  let reviewContainer = document.getElementById("reviews-container");
  let reviewList = document.getElementById("reviews-list");
  // insert the new node (newReviewObj) before the reference node (1st child)
  reviewList.insertBefore(createReviewHTML(newReviewObj), reviewList.firstChild);
}


/* ----------------------------------------------------------------------
 * convert timestamp for date display
 * refer to https://www.w3schools.com/jsref/jsref_obj_date.asp
 * only returns the date string
 *
 * simpler solution but not much formatting:
 * console.log(new Date(1504095567183).toLocaleDateString());
 */
function convertTimeStamp(TimeStamp) {
  let monthsLong = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
  // convert unix to milliseconds: unixTimeStamp * 1000
  let jsDate = new Date(TimeStamp);
  let month = jsDate.getMonth();  // 0 to 11
  let dayOfWeek = jsDate.getDay(); // 0 to 6
  let dayOfMonth = jsDate.getDate(); // 1 to 31
  let year = jsDate.getFullYear();
  return `${monthsLong[month]} ${dayOfMonth}, ${year}`;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = ` / ${restaurant.name}`;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


/* ----------------------------------------------------------------------------
 * code to handle user form input for their own reviews
 *
 *  showReviewForm - hide or display the form
 *  checkReviewForm - calls for form validation and creates the JSON object
 *  validateForm - simple validation of user input
 *    checkRange - checks input for a range of values
 *  clearForm - resets the form
 *    clearErrorMessages - ensures error messages are cleared
 *  characterCount - tracks character count of user input and displays it
 *                   to users so they know how much text they can enter
 */
function showReviewForm(showORhide) {
  let displayed = showORhide ? "block" : "none";
  // display the form
  document.getElementById("review_form").style.display=displayed;
  document.getElementById("name").focus();  // put focus on name field
}


function checkReviewForm() {
  let formData = document.forms.review_form;
  if (validateForm(formData)) {
    let uname = formData.name.value;
    let urating = formData.rating.value;
    let comments = formData.comments.value;
    restaurant = self.restaurant;
    let cuDate = new Date();
    let obj = {'restaurant_id': restaurant.id,
               'name': uname,
               'rating': parseInt(urating, 10),
               'comments': comments,
               'createdAt': cuDate,
               'updatedAt': cuDate };
    // store the review in API & IDB or local storage if offline
    DBHelper.putReviewInAPI(obj);
    clearForm();  // reset the input form
    showReviewForm(false);  // hide it
    addNewReviewToPage(obj);  // add the review to this page
  }
}


function validateForm(formData) {
  let errors = 0;
  let labelNameError = document.getElementById("nameError");
  let labelRatingError = document.getElementById("ratingError");
  let labelReviewError = document.getElementById("reviewError");

  if(formData.name.value.trim() == "") {
    labelNameError.innerHTML = "Please enter your name!";
    ++errors;
  } else {
    labelNameError.innerHTML = "";
  }
  if(!checkRange(formData.rating.value, 1, 5)) {
    labelRatingError.innerHTML = "Oops! Invalid rating";
    ++errors;
  } else {
    labelRatingError.innerHTML = "";
  }
  if(formData.comments.value.trim() == "") {
    labelReviewError.innerHTML = "Please enter comments!";
    ++errors;
  } else {
    labelReviewError.innerHTML = "";
  }
  if (!errors)
    return true
  else
    return false;
}

/* ----------------------------------------------------------------------
 * converts string to an int then checks if for a range of value
 * adapted from solution found on stack overflow
 * https://stackoverflow.com/questions/12063070/javascript-validate-numeric-only-and-within-range
 */
function checkRange(str, min, max) {
  num = parseInt(str, 10);
  return (!isNaN(num) && num >= min && num <= max);
}

function clearForm() {
  document.forms.review_form.reset();
  // any error labels set at this point remain if not cleared
  clearErrorMessages();
}

function clearErrorMessages() {
  let labelNameError = document.getElementById("nameError");
  let labelRatingError = document.getElementById("ratingError");
  let labelReviewError = document.getElementById("reviewError");
  labelNameError.innerHTML = "";
  labelReviewError.innerHTML = "";
  labelReviewError.innerHTML = "";
}

/* ----------------------------------------------------------------------
 * similar solution found at
 * https://stackoverflow.com/questions/9767521/count-and-display-number-of-characters-in-a-textbox-using-javascript
 */
function characterCount() {
  let reviewElement = document.getElementById("comments");
  let maxChars = reviewElement.getAttribute("maxlength");
  if (!maxChars) maxChars = 512;  // default if not set
  let numChars = reviewElement.value.length;
  let charsRemaining = maxChars - numChars;
  document.getElementById("charCountMsg").innerHTML = `Characters remaining: ${charsRemaining}`;
}
