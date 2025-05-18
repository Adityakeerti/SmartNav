package com.smartnav.algorithms;

import com.smartnav.models.Edge;
import java.util.*;

public class AStar {
    // Constant for average speed in km/h (adjust as needed)
    private static final double AVG_SPEED_KMH = 40.0;
    // Traffic impact factor (higher value = more impact)
    private static final double TRAFFIC_FACTOR = 5.0;

    // Find shortest path (distance-based)
    public static List<String> findShortestPath(String start, String goal, Map<String, List<Edge>> graph) {
        return findPath(start, goal, graph, false);
    }

    // Find fastest path (time-based)
    public static List<String> findFastestPath(String start, String goal, Map<String, List<Edge>> graph) {
        return findPath(start, goal, graph, true);
    }

    // General pathfinding method with mode selection
    private static List<String> findPath(String start, String goal, Map<String, List<Edge>> graph, boolean useTimeBasedCost) {
        System.out.println("AStar called to find " + (useTimeBasedCost ? "fastest" : "shortest") + " path from " + start + " to " + goal);

        // If start and goal are the same, return immediately
        if (start.equals(goal)) {
            List<String> path = new ArrayList<>();
            path.add(start);
            return path;
        }

        // Track visited nodes and costs
        Map<String, Double> gScore = new HashMap<>();
        Map<String, String> cameFrom = new HashMap<>();
        Set<String> visited = new HashSet<>();

        // Priority queue for nodes to visit
        PriorityQueue<NodeCost> openSet = new PriorityQueue<>();

        // Initialize start node
        gScore.put(start, 0.0);
        openSet.add(new NodeCost(start, 0.0));

        while (!openSet.isEmpty()) {
            NodeCost current = openSet.poll();
            String currentNode = current.node;

            // If we reached the goal, construct and return the path
            if (currentNode.equals(goal)) {
                List<String> path = reconstructPath(cameFrom, goal);
                return path;
            }

            // Skip if we've already processed this node
            if (visited.contains(currentNode)) {
                continue;
            }

            // Mark as visited
            visited.add(currentNode);

            // Get all neighbors (adjacent nodes)
            List<Edge> edges = graph.get(currentNode);
            if (edges == null) {
                continue;
            }

            for (Edge edge : edges) {
                String neighbor = edge.to;

                // Skip if already visited
                if (visited.contains(neighbor)) {
                    continue;
                }

                // Calculate new cost to neighbor (distance or time based)
                double currentCost = gScore.get(currentNode);
                double edgeCost;

                if (useTimeBasedCost) {
                    // Time-based cost (minutes)
                    double distance = edge.base_weight; // km
                    double speedReduction = 1.0 - (edge.traffic * TRAFFIC_FACTOR / 100.0); // reduce speed based on traffic
                    double speed = AVG_SPEED_KMH * speedReduction; // km/h
                    edgeCost = (distance / speed) * 60; // minutes
                } else {
                    // Distance-based cost
                    edgeCost = edge.base_weight;
                }

                double newCost = currentCost + edgeCost;

                // If we found a better path to the neighbor
                if (!gScore.containsKey(neighbor) || newCost < gScore.get(neighbor)) {
                    cameFrom.put(neighbor, currentNode);
                    gScore.put(neighbor, newCost);
                    openSet.add(new NodeCost(neighbor, newCost));
                }
            }
        }

        // If we get here, no path was found
        System.out.println("No path found from " + start + " to " + goal);
        return new ArrayList<>();
    }

    private static List<String> reconstructPath(Map<String, String> cameFrom, String current) {
        List<String> path = new ArrayList<>();
        path.add(current);

        while (cameFrom.containsKey(current)) {
            current = cameFrom.get(current);
            path.add(0, current); // Add to beginning of list
        }

        return path;
    }

    // Helper class for PriorityQueue
    private static class NodeCost implements Comparable<NodeCost> {
        String node;
        double cost;

        NodeCost(String node, double cost) {
            this.node = node;
            this.cost = cost;
        }

        @Override
        public int compareTo(NodeCost other) {
            return Double.compare(this.cost, other.cost);
        }
    }
}