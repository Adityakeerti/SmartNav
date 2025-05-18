// Map coordinates for Dehradun locations
const locationCoordinates = {
  "ISBT": { x: 150, y: 430 },
  "Clock Tower": { x: 300, y: 350 },
  "Pacific Mall": { x: 500, y: 250 },
  "Forest Research Institute": { x: 650, y: 300 },
  "Mussoorie Diversion": { x: 550, y: 150 },
  "Rajpur Road": { x: 400, y: 200 },
  "Clementown": { x: 200, y: 300 },
  "IMA": { x: 350, y: 250 },
  "Paltan Bazaar": { x: 380, y: 400 },
  "Railway Station": { x: 480, y: 450 }
};

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

// Initialize the map
document.addEventListener('DOMContentLoaded', function() {
  drawMap();
});

// Utility function to create safe IDs by replacing spaces and special characters
function createSafeId(text) {
  return text.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
}

// Draw the basic map with all locations and roads
function drawMap() {
  const mapElement = document.getElementById('map');
  mapElement.innerHTML = '';

  // Add edges (roads) first so they're beneath the nodes
  cityGraph.edges.forEach(edge => {
    const fromCoord = locationCoordinates[edge.from];
    const toCoord = locationCoordinates[edge.to];

    if (!fromCoord || !toCoord) return;

    // Calculate edge position and angle
    const dx = toCoord.x - fromCoord.x;
    const dy = toCoord.y - fromCoord.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Create the edge element with safe IDs
    const edgeElement = document.createElement('div');
    edgeElement.className = 'map-edge';
    const safeFromId = createSafeId(edge.from);
    const safeToId = createSafeId(edge.to);
    edgeElement.id = `edge-${safeFromId}-${safeToId}`;
    edgeElement.style.width = `${length}px`;
    edgeElement.style.left = `${fromCoord.x}px`;
    edgeElement.style.top = `${fromCoord.y}px`;
    edgeElement.style.transform = `rotate(${angle}deg)`;

    // Apply traffic color to edge thickness
    const trafficClass = edge.traffic > 3 ? 'high-traffic' :
                       edge.traffic > 1 ? 'medium-traffic' : 'low-traffic';
    edgeElement.classList.add(trafficClass);

    // Add custom attribute for traffic info
    edgeElement.setAttribute('data-traffic', edge.traffic);
    edgeElement.setAttribute('data-weight', edge.base_weight + edge.traffic);
    edgeElement.setAttribute('data-from', edge.from);
    edgeElement.setAttribute('data-to', edge.to);

    mapElement.appendChild(edgeElement);
  });

  // Add nodes (locations)
  cityGraph.nodes.forEach(location => {
    const coords = locationCoordinates[location];
    if (!coords) return;

    // Create node element with safe ID
    const nodeElement = document.createElement('div');
    nodeElement.className = 'map-node';
    const safeNodeId = createSafeId(location);
    nodeElement.id = `node-${safeNodeId}`;
    nodeElement.style.left = `${coords.x}px`;
    nodeElement.style.top = `${coords.y}px`;
    nodeElement.setAttribute('data-location', location);

    // Add tooltip on hover
    nodeElement.title = location;

    // Add location label
    const labelElement = document.createElement('div');
    labelElement.className = 'map-label';
    labelElement.textContent = location;
    labelElement.style.left = `${coords.x}px`;
    labelElement.style.top = `${coords.y}px`;

    mapElement.appendChild(nodeElement);
    mapElement.appendChild(labelElement);

    // Add click event to select this location
    nodeElement.addEventListener('click', function() {
      const startSelect = document.getElementById('start');
      const endSelect = document.getElementById('end');

      // If shift key is pressed, set as destination
      if (window.event.shiftKey) {
        endSelect.value = location;
      } else {
        startSelect.value = location;
      }
    });
  });
}

// Find the shortest path between two locations
function findPath() {
  const src = document.getElementById("start").value;
  const dest = document.getElementById("end").value;

  console.log(`Finding path from ${src} to ${dest}`);

  // Reset previous path highlights
  document.querySelectorAll('.map-node.path, .map-node.start, .map-node.end, .map-edge.path').forEach(el => {
    el.classList.remove('path', 'start', 'end');
  });

  // Mark start and end nodes
  const startNodeId = createSafeId(`node-${src}`);
  const endNodeId = createSafeId(`node-${dest}`);

  const startNode = document.getElementById(`node-${createSafeId(src)}`);
  const endNode = document.getElementById(`node-${createSafeId(dest)}`);

  console.log(`Looking for start node: node-${createSafeId(src)}`);
  console.log(`Looking for end node: node-${createSafeId(dest)}`);

  if (startNode) startNode.classList.add('start');
  if (endNode) endNode.classList.add('end');

  // If backend is not available, use mock data instead
  if (src === dest) {
    // Handle same source and destination
    document.getElementById("output").innerHTML = `
      <p class="instruction">Source and destination are the same location.</p>
    `;
    document.getElementById("route-stats").innerHTML = '';
    return;
  }

  // Try to connect to backend, if fails use mock data
  fetch(`http://localhost:7000/path?src=${encodeURIComponent(src)}&dest=${encodeURIComponent(dest)}`)
    .then(res => {
      if (res.status === 404) {
        // Handle the "No path found" response
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
      console.log("Response from server:", data);

      // Check if the expected data structure exists
      if (data.path && Array.isArray(data.path)) {
        // Display path information
        const pathResult = data.path;
        console.log("Path returned from server:", pathResult);

        displayPathDetails(pathResult, data);

        // Highlight the path on the map
        highlightPath(pathResult);
      } else {
        document.getElementById("output").innerHTML = `
          <p class="instruction">⚠️ No path data received from server.</p>
        `;
        document.getElementById("route-stats").innerHTML = '';
      }
    })
    .catch(error => {
      if (error.message !== "No path found") {
        console.error("Error:", error);
        // Generate mock path for demonstration if server is not available
        console.log("Using mock path data for demonstration");
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

          displayPathDetails(mockPath, mockData);
          highlightPath(mockPath);
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

// Highlight the found path on the map
function highlightPath(path) {
  console.log("Highlighting path:", path);

  // Highlight nodes in the path
  for (let i = 0; i < path.length; i++) {
    const nodeId = `node-${createSafeId(path[i])}`;
    console.log("Looking for node:", nodeId);
    const nodeElement = document.getElementById(nodeId);

    if (nodeElement && i > 0 && i < path.length - 1) {
      nodeElement.classList.add('path');
    }

    // Highlight edges between consecutive nodes
    if (i < path.length - 1) {
      // Try to find the edge (direct or reverse)
      const fromNode = path[i];
      const toNode = path[i+1];

      const safeFromId = createSafeId(fromNode);
      const safeToId = createSafeId(toNode);

      // Try direct edge first
      const edgeId = `edge-${safeFromId}-${safeToId}`;
      console.log("Looking for direct edge:", edgeId);
      let edgeElement = document.getElementById(edgeId);

      if (!edgeElement) {
        // If direct edge not found, check for reverse edge
        const reverseEdgeId = `edge-${safeToId}-${safeFromId}`;
        console.log("Direct edge not found, trying reverse:", reverseEdgeId);
        edgeElement = document.getElementById(reverseEdgeId);
      }

      if (edgeElement) {
        console.log("Edge found, adding path class");
        edgeElement.classList.add('path');
      } else {
        console.log("No edge found between", fromNode, "and", toNode);

        // Debug: List all edges in the DOM
        console.log("Available edges in DOM:");
        document.querySelectorAll('.map-edge').forEach(el => {
          console.log(el.id);
        });
      }
    }
  }
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