import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8000;

// Helper functions for graph algorithms

class Graph {
  constructor(nodes, edges, directed, weighted) {
    this.nodes = nodes;
    this.directed = directed;
    this.weighted = weighted;
    this.adjList = {};
    this.weights = {};

    nodes.forEach(node => {
      this.adjList[node.label] = [];
    });

    edges.forEach(edge => {
      this.adjList[edge.from].push(edge.to);
      this.weights[`${edge.from}-${edge.to}`] = edge.weight;
      if (!directed) {
        this.adjList[edge.to].push(edge.from);
        this.weights[`${edge.to}-${edge.from}`] = edge.weight;
      }
    });
  }
}

// Dijkstra's algorithm
function dijkstra(graph, start) {
  const distances = {};
  const previous = {};
  const queue = [];

  graph.nodes.forEach(node => {
    distances[node.label] = Infinity;
    previous[node.label] = null;
  });
  distances[start] = 0;

  queue.push({ node: start, dist: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const { node } = queue.shift();

    graph.adjList[node].forEach(neighbor => {
      const weight = graph.weights[`${node}-${neighbor}`];
      const alt = distances[node] + weight;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = node;
        queue.push({ node: neighbor, dist: alt });
      }
    });
  }

  return { distances, previous };
}

// Bellman-Ford algorithm
function bellmanFord(graph, start) {
  const distances = {};
  const previous = {};

  graph.nodes.forEach(node => {
    distances[node.label] = Infinity;
    previous[node.label] = null;
  });
  distances[start] = 0;

  for (let i = 0; i < graph.nodes.length - 1; i++) {
    graph.nodes.forEach(node => {
      graph.adjList[node.label].forEach(neighbor => {
        const weight = graph.weights[`${node.label}-${neighbor}`];
        if (distances[node.label] + weight < distances[neighbor]) {
          distances[neighbor] = distances[node.label] + weight;
          previous[neighbor] = node.label;
        }
      });
    });
  }

  // Check for negative cycles
  let hasNegativeCycle = false;
  graph.nodes.forEach(node => {
    graph.adjList[node.label].forEach(neighbor => {
      const weight = graph.weights[`${node.label}-${neighbor}`];
      if (distances[node.label] + weight < distances[neighbor]) {
        hasNegativeCycle = true;
      }
    });
  });

  return { distances, previous, hasNegativeCycle };
}

// Kruskal's algorithm
function kruskal(graph) {
  const edges = [];
  graph.nodes.forEach(node => {
    graph.adjList[node.label].forEach(neighbor => {
      if (node.label < neighbor) { // to avoid duplicates
        edges.push({ from: node.label, to: neighbor, weight: graph.weights[`${node.label}-${neighbor}`] });
      }
    });
  });

  edges.sort((a, b) => a.weight - b.weight);

  const parent = {};
  graph.nodes.forEach(node => {
    parent[node.label] = node.label;
  });

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(x, y) {
    const px = find(x), py = find(y);
    if (px !== py) parent[px] = py;
  }

  const mst = [];
  edges.forEach(edge => {
    if (find(edge.from) !== find(edge.to)) {
      union(edge.from, edge.to);
      mst.push(edge);
    }
  });

  return mst;
}

// Prim's algorithm
function prim(graph, start) {
  const visited = new Set();
  const mst = [];
  const queue = [{ node: start, weight: 0, parent: null }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.weight - b.weight);
    const { node, weight, parent } = queue.shift();

    if (visited.has(node)) continue;
    visited.add(node);

    if (parent) {
      mst.push({ from: parent, to: node, weight });
    }

    graph.adjList[node].forEach(neighbor => {
      if (!visited.has(neighbor)) {
        const w = graph.weights[`${node}-${neighbor}`];
        queue.push({ node: neighbor, weight: w, parent: node });
      }
    });
  }

  return mst;
}

// Connected components (DFS)
function connectedComponents(graph) {
  const visited = new Set();
  const components = [];

  function dfs(node, component) {
    visited.add(node);
    component.push(node);
    graph.adjList[node].forEach(neighbor => {
      if (!visited.has(neighbor)) {
        dfs(neighbor, component);
      }
    });
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.label)) {
      const component = [];
      dfs(node.label, component);
      components.push(component);
    }
  });

  return components;
}

// Strongly connected components (Kosaraju)
function stronglyConnectedComponents(graph) {
  const visited = new Set();
  const order = [];

  function dfs1(node) {
    visited.add(node);
    graph.adjList[node].forEach(neighbor => {
      if (!visited.has(neighbor)) dfs1(neighbor);
    });
    order.push(node);
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.label)) dfs1(node.label);
  });

  // Transpose graph
  const transpose = {};
  graph.nodes.forEach(node => transpose[node.label] = []);
  Object.keys(graph.adjList).forEach(node => {
    graph.adjList[node].forEach(neighbor => {
      transpose[neighbor].push(node);
    });
  });

  visited.clear();
  const scc = [];

  while (order.length > 0) {
    const node = order.pop();
    if (!visited.has(node)) {
      const component = [];
      function dfs2(n) {
        visited.add(n);
        component.push(n);
        transpose[n].forEach(neigh => {
          if (!visited.has(neigh)) dfs2(neigh);
        });
      }
      dfs2(node);
      scc.push(component);
    }
  }

  return scc;
}

// Eulerian path/circuit
function eulerianPath(graph) {
  const degrees = {};
  graph.nodes.forEach(node => degrees[node.label] = graph.adjList[node.label].length);

  let start = null;
  let oddCount = 0;
  graph.nodes.forEach(node => {
    if (degrees[node.label] % 2 === 1) {
      oddCount++;
      if (!start) start = node.label;
    }
  });

  if (oddCount > 2) return null; // No Eulerian path
  if (!start) start = graph.nodes[0].label;

  const path = [];
  const stack = [start];
  const adj = { ...graph.adjList };

  while (stack.length > 0) {
    const node = stack[stack.length - 1];
    if (adj[node].length > 0) {
      const next = adj[node].pop();
      stack.push(next);
    } else {
      path.push(stack.pop());
    }
  }

  return path.reverse();
}

function eulerianCircuit(graph) {
  const degrees = {};
  graph.nodes.forEach(node => degrees[node.label] = graph.adjList[node.label].length);

  const oddDegrees = Object.values(degrees).filter(d => d % 2 === 1);
  if (oddDegrees.length > 0) return null; // No Eulerian circuit

  return eulerianPath(graph);
}

// Welsh-Powell coloring
function welshPowell(graph) {
  const degrees = {};
  graph.nodes.forEach(node => {
    degrees[node.label] = graph.adjList[node.label].length;
  });

  const sortedNodes = Object.keys(degrees).sort((a, b) => degrees[b] - degrees[a]);

  const coloring = {};
  const colors = {};

  sortedNodes.forEach(node => {
    const usedColors = new Set();
    graph.adjList[node].forEach(neighbor => {
      if (coloring[neighbor] !== undefined) {
        usedColors.add(coloring[neighbor]);
      }
    });
    let color = 0;
    while (usedColors.has(color)) color++;
    coloring[node] = color;
  });

  return coloring;
}

// API endpoint
app.post('/api/algorithm', (req, res) => {
  const { algorithm, directed, weighted, source, nodes, edges } = req.body;

  const graph = new Graph(nodes, edges, directed, weighted);

  try {
    let result = {};

    switch (algorithm) {
      case 'dijkstra':
        if (!source) return res.status(400).json({ error: 'Source required' });
        const { distances, previous } = dijkstra(graph, source);
        result = { distances, previous };
        break;
      case 'bellman_ford':
      case 'bellman':
        if (!source) return res.status(400).json({ error: 'Source required' });
        const bfResult = bellmanFord(graph, source);
        result = bfResult;
        break;
      case 'kruskal':
        result = { mst_edges: kruskal(graph) };
        break;
      case 'prim':
        if (!source) return res.status(400).json({ error: 'Source required' });
        result = { mst_edges: prim(graph, source) };
        break;
      case 'connected_components':
        result = { components: connectedComponents(graph) };
        break;
      case 'strongly_connected':
        if (!directed) return res.status(400).json({ error: 'Graph must be directed' });
        result = { components: stronglyConnectedComponents(graph) };
        break;
      case 'eulerian_path':
        const path = eulerianPath(graph);
        result = path ? { path } : { error: 'No Eulerian path' };
        break;
      case 'eulerian_circuit':
        const circuit = eulerianCircuit(graph);
        result = circuit ? { path: circuit } : { error: 'No Eulerian circuit' };
        break;
      case 'welsh_powell':
        result = { coloring: welshPowell(graph) };
        break;
      default:
        return res.status(400).json({ error: 'Unknown algorithm' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});