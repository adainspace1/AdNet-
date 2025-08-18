// Preloader
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('preloader').style.display = 'none';
      document.getElementById('mainContent').classList.remove('hidden');
    }, 500);
  }, 2000);
});

let map;
let driverMarker;
let requestMarkers = [];
let routeLayer; // for directions polyline
let currentCoords = null; // store user’s live location

function initMap() {
  // Initialize map
  map = L.map('map').setView([9.0820, 8.6753], 6);

  // Base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Try locating immediately
  map.locate({ setView: true, maxZoom: 16, watch: true });

  // When location is found
  map.on("locationfound", function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    currentCoords = [lat, lng]; // save live coords

    if (!driverMarker) {
      driverMarker = L.marker([lat, lng], { 
        icon: L.icon({
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          iconSize: [32, 32]
        })
      }).addTo(map).bindPopup("You are here").openPopup();
    } else {
      driverMarker.setLatLng([lat, lng]); // update marker position
    }
  });

  // Custom "Locate Me" button
  const locateBtn = L.control({ position: 'topleft' });
  locateBtn.onAdd = function() {
    const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
    btn.innerHTML = '📍';
    btn.style.background = 'white';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '18px';
    btn.onclick = function() {
      if (currentCoords) {
        map.setView(currentCoords, 16); // recenter on user
      }
    };
    return btn;
  };
  locateBtn.addTo(map);

  // Compass control
  L.control.compass({
    autoActive: true,
    showDigit: true
  }).addTo(map);
}

// ------------------------------
// Nominatim Search with dropdown suggestions
// ------------------------------
function searchLocation(query, callback) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`, {
    headers: { "Accept-Language": "en" } // better results
  })
    .then(res => res.json())
    .then(data => {
      callback(data); // return full list of results
    })
    .catch(err => console.error("Search error:", err));
}

// Attach autocomplete dropdown
function attachAutocomplete(inputId, callback, suggestionBoxId = null) {
  const input = document.getElementById(inputId);
  const dropdown = suggestionBoxId 
    ? document.getElementById(suggestionBoxId) 
    : null;

  input.addEventListener("input", () => {
    const query = input.value.trim();
    if (!query) {
      if (dropdown) dropdown.classList.add("hidden");
      return;
    }

    searchLocation(query, places => {
      if (!dropdown) return; // if no external dropdown is provided

      dropdown.innerHTML = "";
      if (places.length === 0) {
        dropdown.classList.add("hidden");
        return;
      }

      places.forEach(place => {
        const option = document.createElement("div");
        option.textContent = place.display_name;
        option.className = "suggestion-item px-3 py-2 hover:bg-gray-100 cursor-pointer";
        option.addEventListener("click", () => {
          input.value = place.display_name;
          dropdown.classList.add("hidden");
          callback(place);
        });
        dropdown.appendChild(option);
      });

      dropdown.classList.remove("hidden");
    });
  });

  // Hide on blur
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (dropdown) dropdown.classList.add("hidden");
    }, 200);
  });
}

// ------------------------------
// Init Autocomplete
// ------------------------------
function initAutocomplete() {
  // Only keep Preferred Area search for drivers
  attachAutocomplete("preferredArea", place => {
    console.log("Preferred Area selected:", place.display_name);
    map.setView([parseFloat(place.lat), parseFloat(place.lon)], 14);
  }, "preferredArea-suggestions");
}

// ------------------------------
// Mock Requests
// ------------------------------
const mockRequests = [
  {
    id: 1,
    pickup: "Lekki Phase 1, Lagos",
    dropoff: "Victoria Island, Lagos",
    fare: 3500,
    distance: "5 km",
    time: "12 min",
    type: "ride",
    coords: [6.4450, 3.4845]
  },
  {
    id: 2,
    pickup: "Ikeja City Mall, Lagos",
    dropoff: "Maryland Mall, Lagos",
    fare: 2500,
    distance: "3 km",
    time: "8 min",
    type: "delivery",
    coords: [6.6018, 3.3515]
  }
];

function renderRequests() {
  const container = document.getElementById('requestsContainer');
  container.innerHTML = '';
  mockRequests.forEach(req => {
    const card = document.createElement('div');
    card.className = "request-card bg-white rounded-xl p-4 shadow-sm border border-gray-100";
    card.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center space-x-2">
          <i class="fas ${req.type === 'ride' ? 'fa-car text-blue-500' : 'fa-box text-green-500'}"></i>
          <span class="font-medium text-gray-900 capitalize">${req.type} Request</span>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold text-green-600">₦${req.fare}</div>
          <div class="text-xs text-gray-500">${req.distance} • ${req.time}</div>
        </div>
      </div>
      <div class="space-y-2 mb-4">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-sm text-gray-700">${req.pickup}</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span class="text-sm text-gray-700">${req.dropoff}</span>
        </div>
      </div>
      <div class="flex space-x-3">
        <button class="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium">Accept</button>
        <button class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium">Decline</button>
      </div>
    `;
    container.appendChild(card);

    // Add marker
    const marker = L.marker(req.coords).addTo(map)
      .bindPopup(`<b>${req.type} request</b><br>${req.pickup} → ${req.dropoff}`);
    requestMarkers.push(marker);
  });
}

// ------------------------------
// Popup for Preferred Location
// ------------------------------
function openPopup() {
  document.getElementById("popupOverlay").style.display = "flex";
}

function closePopup() {
  document.getElementById("popupOverlay").style.display = "none";
}

let preferredAreaSet = false;
let workDateSet = false;

document.getElementById("setPreferred").addEventListener("click", () => {
  const area = document.getElementById("preferredArea").value.trim();
  const date = document.getElementById("workDate").value.trim();

  if (!area || !date) {
    alert("Please fill in both Work Date and Preferred Area.");
    return;
  }

  preferredAreaSet = true;
  workDateSet = true;

  closePopup();
  alert("Preferred location set successfully!");
});

// ------------------------------
// Online/Offline Toggle
// ------------------------------
document.getElementById('statusToggle').addEventListener('click', () => {
  const btn = document.getElementById('statusToggle');
  const text = document.getElementById('statusText');

  if (!preferredAreaSet || !workDateSet) {
    openPopup();
    return;
  }

  if (btn.classList.contains('offline')) {
    btn.classList.remove('offline');
    btn.classList.add('online');
    text.textContent = "Go Offline";
  } else {
    btn.classList.remove('online');
    btn.classList.add('offline');
    text.textContent = "Go Online";
  }
});

// ------------------------------
// Init
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initAutocomplete();
  renderRequests();
});
