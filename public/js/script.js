const socket = io();  

let username = prompt("Enter your name:");
if (!username) username = "Anonymous";

// map init
const map = L.map("map").setView([20.5937, 78.9629], 5);

// Tiles
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Developed by Akriti Singh",
}).addTo(map);

// Store markers
const markers = {};
const paths = {};
let searchMarker = null;
let isFirst = true;

// live location tracking

if(navigator.geolocation){
  navigator.geolocation.watchPosition(
    (position)=>{
    // console.log("LOCATION:", position);
    const {latitude, longitude } = position.coords;
    socket.emit("send location", {latitude, longitude, username}); 
   },
  //  (error) => {
  //   console.error("GEO ERROR:", error);
  //   },
  (err) => console.error(err), 
   {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 10000,
   }
 ); 

} 

// const map = L.map("map").setView([0, 0], 10); 

// L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",  {
//     attribution: "developed by Akriti Singh"
// }).addTo(map);

// const markers = {} ;

// let isFirstUpdate = true;

// receive live location
// socket.on("receive-location", (data) => {
//    const {id, latitude, longitude, } = data;
//   if (isFirst) {
//     map.setView([latitude, longitude], 15);
//     isFirst = false;
//   }

//    //  map.setView([latitude, longitude]);
//    if(markers[id]){
//     markers[id].setLatLng([latitude, longitude]);
//    } else{
//     markers[id] = L.marker([latitude, longitude]).addTo(map);
//    }   
//  });

socket.on("receive-location", (data) => {
  const { id, latitude, longitude, username } = data;

  const latlng = [latitude, longitude];

  // first time center
  if (isFirst) {
    map.setView(latlng, 15);
    isFirst = false;
  }

  // marker logic with name
  if (markers[id]) {
    markers[id]
      .setLatLng(latlng)
      .setPopupContent(`<b>${username}</b>`);
  } else {
    markers[id] = L.marker(latlng)
      .addTo(map)
      .bindPopup(`<b>${username}</b>`);
  }

  //  path logic
  if (!paths[id]) {
    paths[id] = L.polyline([latlng], { color: "blue" }).addTo(map);
  } else {
    paths[id].addLatLng(latlng);
  }
});

//  remove marker
//  socket.on("user-disconnected", (id) => {
//   if(markers[id]){
//     map.removeLayer(markers[id]);
//     delete markers[id];
//   }
//  }); 

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }

  if (paths[id]) {
    map.removeLayer(paths[id]);
    delete paths[id];
  }
});

//  search feature
document.getElementById("search").addEventListener("input", function (e) {
  const query = e.target.value.trim();
  if (query.length < 3) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) return;

      const place = data[0];
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);

      map.setView([lat, lon], 14);

      // remove old search marker
      if (searchMarker) {
        map.removeLayer(searchMarker);
      }

      // add new marker
      searchMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${place.display_name}</b>`)
        .openPopup();
    });
});