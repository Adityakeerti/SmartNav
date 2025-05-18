package com.smartnav.utils;

import com.smartnav.models.Edge;
import com.smartnav.models.GraphData;
import java.util.*;
import java.io.*;
import com.google.gson.Gson;

public class GraphBuilder {
    public static Map<String, List<Edge>> buildAdjacencyList(String filePath) throws IOException {
        Gson gson = new Gson();
        GraphData data = gson.fromJson(new FileReader(filePath), GraphData.class);
        Map<String, List<Edge>> graph = new HashMap<>();
        for (String node : data.nodes) graph.put(node, new ArrayList<>());
        for (Edge edge : data.edges) {
            graph.get(edge.from).add(edge);
        }
        return graph;
    }
}
