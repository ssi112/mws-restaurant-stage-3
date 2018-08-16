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

