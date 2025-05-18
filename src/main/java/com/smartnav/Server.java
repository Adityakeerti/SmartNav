package com.smartnav;

import io.javalin.Javalin;
import com.smartnav.models.Edge;
import com.smartnav.utils.GraphBuilder;

import com.smartnav.algorithms.AStar;
import com.smartnav.algorithms.FloydWarshall;
import com.google.gson.Gson;

import java.util.*;

public class Server {
    // Constant for average speed in km/h (should match AStar class)
    private static final double AVG_SPEED_KMH = 40.0;
    // Traffic impact factor
    private static final double TRAFFIC_FACTOR = 5.0;
    // Pre-computed distances using Floyd-Warshall
    private static Map<String, Map<String, Integer>> preComputedDistances;

    public static void main(String[] args) throws Exception {
        Gson gson = new Gson();
        Map<String, List<Edge>> graph = GraphBuilder.buildAdjacencyList("src/main/resources/data/city_graph.json");

        // Pre-compute all-pairs shortest paths using Floyd-Warshall
        List<String> nodes = new ArrayList<>(graph.keySet());
        List<Edge> allEdges = new ArrayList<>();
        for (List<Edge> edges : graph.values()) {
            allEdges.addAll(edges);
        }
        preComputedDistances = FloydWarshall.compute(nodes, allEdges);
        System.out.println("Pre-computed distances using Floyd-Warshall algorithm");

        Javalin app = Javalin.create(config -> {
            config.plugins.enableCors(cors -> {
                cors.add(corsConfig -> {
                    corsConfig.anyHost();
                });
            });
        }).start(7000);

        app.get("/path", ctx -> {
            String src = ctx.queryParam("src");
            String dest = ctx.queryParam("dest");

            System.out.println("Request received for path from " + src + " to " + dest);

            if (src == null || dest == null) {
                ctx.status(400).json(Map.of("error", "Source and destination are required"));
                return;
            }

            if (!graph.containsKey(src) || !graph.containsKey(dest)) {
                ctx.status(400).json(Map.of("error", "Invalid source or destination"));
                return;
            }

            // Get pre-computed shortest distance from Floyd-Warshall
            int preComputedDistance = preComputedDistances.get(src).get(dest);
            System.out.println("Pre-computed shortest distance: " + preComputedDistance);

            // Find fastest route (time-based) using A*
            List<String> fastestPath = AStar.findFastestPath(src, dest, graph);

            // Find shortest route (distance-based) using A*
            List<String> shortestPath = AStar.findShortestPath(src, dest, graph);
            System.out.println("Fastest path: " + String.join(" -> ", fastestPath));
            System.out.println("Shortest path: " + String.join(" -> ", shortestPath));
            if (fastestPath.isEmpty()) {
                ctx.status(404).json(Map.of("error", "No path found"));
                return;
            }

            // Calculate statistics for both paths
            Map<String, Object> fastestStats = calculatePathStats(fastestPath, graph);
            Map<String, Object> shortestStats = calculatePathStats(shortestPath, graph);

            // Calculate time difference if the paths are different
            double timeDiff = 0;
            boolean isFastestAlsoShortest = fastestPath.equals(shortestPath);

            if (!isFastestAlsoShortest) {
                double fastestTime = (double) fastestStats.get("estimatedTime");
                double shortestTime = (double) shortestStats.get("estimatedTime");
                timeDiff = shortestTime - fastestTime;
            }

            // Compare A* shortest distance with Floyd-Warshall distance
            boolean isAStarOptimal = (int) shortestStats.get("distance") == preComputedDistance;

            Map<String, Object> response = new HashMap<>();
            response.put("path", fastestPath);
            response.put("distance", fastestStats.get("distance"));
            response.put("trafficLevel", fastestStats.get("trafficLevel"));
            response.put("estimatedTime", fastestStats.get("estimatedTime"));
            response.put("isFastestAlsoShortest", isFastestAlsoShortest);
            response.put("timeAdvantage", timeDiff);
            response.put("shortestPath", shortestPath);
            response.put("shortestDistance", shortestStats.get("distance"));
            response.put("floydWarshallDistance", preComputedDistance);
            response.put("isAStarOptimal", isAStarOptimal);
            System.out.println("Response: " + gson.toJson(response));
            ctx.json(response);
        });

        // Add a new endpoint specifically for Floyd-Warshall distance lookups
        app.get("/distance", ctx -> {
            String src = ctx.queryParam("src");
            String dest = ctx.queryParam("dest");

            if (src == null || dest == null) {
                ctx.status(400).json(Map.of("error", "Source and destination are required"));
                return;
            }

            if (!preComputedDistances.containsKey(src) || !preComputedDistances.get(src).containsKey(dest)) {
                ctx.status(400).json(Map.of("error", "Invalid source or destination"));
                return;
            }

            int distance = preComputedDistances.get(src).get(dest);
            ctx.json(Map.of(
                    "source", src,
                    "destination", dest,
                    "distance", distance
            ));
        });
    }

    private static Map<String, Object> calculatePathStats(List<String> path, Map<String, List<Edge>> graph) {
        int totalDistance = 0;
        int totalTraffic = 0;
        double estimatedTime = 0;

        for (int i = 0; i < path.size() - 1; i++) {
            for (Edge e : graph.get(path.get(i))) {
                if (e.to.equals(path.get(i + 1))) {
                    totalDistance += e.base_weight;
                    totalTraffic += e.traffic;

                    // Calculate estimated time for this segment
                    double distance = e.base_weight; // km
                    double speedReduction = 1.0 - (e.traffic * TRAFFIC_FACTOR / 100.0);
                    double speed = AVG_SPEED_KMH * speedReduction; // km/h
                    double time = (distance / speed) * 60; // minutes
                    estimatedTime += time;

                    break;
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("distance", totalDistance);
        stats.put("trafficLevel", totalTraffic);
        stats.put("estimatedTime", Math.round(estimatedTime * 10) / 10.0); // Round to 1 decimal place
        System.out.println("Path stats: Distance=" + totalDistance + ", Traffic=" + totalTraffic + ", Est. Time=" + Math.round(estimatedTime * 10) / 10.0 + " minutes");
        return stats;
    }
}

//curl "http://localhost:7000/path?src=ISBT&dest=Forest%20Research%20Institute"