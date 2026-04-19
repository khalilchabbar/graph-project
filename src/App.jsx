import { useState, useRef, useCallback } from "react";
import "./App.css";

const COLORS = {
  bg: "#0a0a0f",
  panel: "#12121a",
  border: "#1e1e2e",
  accent: "#7c3aed",
  accentLight: "#a855f7",
  accentGlow: "rgba(124,58,237,0.3)",
  node: "#1e1e2e",
  nodeHover: "#2a2a3e",
  edge: "#4c4c6e",
  edgeHover: "#a855f7",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textAccent: "#c4b5fd",
  success: "#10b981",
  danger: "#ef4444",
  weight: "#fbbf24",
};

const NODE_RADIUS = 26;
const BACKEND_URL = "http://localhost:8000"; // ← Changez cette URL

// Couleurs de coloration des sommets
const COLOR_PALETTE = [
  "#ef4444","#3b82f6","#10b981","#f59e0b",
  "#8b5cf6","#ec4899","#14b8a6","#f97316",
];

// ─── Définition des algorithmes ───────────────────────────────────────────────
const ALGO_GROUPS = [
  {
    id: "shortest", label: "Plus court chemin", icon: "⟶", color: "#3b82f6",
    algos: [
      { id: "dijkstra",     label: "Dijkstra",      needsSource: true,  weighted: true,  directed: "both",      desc: "Poids positifs uniquement. Choisissez un sommet source." },
      { id: "bellman_ford", label: "Bellman-Ford",  needsSource: true,  weighted: true,  directed: "both",      desc: "Supporte les poids négatifs. Choisissez un sommet source." },
      { id: "bellman",      label: "Bellman",        needsSource: true,  weighted: true,  directed: "both",      desc: "Variante Bellman. Choisissez un sommet source." },
    ],
  },
  {
    id: "mst", label: "Arbre couvrant", icon: "🌲", color: "#10b981",
    algos: [
      { id: "kruskal", label: "Kruskal", needsSource: false, weighted: true, directed: "undirected", desc: "Graphe non orienté pondéré." },
      { id: "prim",    label: "Prim",    needsSource: true,  weighted: true, directed: "undirected", desc: "Graphe non orienté pondéré. Choisissez un sommet de départ." },
    ],
  },
  {
    id: "connectivity", label: "Composantes", icon: "⬡", color: "#f59e0b",
    algos: [
      { id: "connected_components",  label: "Composantes connexes",          needsSource: false, weighted: false, directed: "undirected", desc: "Graphe non orienté." },
      { id: "strongly_connected",    label: "Composantes fortement connexes", needsSource: false, weighted: false, directed: "directed",   desc: "Graphe orienté requis (Tarjan / Kosaraju)." },
    ],
  },
  {
    id: "euler", label: "Euler", icon: "∞", color: "#ec4899",
    algos: [
      { id: "eulerian_path",    label: "Chemin eulérien",  needsSource: false, weighted: false, directed: "both", desc: "Recherche un chemin eulérien." },
      { id: "eulerian_circuit", label: "Circuit eulérien", needsSource: false, weighted: false, directed: "both", desc: "Recherche un circuit eulérien." },
    ],
  },
  {
    id: "coloring", label: "Coloration", icon: "◐", color: "#8b5cf6",
    algos: [
      { id: "welsh_powell", label: "Welsh-Powell", needsSource: false, weighted: false, directed: "undirected", desc: "Coloration des sommets. Graphe non orienté." },
    ],
  },
];

// ─── Navbar algorithmes ───────────────────────────────────────────────────────
function AlgoNavbar({ selectedAlgo, onSelectAlgo, directed, weighted }) {
  const [openGroup, setOpenGroup] = useState(null);

  return (
    <div style={{
      borderBottom: `1px solid ${COLORS.border}`,
      background: "#0d0d15",
      padding: "0 16px",
      display: "flex",
      alignItems: "stretch",
      gap: 2,
      overflowX: "auto",
      flexShrink: 0,
    }}>
      {ALGO_GROUPS.map((group) => (
        <div key={group.id} style={{ position: "relative" }}>
          <button
            onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
            style={{
              padding: "10px 14px",
              background: openGroup === group.id ? group.color + "18" : "transparent",
              color: openGroup === group.id ? group.color : COLORS.textMuted,
              border: "none",
              borderBottom: `2px solid ${openGroup === group.id ? group.color : "transparent"}`,
              fontSize: 11, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
              letterSpacing: "0.04em",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span>{group.icon}</span><span>{group.label}</span>
          </button>

          {openGroup === group.id && (
            <div style={{
              position: "absolute", top: "100%", left: 0, zIndex: 200,
              background: "#0f0f1a",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "0 8px 8px 8px",
              minWidth: 240,
              boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
              padding: 6,
            }}>
              {group.algos.map((algo) => {
                const isSelected = selectedAlgo?.id === algo.id;
                const warn =
                  (algo.directed === "directed" && !directed) ||
                  (algo.directed === "undirected" && directed) ||
                  (algo.weighted && !weighted);
                return (
                  <button
                    key={algo.id}
                    onClick={() => { onSelectAlgo(algo); setOpenGroup(null); }}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: isSelected ? group.color + "22" : "transparent",
                      color: warn ? COLORS.textMuted : isSelected ? group.color : COLORS.text,
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12, fontWeight: isSelected ? 700 : 500,
                      textAlign: "left",
                      opacity: warn ? 0.55 : 1,
                      display: "flex", flexDirection: "column", gap: 2,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <span>{algo.label} {warn ? " ⚠" : ""}</span>
                    <span style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 400 }}>{algo.desc}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {selectedAlgo && (
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, paddingRight: 4 }}>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>
            ▶ <span style={{ color: COLORS.accentLight, fontWeight: 700 }}>{selectedAlgo.label}</span>
          </span>
          <button onClick={() => onSelectAlgo(null)} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Panneau résultats ────────────────────────────────────────────────────────
function ResultPanel({ result, loading, onClose }) {
  if (!result && !loading) return null;

  return (
    <div style={{
      width: 260, minWidth: 260,
      background: COLORS.panel,
      borderLeft: `1px solid ${COLORS.border}`,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Résultats</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 14, cursor: "pointer", lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: 14, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.textMuted, padding: "20px 0" }}>
            <span style={{ fontSize: 20 }}>⟳</span>
            <span style={{ fontSize: 12 }}>Exécution en cours…</span>
          </div>
        )}
        {result?.error && (
          <div style={{ padding: "10px 12px", background: "#ef444411", border: "1px solid #ef444433", borderRadius: 8, fontSize: 12, color: COLORS.danger }}>
            ⚠ {result.error}
          </div>
        )}
        {result && !result.error && (
          <>
            {/* Chemin */}
            {result.path && (
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Chemin</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                  {result.path.map((node, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ padding: "2px 8px", background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}55`, borderRadius: 20, fontSize: 11, color: COLORS.accentLight, fontWeight: 700 }}>{node}</span>
                      {i < result.path.length - 1 && <span style={{ color: COLORS.textMuted }}>→</span>}
                    </span>
                  ))}
                </div>
                {result.cost !== undefined && (
                  <div style={{ marginTop: 6, fontSize: 11, color: COLORS.weight }}>Coût total: <strong>{result.cost}</strong></div>
                )}
              </div>
            )}
            {/* Distances */}
            {result.distances && (
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Distances depuis la source</div>
                {Object.entries(result.distances).map(([node, dist]) => (
                  <div key={node} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: COLORS.textAccent, fontWeight: 700 }}>{node}</span>
                    <span style={{ color: dist === null || dist === "inf" ? COLORS.danger : COLORS.weight, fontWeight: 700 }}>{dist === null || dist === "inf" ? "∞" : dist}</span>
                  </div>
                ))}
              </div>
            )}
            {/* MST */}
            {result.mst_edges && (
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Arêtes MST</div>
                {result.total_cost !== undefined && <div style={{ fontSize: 11, color: COLORS.success, marginBottom: 6 }}>Coût total: <strong>{result.total_cost}</strong></div>}
                {result.mst_edges.map((e, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: COLORS.textAccent }}>{e.from} — {e.to}</span>
                    <span style={{ color: COLORS.weight, fontWeight: 700 }}>{e.weight}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Composantes */}
            {result.components && (
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Composantes ({result.components.length})</div>
                {result.components.map((comp, i) => (
                  <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: COLORS.textMuted, marginRight: 4, alignSelf: "center" }}>C{i + 1}:</span>
                    {comp.map((n) => (
                      <span key={n} style={{ padding: "1px 7px", background: `hsl(${i * 55 + 180}, 50%, 18%)`, border: `1px solid hsl(${i * 55 + 180}, 50%, 38%)`, borderRadius: 12, fontSize: 10, color: `hsl(${i * 55 + 180}, 80%, 70%)`, fontWeight: 700 }}>{n}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {/* Coloration */}
            {result.coloring && (
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  Coloration — {result.chromatic_number ?? "?"} couleurs
                </div>
                {Object.entries(result.coloring).map(([node, color]) => (
                  <div key={node} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: COLORS.textAccent, fontWeight: 700 }}>{node}</span>
                    <span style={{ padding: "1px 8px", background: `${COLOR_PALETTE[color % COLOR_PALETTE.length]}22`, border: `1px solid ${COLOR_PALETTE[color % COLOR_PALETTE.length]}66`, borderRadius: 12, fontSize: 10, color: COLOR_PALETTE[color % COLOR_PALETTE.length], fontWeight: 700 }}>C{color}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Eulérien */}
            {result.exists !== undefined && (
              <div style={{ padding: "10px 12px", background: result.exists ? "#10b98111" : "#ef444411", border: `1px solid ${result.exists ? "#10b98133" : "#ef444433"}`, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: result.exists ? COLORS.success : COLORS.danger, fontWeight: 700 }}>{result.exists ? "✓ Existe" : "✗ N'existe pas"}</div>
                {result.circuit && <div style={{ marginTop: 6, fontSize: 10, color: COLORS.textMuted, wordBreak: "break-all" }}>{result.circuit.join(" → ")}</div>}
              </div>
            )}
            {/* Fallback JSON */}
            {!result.path && !result.distances && !result.components && !result.coloring && !result.mst_edges && result.exists === undefined && (
              <pre style={{ fontSize: 10, color: COLORS.textMuted, background: COLORS.bg, padding: 10, borderRadius: 8, overflow: "auto", maxHeight: 200 }}>{JSON.stringify(result, null, 2)}</pre>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Panneau exécution (bas de sidebar) ──────────────────────────────────────
function RunPanel({ algo, nodes, selectedNode, onRun, loading }) {
  if (!algo) return null;
  const sourceNode = nodes.find((n) => n.id === selectedNode);
  const canRun = !algo.needsSource || sourceNode;

  return (
    <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 14, background: "#0d0d15", flexShrink: 0 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Exécuter</div>
      <div style={{ fontSize: 11, color: COLORS.accentLight, fontWeight: 700, marginBottom: 6 }}>{algo.label}</div>
      {algo.needsSource && (
        <div style={{ fontSize: 11, color: sourceNode ? COLORS.success : COLORS.textMuted, marginBottom: 8 }}>
          {sourceNode ? `Source: ${sourceNode.label} ✓` : "→ Sélectionnez un sommet source"}
        </div>
      )}
      <button
        onClick={onRun}
        disabled={!canRun || loading}
        style={{
          width: "100%", padding: "9px",
          background: canRun && !loading ? COLORS.accent : COLORS.border,
          color: canRun && !loading ? "#fff" : COLORS.textMuted,
          border: "none", borderRadius: 8,
          fontSize: 12, fontWeight: 700,
          letterSpacing: "0.04em",
          cursor: canRun && !loading ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
      >
        {loading ? "⟳ Exécution…" : "▶ Lancer l'algorithme"}
      </button>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function GraphEditor() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [mode, setMode] = useState("select");
  const [edgeStart, setEdgeStart] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoverNode, setHoverNode] = useState(null);
  const [hoverEdge, setHoverEdge] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [editingWeight, setEditingWeight] = useState(null);
  const [nodeLabel, setNodeLabel] = useState("");
  const [directed, setDirected] = useState(false);
  const [weighted, setWeighted] = useState(true);
  const [showMatrix, setShowMatrix] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedAlgo, setSelectedAlgo] = useState(null);
  const [algoResult, setAlgoResult] = useState(null);
  const [algoLoading, setAlgoLoading] = useState(false);
  const [resultColors, setResultColors] = useState({});    // nodeId → color index
  const [resultEdgeSet, setResultEdgeSet] = useState(new Set()); // edge ids to highlight
  const svgRef = useRef(null);
  const nextNodeId = useRef(0);
  const nextEdgeId = useRef(1);
  const [nodePlaceholder, setNodePlaceholder] = useState("S0");

  const notify = (msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const getSVGPoint = useCallback((e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // ─── Backend call ─────────────────────────────────────────────────────────
  const buildPayload = (algo, sourceNode) => ({
    algorithm: algo.id,
    directed,
    weighted,
    source: sourceNode?.label ?? null,
    nodes: nodes.map((n) => ({ id: n.id, label: n.label })),
    edges: edges.map((e) => ({
      from: nodes.find((n) => n.id === e.from)?.label,
      to: nodes.find((n) => n.id === e.to)?.label,
      weight: weighted ? e.weight : 1,
    })),
  });

  const runAlgorithm = useCallback(async () => {
    if (!selectedAlgo) return;
    const sourceNode = nodes.find((n) => n.id === selectedNode);
    if (selectedAlgo.needsSource && !sourceNode) {
      notify("Sélectionnez un sommet source d'abord", "danger");
      return;
    }

    const payload = buildPayload(selectedAlgo, sourceNode);
    setAlgoLoading(true);
    setAlgoResult(null);
    setResultColors({});
    setResultEdgeSet(new Set());

    try {
      const res = await fetch(`${BACKEND_URL}/api/algorithm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlgoResult({ error: data.detail || `Erreur HTTP ${res.status}` });
      } else {
        setAlgoResult(data);

        // Coloration des sommets sur le canvas
        if (data.coloring) {
          const cm = {};
          Object.entries(data.coloring).forEach(([label, c]) => {
            const n = nodes.find((nd) => nd.label === label);
            if (n) cm[n.id] = c;
          });
          setResultColors(cm);
        }

        // Surlignage des arêtes (MST ou chemin)
        const pairsRaw = data.mst_edges
          ? data.mst_edges.map((e) => [e.from, e.to])
          : data.path
          ? data.path.slice(0, -1).map((n, i) => [n, data.path[i + 1]])
          : [];
        if (pairsRaw.length) {
          const s = new Set();
          pairsRaw.forEach(([fl, tl]) => {
            const found = edges.find((e) => {
              const f = nodes.find((n) => n.id === e.from)?.label;
              const t = nodes.find((n) => n.id === e.to)?.label;
              return (f === fl && t === tl) || (!directed && f === tl && t === fl);
            });
            if (found) s.add(found.id);
          });
          setResultEdgeSet(s);
        }

        notify(`${selectedAlgo.label} terminé ✓`, "success");
      }
    } catch (err) {
      setAlgoResult({ error: `Impossible de joindre le backend: ${err.message}` });
    } finally {
      setAlgoLoading(false);
    }
  }, [selectedAlgo, nodes, edges, directed, weighted, selectedNode]);

  // ─── Handlers graphe ─────────────────────────────────────────────────────
  const handleSVGClick = useCallback((e) => {
    if (mode !== "addNode") return;
    const pt = getSVGPoint(e);
    const label = nodeLabel.trim() || nodePlaceholder;
    setNodes((prev) => [...prev, { id: nextNodeId.current, x: pt.x, y: pt.y, label }]);
    setNodePlaceholder(`S${++nextNodeId.current}`);
    setNodeLabel("");
    notify(`Sommet "${label}" ajouté`, "success");
  }, [mode, getSVGPoint, nodeLabel, nodePlaceholder]);

  const handleNodeClick = useCallback((e, node) => {
    e.stopPropagation();
    if (mode === "addEdge") {
      if (!edgeStart) {
        setEdgeStart(node);
      } else if (edgeStart.id !== node.id) {
        const exists = edges.find((ed) =>
          (ed.from === edgeStart.id && ed.to === node.id) ||
          (!directed && ed.from === node.id && ed.to === edgeStart.id)
        );
        if (exists) { notify("Cette arête existe déjà", "danger"); }
        else {
          const w = parseFloat(weightInput) || 1;
          setEdges((prev) => [...prev, { id: nextEdgeId.current++, from: edgeStart.id, to: node.id, weight: w }]);
          notify(`Arête ajoutée (poids: ${w})`, "success");
        }
        setEdgeStart(null);
      } else { setEdgeStart(null); }
    } else if (mode === "delete") {
      setNodes((prev) => prev.filter((n) => n.id !== node.id));
      setEdges((prev) => prev.filter((ed) => ed.from !== node.id && ed.to !== node.id));
      notify("Sommet supprimé", "danger");
    } else if (mode === "select") {
      setSelectedNode(node.id === selectedNode ? null : node.id);
      setSelectedEdge(null);
    }
  }, [mode, edgeStart, edges, weightInput, directed, selectedNode]);

  const handleEdgeClick = useCallback((e, edge) => {
    e.stopPropagation();
    if (mode === "delete") {
      setEdges((prev) => prev.filter((ed) => ed.id !== edge.id));
      notify("Arête supprimée", "danger");
    } else if (mode === "select") {
      setSelectedEdge(edge.id === selectedEdge ? null : edge.id);
      setSelectedNode(null);
    }
  }, [mode, selectedEdge]);

  const handleMouseDown = useCallback((e, node) => {
    if (mode !== "select") return;
    e.stopPropagation();
    const pt = getSVGPoint(e);
    setDragging(node.id);
    setDragOffset({ x: pt.x - node.x, y: pt.y - node.y });
  }, [mode, getSVGPoint]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const pt = getSVGPoint(e);
    setNodes((prev) => prev.map((n) => n.id === dragging ? { ...n, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } : n));
  }, [dragging, dragOffset, getSVGPoint]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  // ─── Géométrie ────────────────────────────────────────────────────────────
  const getEdgePath = (edge) => {
    const from = nodes.find((n) => n.id === edge.from);
    const to = nodes.find((n) => n.id === edge.to);
    if (!from || !to) return null;
    return { from, to };
  };

  const getOffsetArrow = (from, to, offset = 0) => {
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return null;
    const ux = dx / dist, uy = dy / dist;
    const px = -uy, py = ux;
    return {
      x1: from.x + ux * NODE_RADIUS, y1: from.y + uy * NODE_RADIUS,
      x2: to.x - ux * (NODE_RADIUS + 8), y2: to.y - uy * (NODE_RADIUS + 8),
      cx: (from.x + to.x) / 2 + px * offset,
      cy: (from.y + to.y) / 2 + py * offset,
    };
  };

  const adjacencyMatrix = () =>
    nodes.map((r) => nodes.map((c) => {
      const e = edges.find((ed) =>
        (ed.from === r.id && ed.to === c.id) ||
        (!directed && ed.from === c.id && ed.to === r.id)
      );
      return e ? (weighted ? e.weight : 1) : 0;
    }));

  const clearAll = () => {
    setNodes([]); setEdges([]); setEdgeStart(null);
    setSelectedNode(null); setSelectedEdge(null);
    setAlgoResult(null); setResultColors({}); setResultEdgeSet(new Set());
    nextNodeId.current = 0; nextEdgeId.current = 1;
    setNodePlaceholder("S0"); setNodeLabel("");
    notify("Graphe effacé", "danger");
  };

  const modeLabel = { select: "Sélectionner / Déplacer", addNode: "Ajouter un sommet", addEdge: "Ajouter une arête", delete: "Supprimer" };
  const modeColor = { select: "#7c3aed", addNode: "#10b981", addEdge: "#3b82f6", delete: "#ef4444" };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'JetBrains Mono','Fira Mono',monospace", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, background: COLORS.panel, flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, background: "linear-gradient(90deg,#c4b5fd,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
            Khalil wjmeetou
          </div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>Éditeur de graphes interactif</div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Stats */}
        {[{ label: "Sommets", val: nodes.length, color: "#10b981" }, { label: "Arêtes", val: edges.length, color: "#3b82f6" }].map((s) => (
          <div key={s.label} className="chip" style={{ color: s.color, borderColor: s.color + "44", background: s.color + "11" }}>
            <span>{s.val}</span><span style={{ opacity: 0.7 }}>{s.label}</span>
          </div>
        ))}
        {/* Toggles */}
        {[
          { label: "Orienté", val: directed, set: setDirected, color: COLORS.accent },
          { label: "Pondéré", val: weighted, set: setWeighted, color: COLORS.weight },
        ].map(({ label, val, set, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{label}</span>
            <div className="toggle-switch" style={{ background: val ? color : "#1e1e2e" }} onClick={() => set((v) => !v)}>
              <div className="toggle-knob" style={{ left: val ? 16 : 2 }} />
            </div>
          </div>
        ))}
        <button onClick={() => setShowMatrix((s) => !s)} style={{ padding: "6px 14px", background: showMatrix ? COLORS.accentGlow : "transparent", color: showMatrix ? COLORS.accentLight : COLORS.textMuted, border: `1px solid ${showMatrix ? COLORS.accent : COLORS.border}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Matrice</button>
        <button onClick={clearAll} style={{ padding: "6px 14px", background: "transparent", color: COLORS.danger, border: `1px solid ${COLORS.danger}44`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Effacer</button>
      </div>

      {/* Algo Navbar */}
      <AlgoNavbar
        selectedAlgo={selectedAlgo}
        onSelectAlgo={(algo) => { setSelectedAlgo(algo); setAlgoResult(null); setResultColors({}); setResultEdgeSet(new Set()); }}
        directed={directed}
        weighted={weighted}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: COLORS.panel, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
            {/* Mode buttons */}
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Mode</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(modeLabel).map(([m, label]) => (
                  <button key={m} className="mode-btn" onClick={() => { setMode(m); setEdgeStart(null); }} style={{ background: mode === m ? modeColor[m] + "22" : "transparent", color: mode === m ? modeColor[m] : COLORS.textMuted, borderColor: mode === m ? modeColor[m] : COLORS.border, textAlign: "left" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Node label */}
            {mode === "addNode" && (
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>Étiquette du sommet</div>
                <input value={nodeLabel} onChange={(e) => setNodeLabel(e.target.value)} placeholder={nodePlaceholder} style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6 }}>Cliquez sur le canvas pour placer</div>
              </div>
            )}

            {/* Edge weight */}
            {mode === "addEdge" && (
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>Poids de l'arête</div>
                {weighted
                  ? <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="1" style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.weight, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  : <div style={{ fontSize: 11, color: COLORS.textMuted, padding: "4px 0" }}>Non pondéré — poids fixé à 1</div>
                }
                {edgeStart
                  ? <div style={{ marginTop: 8, padding: "6px 10px", background: "#3b82f611", border: "1px solid #3b82f644", borderRadius: 6, fontSize: 11, color: "#3b82f6" }}>Départ: <strong>{edgeStart.label}</strong><br />Cliquez sur un sommet destination</div>
                  : <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6 }}>Cliquez sur le sommet source</div>
                }
              </div>
            )}

            {/* Edge list */}
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Arêtes ({edges.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {edges.length === 0 && <div style={{ fontSize: 11, color: COLORS.textMuted }}>Aucune arête</div>}
                {edges.map((edge) => {
                  const from = nodes.find((n) => n.id === edge.from);
                  const to = nodes.find((n) => n.id === edge.to);
                  if (!from || !to) return null;
                  const isSelected = selectedEdge === edge.id;
                  const isResult = resultEdgeSet.has(edge.id);
                  return (
                    <div key={edge.id} onClick={() => { setSelectedEdge(isSelected ? null : edge.id); setSelectedNode(null); }} style={{ padding: "6px 8px", background: isResult ? "#10b98111" : isSelected ? COLORS.accentGlow : COLORS.bg, border: `1px solid ${isResult ? "#10b98155" : isSelected ? COLORS.accent : COLORS.border}`, borderRadius: 6, fontSize: 11, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: isResult ? COLORS.success : COLORS.textAccent }}>{from.label} {directed ? "→" : "—"} {to.label}</span>
                      {weighted && (
                        editingWeight === edge.id
                          ? <input autoFocus type="number" defaultValue={edge.weight} onBlur={(e) => { const w = parseFloat(e.target.value) || edge.weight; setEdges((prev) => prev.map((ed) => ed.id === edge.id ? { ...ed, weight: w } : ed)); setEditingWeight(null); }} onClick={(ev) => ev.stopPropagation()} style={{ width: 40, background: COLORS.bg, border: `1px solid ${COLORS.weight}`, borderRadius: 4, color: COLORS.weight, fontSize: 11, padding: "1px 4px", outline: "none", fontFamily: "inherit" }} />
                          : <span style={{ color: COLORS.weight, fontWeight: 700, cursor: "text", padding: "1px 5px", borderRadius: 4, border: "1px solid transparent" }} title="Double-clic pour éditer" onDoubleClick={(ev) => { ev.stopPropagation(); setEditingWeight(edge.id); }}>{edge.weight}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <RunPanel algo={selectedAlgo} nodes={nodes} selectedNode={selectedNode} onRun={runAlgorithm} loading={algoLoading} />
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Mode indicator */}
          <div style={{ position: "absolute", top: 14, left: 16, zIndex: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: modeColor[mode], boxShadow: `0 0 8px ${modeColor[mode]}` }} />
            <span style={{ fontSize: 11, color: modeColor[mode], fontWeight: 600 }}>{modeLabel[mode]}</span>
          </div>

          {/* Graph type chips */}
          <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", gap: 6 }}>
            {[
              { label: directed ? "Orienté" : "Non orienté", color: COLORS.accentLight, border: COLORS.accent },
              { label: weighted ? "Pondéré" : "Non pondéré", color: COLORS.weight, border: COLORS.weight },
            ].map((c) => (
              <span key={c.label} className="chip" style={{ color: c.color, borderColor: c.border + "55", background: c.border + "11" }}>{c.label}</span>
            ))}
            {selectedAlgo && <span className="chip" style={{ color: COLORS.accentLight, borderColor: COLORS.accent + "55", background: COLORS.accentGlow }}>▶ {selectedAlgo.label}</span>}
          </div>

          {/* Notification */}
          {notification && (
            <div className="notif" style={{ position: "absolute", top: 14, right: 16, zIndex: 20, padding: "8px 16px", background: notification.type === "success" ? "#10b98122" : notification.type === "danger" ? "#ef444422" : "#7c3aed22", border: `1px solid ${notification.type === "success" ? "#10b981" : notification.type === "danger" ? "#ef4444" : "#7c3aed"}55`, borderRadius: 8, fontSize: 12, color: notification.type === "success" ? "#10b981" : notification.type === "danger" ? "#ef4444" : COLORS.accentLight, fontWeight: 600 }}>
              {notification.msg}
            </div>
          )}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", gap: 10 }}>
              <div style={{ fontSize: 48, opacity: 0.1 }}>◈</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, opacity: 0.6 }}>Mode "Ajouter un sommet" puis cliquez sur le canvas</div>
            </div>
          )}

          <svg ref={svgRef} width="100%" height="100%" style={{ cursor: mode === "addNode" ? "crosshair" : mode === "delete" ? "not-allowed" : "default", userSelect: "none" }} onClick={handleSVGClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <defs>
              {[["arrowhead", COLORS.edge], ["arrowhead-hover", COLORS.edgeHover], ["arrowhead-result", COLORS.success]].map(([id, fill]) => (
                <marker key={id} id={id} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={fill} />
                </marker>
              ))}
              <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="nodeGlow"><feGaussianBlur stdDeviation="6" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a2e" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {edges.map((edge) => {
              const pts = getEdgePath(edge);
              if (!pts) return null;
              const { from, to } = pts;
              const hasOpposite = edges.some((e) => e.from === edge.to && e.to === edge.from);
              const arr = getOffsetArrow(from, to, hasOpposite ? 35 : 0);
              if (!arr) return null;
              const isHover = hoverEdge === edge.id;
              const isSelected = selectedEdge === edge.id;
              const isResult = resultEdgeSet.has(edge.id);
              const stroke = isResult ? COLORS.success : isHover || isSelected ? COLORS.edgeHover : COLORS.edge;
              const t = 0.5;
              const lx = (1-t)**2*arr.x1 + 2*(1-t)*t*arr.cx + t**2*arr.x2;
              const ly = (1-t)**2*arr.y1 + 2*(1-t)*t*arr.cy + t**2*arr.y2;
              const arrowId = isResult ? "arrowhead-result" : isHover || isSelected ? "arrowhead-hover" : "arrowhead";
              return (
                <g key={edge.id}>
                  <path d={`M ${arr.x1} ${arr.y1} Q ${arr.cx} ${arr.cy} ${arr.x2} ${arr.y2}`} stroke="transparent" strokeWidth={18} fill="none" style={{ cursor: "pointer" }} onClick={(e) => handleEdgeClick(e, edge)} onMouseEnter={() => setHoverEdge(edge.id)} onMouseLeave={() => setHoverEdge(null)} />
                  <path className="edge-line" d={`M ${arr.x1} ${arr.y1} Q ${arr.cx} ${arr.cy} ${arr.x2} ${arr.y2}`} fill="none" stroke={stroke} strokeWidth={isResult || isSelected ? 2.5 : 1.5} markerEnd={directed ? `url(#${arrowId})` : undefined} filter={isHover || isSelected || isResult ? "url(#glow)" : undefined} onClick={(e) => handleEdgeClick(e, edge)} onMouseEnter={() => setHoverEdge(edge.id)} onMouseLeave={() => setHoverEdge(null)} />
                  {weighted && (
                    <>
                      <rect x={lx - 14} y={ly - 10} width={28} height={20} rx={5} fill={COLORS.bg} stroke={isSelected ? COLORS.weight : COLORS.border} strokeWidth={1} />
                      <text x={lx} y={ly + 4} textAnchor="middle" fontSize={11} fontWeight="700" fill={COLORS.weight} style={{ pointerEvents: "none", fontFamily: "JetBrains Mono" }}>{edge.weight}</text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode === node.id;
              const isEdgeStart = edgeStart?.id === node.id;
              const isHover = hoverNode === node.id;
              const colorIdx = resultColors[node.id];
              const nodeColor = colorIdx !== undefined ? COLOR_PALETTE[colorIdx % COLOR_PALETTE.length] : null;
              return (
                <g key={node.id} onClick={(e) => handleNodeClick(e, node)} onMouseDown={(e) => handleMouseDown(e, node)} onMouseEnter={() => setHoverNode(node.id)} onMouseLeave={() => setHoverNode(null)} style={{ cursor: mode === "select" ? "grab" : "pointer" }}>
                  {(isSelected || isEdgeStart) && (
                    <circle cx={node.x} cy={node.y} r={NODE_RADIUS + 8} fill="none" stroke={isEdgeStart ? "#3b82f6" : COLORS.accent} strokeWidth={1.5} opacity={0.5} filter="url(#nodeGlow)" />
                  )}
                  <circle className="node-circle" cx={node.x} cy={node.y} r={NODE_RADIUS}
                    fill={nodeColor ? nodeColor + "33" : isEdgeStart ? "#3b82f633" : isSelected ? COLORS.accentGlow : isHover ? COLORS.nodeHover : COLORS.node}
                    stroke={nodeColor ?? (isEdgeStart ? "#3b82f6" : isSelected ? COLORS.accent : isHover ? COLORS.accentLight : COLORS.edge)}
                    strokeWidth={nodeColor || isSelected || isEdgeStart ? 2.5 : 1.5}
                    filter={isSelected || isEdgeStart || nodeColor ? "url(#nodeGlow)" : undefined}
                  />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={12} fontWeight="700" fill={nodeColor ?? (isSelected ? COLORS.accentLight : isEdgeStart ? "#60a5fa" : COLORS.text)} style={{ pointerEvents: "none", fontFamily: "JetBrains Mono" }}>
                    {node.label}
                  </text>
                  {colorIdx !== undefined && (
                    <text x={node.x + NODE_RADIUS - 2} y={node.y - NODE_RADIUS + 8} textAnchor="middle" fontSize={9} fontWeight="700" fill={nodeColor} style={{ pointerEvents: "none" }}>C{colorIdx}</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Matrix */}
        {showMatrix && nodes.length > 0 && (
          <div style={{ width: Math.max(220, nodes.length * 44 + 60), maxWidth: 420, background: COLORS.panel, borderLeft: `1px solid ${COLORS.border}`, padding: 16, overflowY: "auto" }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 14, textTransform: "uppercase" }}>Matrice d'adjacence</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
                <thead>
                  <tr>
                    <td style={{ width: 36 }} />
                    {nodes.map((n) => <td key={n.id}><div className="matrix-cell" style={{ color: COLORS.accentLight, fontWeight: 700 }}>{n.label}</div></td>)}
                  </tr>
                </thead>
                <tbody>
                  {adjacencyMatrix().map((row, ri) => (
                    <tr key={ri}>
                      <td><div className="matrix-cell" style={{ color: COLORS.accentLight, fontWeight: 700 }}>{nodes[ri].label}</div></td>
                      {row.map((val, ci) => (
                        <td key={ci}>
                          <div className="matrix-cell" style={{ background: val !== 0 ? COLORS.accentGlow : COLORS.bg, color: val !== 0 ? COLORS.weight : COLORS.textMuted, fontWeight: val !== 0 ? 700 : 400, border: `1px solid ${val !== 0 ? COLORS.accent + "55" : COLORS.border}` }}>{val}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result Panel */}
        <ResultPanel result={algoResult} loading={algoLoading} onClose={() => { setAlgoResult(null); setResultColors({}); setResultEdgeSet(new Set()); }} />
      </div>
    </div>
  );
}
