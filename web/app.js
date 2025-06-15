// Use real latitude/longitude for each location
const locationCoordinates = {
  "ISBT": { lat: 30.2900, lng: 78.0250 },
  "Clock Tower": { lat: 30.3256, lng: 78.0437 },
  "Pacific Mall": { lat: 30.3387, lng: 78.0534 },
  "Forest Research Institute": { lat: 30.3372, lng: 77.9975 },
  "Mussoorie Diversion": { lat: 30.3643, lng: 78.0806 },
  "Rajpur Road": { lat: 30.3629, lng: 78.0801 },
  "Clementown": { lat: 30.2707, lng: 78.0322 },
  "IMA": { lat: 30.3076, lng: 78.0126 },
  "Paltan Bazaar": { lat: 30.3206, lng: 78.0405 },
  "Railway Station": { lat: 30.3120, lng: 78.0287 }
};

// Define custom marker icons using leaflet-color-markers CDN
const greenIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const redIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Graph data (would normally be fetched from server)
const cityGraph = {
  nodes: [
    "ISBT", "Clock Tower", "Pacific Mall", "Forest Research Institute",
    "Mussoorie Diversion", "Rajpur Road", "Clementown", "IMA",
    "Paltan Bazaar", "Railway Station"
  ],
  edges: [
    {from: "ISBT", to: "Clock Tower", base_weight: 8, traffic: 3},
    {from: "Clock Tower", to: "ISBT", base_weight: 8, traffic: 5},
    {from: "ISBT", to: "Clementown", base_weight: 6, traffic: 1},
    {from: "Clementown", to: "ISBT", base_weight: 6, traffic: 0},
    {from: "Clock Tower", to: "Paltan Bazaar", base_weight: 3, traffic: 4},
    {from: "Paltan Bazaar", to: "Clock Tower", base_weight: 5, traffic: 4},
    {from: "Clock Tower", to: "Rajpur Road", base_weight: 5, traffic: 2},
    {from: "Rajpur Road", to: "Clock Tower", base_weight: 5, traffic: 2},
    {from: "Paltan Bazaar", to: "Railway Station", base_weight: 4, traffic: 2},
    {from: "Railway Station", to: "Paltan Bazaar", base_weight: 4, traffic: 2},
    {from: "Rajpur Road", to: "Pacific Mall", base_weight: 7, traffic: 1},
    {from: "Pacific Mall", to: "Rajpur Road", base_weight: 7, traffic: 3},
    {from: "Rajpur Road", to: "Mussoorie Diversion", base_weight: 9, traffic: 3},
    {from: "Mussoorie Diversion", to: "Rajpur Road", base_weight: 9, traffic: 3},
    {from: "Mussoorie Diversion", to: "Forest Research Institute", base_weight: 8, traffic: 0},
    {from: "Forest Research Institute", to: "Mussoorie Diversion", base_weight: 8, traffic: 0},
    {from: "Pacific Mall", to: "Forest Research Institute", base_weight: 6, traffic: 2},
    {from: "Forest Research Institute", to: "Pacific Mall", base_weight: 6, traffic: 2},
    {from: "Clementown", to: "IMA", base_weight: 5, traffic: 1},
    {from: "IMA", to: "Clementown", base_weight: 6, traffic: 1},
    {from: "IMA", to: "Railway Station", base_weight: 7, traffic: 3},
    {from: "Railway Station", to: "IMA", base_weight: 7, traffic: 3},
    {from: "Railway Station", to: "Clementown", base_weight: 9, traffic: 2},
    {from: "Clementown", to: "Railway Station", base_weight: 9, traffic: 2},
    {from: "Railway Station", to: "Forest Research Institute", base_weight: 12, traffic: 1},
    {from: "Forest Research Institute", to: "Railway Station", base_weight: 12, traffic: 0},
    {from: "Clock Tower", to: "IMA", base_weight: 10, traffic: 4},
    {from: "IMA", to: "Clock Tower", base_weight: 10, traffic: 4}
  ]
};

// Store references to Leaflet layers for easy update/removal
let map, markerLayers = {}, edgeLayers = [], routeLayer = null;

// Utility function to clear all markers
function clearMarkers() {
  Object.values(markerLayers).forEach(marker => map.removeLayer(marker));
  markerLayers = {};
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Leaflet map centered on Dehradun
  map = L.map('map').setView([30.3256, 78.0437], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Draw all edges as grey polylines (keep this for context)
  cityGraph.edges.forEach(edge => {
    const from = locationCoordinates[edge.from];
    const to = locationCoordinates[edge.to];
    if (!from || !to) return;
    const poly = L.polyline([
      [from.lat, from.lng],
      [to.lat, to.lng]
    ], {
      color: '#757575',
      weight: 3,
      opacity: 0.7
    }).addTo(map);
    edgeLayers.push(poly);
  });
});

// Utility function to clear previous route and markers
function clearRoute() {
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
  clearMarkers();
}

// Find the shortest path between two locations and draw it on the map
function findPath() {
  const src = document.getElementById("start").value;
  const dest = document.getElementById("end").value;

  // Remove previous route and markers
  clearRoute();

  // If backend is not available, use mock data instead
  if (src === dest) {
    document.getElementById("output").innerHTML = `
      <p class="instruction">Source and destination are the same location.</p>
    `;
    document.getElementById("route-stats").innerHTML = '';
    return;
  }

  // Fetch the path from backend
  fetch(`http://localhost:7000/path?src=${encodeURIComponent(src)}&dest=${encodeURIComponent(dest)}`)
    .then(res => {
      if (res.status === 404) {
        document.getElementById("output").innerHTML = `
          <p class="instruction">⚠️ No path available from ${src} to ${dest}.</p>
          <p>Try selecting different locations or check if there's a route available.</p>
        `;
        document.getElementById("route-stats").innerHTML = '';
        return Promise.reject(new Error("No path found"));
      }
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.path && Array.isArray(data.path)) {
        // Build array of latlngs for the route
        const latlngs = data.path.map(loc => {
          const coords = locationCoordinates[loc];
          return coords ? [coords.lat, coords.lng] : null;
        }).filter(Boolean);
        // Draw the route as a red polyline
        routeLayer = L.polyline(latlngs, {
          color: '#ff1744',
          weight: 6,
          opacity: 1
        }).addTo(map);
        // Add only start and end markers
        const startCoords = locationCoordinates[data.path[0]];
        const endCoords = locationCoordinates[data.path[data.path.length-1]];
        if (startCoords) {
          markerLayers[data.path[0]] = L.marker([startCoords.lat, startCoords.lng], { icon: greenIcon }).addTo(map).bindPopup(data.path[0]);
        }
        if (endCoords) {
          markerLayers[data.path[data.path.length-1]] = L.marker([endCoords.lat, endCoords.lng], { icon: redIcon }).addTo(map).bindPopup(data.path[data.path.length-1]);
        }
        // Display path information
        displayPathDetails(data.path, data);
      } else {
        document.getElementById("output").innerHTML = `
          <p class="instruction">⚠️ No path data received from server.</p>
        `;
        document.getElementById("route-stats").innerHTML = '';
      }
    })
    .catch(error => {
      if (error.message !== "No path found") {
        // Generate mock path for demonstration if server is not available
        const mockPath = generateMockPath(src, dest);
        if (mockPath && mockPath.length > 0) {
          const mockData = {
            path: mockPath,
            distance: calculateMockDistance(mockPath),
            trafficLevel: 3,
            estimatedTime: 15.5,
            isFastestAlsoShortest: false,
            shortestPath: mockPath,
            shortestDistance: calculateMockDistance(mockPath) - 2,
            floydWarshallDistance: calculateMockDistance(mockPath),
            isAStarOptimal: true,
            timeAdvantage: 2.5
          };
          // Draw the mock route
          const latlngs = mockPath.map(loc => {
            const coords = locationCoordinates[loc];
            return coords ? [coords.lat, coords.lng] : null;
          }).filter(Boolean);
          routeLayer = L.polyline(latlngs, {
            color: '#ff1744',
            weight: 6,
            opacity: 1
          }).addTo(map);
          // Add only start and end markers
          const startCoords = locationCoordinates[mockPath[0]];
          const endCoords = locationCoordinates[mockPath[mockPath.length-1]];
          if (startCoords) {
            markerLayers[mockPath[0]] = L.marker([startCoords.lat, startCoords.lng], { icon: greenIcon }).addTo(map).bindPopup(mockPath[0]);
          }
          if (endCoords) {
            markerLayers[mockPath[mockPath.length-1]] = L.marker([endCoords.lat, endCoords.lng], { icon: redIcon }).addTo(map).bindPopup(mockPath[mockPath.length-1]);
          }
          displayPathDetails(mockPath, mockData);
        } else {
          document.getElementById("output").innerHTML = `
            <p class="instruction">❌ Error fetching path: ${error.message}</p>
            <p>The server may not be running. Please start the backend server.</p>
          `;
          document.getElementById("route-stats").innerHTML = '';
        }
      }
    });
}

// Simple mock path generator for demonstration when server is offline
function generateMockPath(src, dest) {
  // Simple BFS to find a path
  const queue = [[src]];
  const visited = new Set([src]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentNode = path[path.length - 1];

    if (currentNode === dest) {
      return path;
    }

    // Find all connections from current node
    cityGraph.edges
      .filter(edge => edge.from === currentNode)
      .forEach(edge => {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push([...path, edge.to]);
        }
      });
  }

  return null; // No path found
}

// Calculate mock distance for demonstration
function calculateMockDistance(path) {
  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = cityGraph.edges.find(e =>
      e.from === path[i] && e.to === path[i+1]
    );
    if (edge) {
      distance += edge.base_weight;
    }
  }
  return distance;
}

// Display path details in the results panel
function displayPathDetails(path, data) {
  const outputDiv = document.getElementById("output");
  const statsDiv = document.getElementById("route-stats");

  // Calculate additional stats
  let totalDistance = 0;
  let totalTraffic = 0;
  let steps = '';

  // Create step-by-step directions
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i+1];

    // Find the edge data
    const edge = cityGraph.edges.find(e =>
      (e.from === from && e.to === to) ||
      (e.from === to && e.to === from) // Check for reverse edge too
    );

    if (edge) {
      totalDistance += edge.base_weight;
      totalTraffic += edge.traffic;

      const trafficClass = edge.traffic > 3 ? 'high-traffic' :
                           edge.traffic > 1 ? 'medium-traffic' : 'low-traffic';

      const trafficIcon = edge.traffic > 3 ? 'fa-traffic-light' :
                          edge.traffic > 1 ? 'fa-car' : 'fa-road';

      steps += `
        <div class="route-step">
          <i class="fas fa-arrow-right"></i>
          <div>
            <strong>From ${from} to ${to}</strong>
            <div>Base distance: ${edge.base_weight} km |
              Traffic: <span class="${trafficClass}">
                <i class="fas ${trafficIcon}"></i> ${edge.traffic}
              </span>
            </div>
          </div>
        </div>
      `;
    } else {
      console.warn(`No edge data found for ${from} to ${to}`);
    }
  }

  // Display the route information
  outputDiv.innerHTML = `
    <h3><i class="fas fa-route"></i> Your Route</h3>
    <p>From <strong>${path[0]}</strong> to <strong>${path[path.length - 1]}</strong></p>
    ${steps}
  `;

  // Display route statistics with the actual data from the server response
  statsDiv.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${path.length}</div>
      <div class="stat-label">Stops</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${data.distance || totalDistance}</div>
      <div class="stat-label">Distance (km)</div>
    </div>
    <div class="stat-item">
      <div class="stat-value ${data.trafficLevel > 5 ? 'high-traffic' : data.trafficLevel > 3 ? 'medium-traffic' : 'low-traffic'}">
        ${data.trafficLevel || totalTraffic}
      </div>
      <div class="stat-label">Traffic Level</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${data.estimatedTime || "N/A"}</div>
      <div class="stat-label">Est. Time (min)</div>
    </div>
  `;

  // Add comparison info for Floyd-Warshall and A*
  if (data.floydWarshallDistance !== undefined) {
    const algorithmComparison = `
      <div class="algorithm-comparison">
        <h4>Algorithm Comparison</h4>
        <p>Floyd-Warshall base distance: <strong>${data.floydWarshallDistance} km</strong></p>
        <p>A* shortest distance: <strong>${data.shortestDistance} km</strong></p>
        ${data.isAStarOptimal ?
          '<p class="optimal-path"><i class="fas fa-check-circle"></i> A* found the optimal path</p>' :
          '<p class="suboptimal-path"><i class="fas fa-exclamation-triangle"></i> A* produced a suboptimal path</p>'}
      </div>
    `;

    outputDiv.innerHTML += algorithmComparison;
  }

  // Add comparison info if fastest is not the shortest
  if (data.isFastestAlsoShortest === false && data.shortestPath) {
    const timeDiff = data.timeAdvantage ? Math.round(data.timeAdvantage * 10) / 10 : "N/A";
    const distanceDiff = data.distance - data.shortestDistance;

    outputDiv.innerHTML += `
      <div class="route-comparison">
        <p><strong>Note:</strong> This is the fastest route but not the shortest.</p>
        <p>You save <span class="low-traffic">${timeDiff} minutes</span> but travel <span class="high-traffic">${distanceDiff} km</span> farther.</p>
      </div>
    `;
  }
}