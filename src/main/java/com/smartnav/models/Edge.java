package com.smartnav.models;

public class Edge {
    public String from;
    public String to;
    public int base_weight;
    public int traffic;

    public int getTotalWeight() {
        return base_weight + traffic;
    }
}
