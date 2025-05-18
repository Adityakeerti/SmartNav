package com.smartnav.algorithms;

import com.smartnav.models.Edge;
import java.util.*;

public class FloydWarshall {
    public static Map<String, Map<String, Integer>> compute(List<String> nodes, List<Edge> edges) {
        int n = nodes.size();
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < n; i++) index.put(nodes.get(i), i);

        int[][] dist = new int[n][n];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE / 2);
        for (int i = 0; i < n; i++) dist[i][i] = 0;

        for (Edge e : edges) {
            int u = index.get(e.from), v = index.get(e.to);
            dist[u][v] = Math.min(dist[u][v], e.getTotalWeight());
        }

        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);

        Map<String, Map<String, Integer>> result = new HashMap<>();
        for (int i = 0; i < n; i++) {
            Map<String, Integer> row = new HashMap<>();
            for (int j = 0; j < n; j++) {
                row.put(nodes.get(j), dist[i][j]);
            }
            result.put(nodes.get(i), row);
        }
        return result;
    }
}
