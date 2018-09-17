let restaurants,neighborhoods,cuisines,allIDs;var newMap,markers=[],apiKey=config.MapBoxKey;function createIsFavoriteButton(e,t){let a=document.createElement("button");return a.setAttribute("id",`isYourFavorite${e}`),a.setAttribute("title","My Favorite Restaurants!"),a.innerHTML="&#9829;","true"==(t=t.toString())?(a.setAttribute("class","isFavorite"),a.setAttribute("aria-pressed","true"),a.setAttribute("aria-label","mark this as not a favorite")):(a.setAttribute("class","isNotFavorite"),a.setAttribute("aria-pressed","false"),a.setAttribute("aria-label","mark this as a favorite")),a}document.addEventListener("DOMContentLoaded",e=>{window.initMap(),fetchNeighborhoods(),fetchCuisines()}),window.addEventListener("load",function(){function e(e){var t=navigator.onLine?"online":"offline";document.getElementById("offline").style.display="offline"===t?"block":"none"}window.addEventListener("online",e),window.addEventListener("offline",e)}),window.onload=function(){navigator.onLine&&DBHelper.moveLocalStorageToAPI()},fetchNeighborhoods=(()=>{DBHelper.fetchNeighborhoods((e,t)=>{e?console.error(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{const t=document.getElementById("neighborhoods-select");e.forEach(e=>{const a=document.createElement("option");a.innerHTML=e,a.label=e,a.value=e,t.append(a)})}),fetchCuisines=(()=>{DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{const t=document.getElementById("cuisines-select");e.forEach(e=>{const a=document.createElement("option");a.innerHTML=e,a.label=e,a.value=e,t.append(a)})}),initMap=(()=>{self.newMap=L.map("map",{center:[40.722216,-73.987501],zoom:12,scrollWheelZoom:!1}),L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token="+apiKey,{maxZoom:18,attribution:'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',id:"mapbox.streets"}).addTo(newMap),updateRestaurants()}),updateRestaurants=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),a=e.selectedIndex,s=t.selectedIndex,r=e[a].value,n=t[s].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(r,n,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML())})}),resetRestaurants=(e=>{self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers&&self.markers.forEach(e=>e.remove()),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e=self.restaurants)=>{const t=document.getElementById("restaurants-list");e.forEach(e=>{t.append(createRestaurantHTML(e))}),addMarkersToMap(),allRestaurantIDs=e.map(e=>e.id),DBHelper.getAndStoreAllReviews(allRestaurantIDs)}),createRestaurantHTML=(e=>{const t=document.createElement("li"),a=document.createElement("img");a.className="restaurant-img lazyload",a.src=defaultImgSRC(e),a.setAttribute("data-src",defaultImgSRC(e)),a.alt=`image of ${e.name}`,a.title=`You could be dining at ${e.name}`,t.append(a);const s=document.createElement("h1");s.innerHTML=e.name,t.append(s);const r=document.createElement("p");r.innerHTML=e.neighborhood,t.append(r);const n=document.createElement("p");n.innerHTML=e.address,t.append(n);const o=document.createElement("a");o.innerHTML="View Details",o.href=DBHelper.urlForRestaurant(e),t.append(o);const i=createIsFavoriteButton(e.id,e.is_favorite);return i.onclick=(()=>{"false"===i.getAttribute("aria-pressed")?(i.setAttribute("class","isFavorite"),i.setAttribute("aria-pressed","true"),i.setAttribute("aria-label","mark this as not a favorite")):(i.setAttribute("class","isNotFavorite"),i.setAttribute("aria-pressed","false"),i.setAttribute("aria-label","mark this as a favorite"));let t=!1;"boolean"==typeof e.is_favorite?t=!e.is_favorite:"string"==typeof e.is_favorite&&(t="false"==e.is_favorite),e.is_favorite=t,DBHelper.updateIsFavorite(e.id,e.is_favorite)}),t.append(i),t}),defaultImgSRC=(e=>{let t=DBHelper.imageUrlForRestaurant(e),a=t.indexOf(".jpg");return t=t.slice(0,a)+"_320px"+t.slice(a)}),addMarkersToMap=((e=self.restaurants)=>{e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.newMap);t.on("click",function(){window.location.href=t.options.url}),self.markers.push(t)})});