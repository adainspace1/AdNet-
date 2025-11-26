// Preloader
window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if(preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.style.display = 'none';
          document.getElementById('mainContent').classList.remove('hidden');
        }, 500);
    }
  }, 1000);
});

let map;
let driverMarker;
let requestMarkers = [];
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
  if (L.control.compass) {
      L.control.compass({
        autoActive: true,
        showDigit: true
      }).addTo(map);
  }
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
  if (!input) return;

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
// Render Markers from Global Data
// ------------------------------
function renderMarkers() {
  const orders = window.availableOrders || [];
  
  // Clear existing markers
  requestMarkers.forEach(m => map.removeLayer(m));
  requestMarkers = [];

  orders.forEach(req => {
    // We need coordinates. If not present, we can't plot.
    // Assuming backend might geocode or we just skip for now if no coords.
    // For demo, let's use random offset from center if no coords provided (just for visual)
    // In production, you'd geocode the address.
    
    // Simulating coords for demo if not present (REMOVE IN PROD)
    const lat = 9.0820 + (Math.random() - 0.5) * 0.1;
    const lng = 8.6753 + (Math.random() - 0.5) * 0.1;
    
    const marker = L.marker([lat, lng]).addTo(map)
      .bindPopup(`<b>${req.delivery.type} request</b><br>${req.delivery.collectionPoint || 'Warehouse'} → ${req.delivery.location}`);
    requestMarkers.push(marker);
  });
}

// ------------------------------
// Accept Order
// ------------------------------
window.acceptOrder = async (orderId) => {
    if(!confirm("Are you sure you want to accept this order?")) return;

    try {
        const res = await fetch('/api/driver/accept-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });
        const data = await res.json();
        
        if(data.success) {
            alert("Order accepted! Please proceed to pickup.");
            // Remove from UI
            const card = document.getElementById(`order-${orderId}`);
            if(card) card.remove();
            // Reload page to refresh list and map
            window.location.reload();
        } else {
            alert("Error: " + data.message);
        }
    } catch(err) {
        console.error(err);
        alert("Failed to accept order");
    }
};

// ------------------------------
// Popup for Preferred Location
// ------------------------------
window.openPopup = function() {
  document.getElementById("popupOverlay").style.display = "flex";
}

window.closePopup = function() {
  document.getElementById("popupOverlay").style.display = "none";
}

let preferredAreaSet = false;
let workDateSet = false;

const setPreferredBtn = document.getElementById("setPreferred");
if(setPreferredBtn) {
    setPreferredBtn.addEventListener("click", () => {
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
}

// ------------------------------
// Online/Offline Toggle
// ------------------------------
const statusToggle = document.getElementById('statusToggle');
if(statusToggle) {
    statusToggle.addEventListener('click', () => {
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
}

// ------------------------------
// Init
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initAutocomplete();
  renderMarkers();
});
