import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  MarkerType,
  Panel,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const FIELD_COLORS = {
  text:         { bg: "#f0f7ff", border: "#3b82f6" },
  email:        { bg: "#fdf4ff", border: "#a855f7" },
  phone:        { bg: "#fff7ed", border: "#f97316" },
  options:      { bg: "#f0fdf4", border: "#22c55e" },
  multi_options:{ bg: "#ecfdf5", border: "#10b981" },
  consent:      { bg: "#fefce8", border: "#eab308" },
  state:        { bg: "#fff1f2", border: "#f43f5e" },
};

const FIELD_TYPES = [
  { value: "text",          label: "Text" },
  { value: "phone",         label: "Phone" },
  { value: "email",         label: "Email" },
  { value: "options",       label: "Multiple Choice" },
  { value: "multi_options", label: "Multi-Select" },
  { value: "consent",       label: "Consent" },
  { value: "state",         label: "State" },
];

const StepNode = ({ data, selected }) => {
  const colors = FIELD_COLORS[data.field_type] || FIELD_COLORS.text;
  return (
    <>
      <Handle type="target" position={Position.Left} style={{ background: colors.border, width: 10, height: 10, border: "2px solid #fff" }} />
      <div style={{
        background: colors.bg,
        border: `2px solid ${selected ? colors.border : colors.border + "88"}`,
        borderRadius: 12, padding: "12px 16px", minWidth: 200, maxWidth: 260,
        boxShadow: selected ? `0 0 0 3px ${colors.border}33, 0 4px 16px rgba(0,0,0,0.12)` : "0 2px 8px rgba(0,0,0,0.08)",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", background: colors.border,
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 12, flexShrink: 0,
          }}>{data.order}</div>
          <span style={{
            background: colors.border + "22", color: colors.border,
            borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          }}>
            {FIELD_TYPES.find(f => f.value === data.field_type)?.label || data.field_type}
          </span>
          {data.is_required && <span style={{ color: "#ef4444", fontSize: 14, marginLeft: "auto" }}>●</span>}
        </div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", lineHeight: 1.4, marginBottom: 6 }}>
          {data.question || "No question set"}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
          {data.field_name || "unnamed"}
        </div>
        {data.options?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {data.options.slice(0, 3).map((opt, i) => (
              <span key={i} style={{ background: colors.border + "15", color: colors.border, borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>{opt}</span>
            ))}
            {data.options.length > 3 && <span style={{ fontSize: 10, color: "#94a3b8" }}>+{data.options.length - 3} more</span>}
          </div>
        )}
        {data.conditions?.length > 0 && (
          <div style={{ marginTop: 8, padding: "4px 8px", background: "#ffc10722", borderRadius: 6, fontSize: 10, color: "#d97706", fontWeight: 600 }}>
            ⚡ {data.conditions.length} condition{data.conditions.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: colors.border, width: 10, height: 10, border: "2px solid #fff" }} />
    </>
  );
};

const StartNode = () => (
  <>
    <div style={{
      background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff",
      borderRadius: 30, padding: "10px 24px", fontWeight: 700, fontSize: 14,
      boxShadow: "0 4px 12px rgba(102,126,234,0.4)", textAlign: "center", minWidth: 100,
    }}>🚀 Start</div>
    <Handle type="source" position={Position.Right} style={{ background: "#667eea", width: 10, height: 10, border: "2px solid #fff" }} />
  </>
);

const EndNode = () => (
  <>
    <Handle type="target" position={Position.Left} style={{ background: "#11998e", width: 10, height: 10, border: "2px solid #fff" }} />
    <div style={{
      background: "linear-gradient(135deg, #11998e, #38ef7d)", color: "#fff",
      borderRadius: 30, padding: "10px 24px", fontWeight: 700, fontSize: 14,
      boxShadow: "0 4px 12px rgba(17,153,142,0.4)", textAlign: "center", minWidth: 100,
    }}>✅ End</div>
  </>
);

const nodeTypes = { step: StepNode, start: StartNode, end: EndNode };

function buildEdges(steps) {
  const edges = [];
  if (!steps || steps.length === 0) return edges;

  edges.push({
    id: "start-to-1", source: "start", target: `step-${steps[0].order}`,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#667eea", strokeWidth: 2 }, type: "smoothstep",
  });

  const conditionTargets = new Set();
  steps.forEach(step => {
    (step.conditions || []).forEach(cond => {
      if (cond.goto_step) conditionTargets.add(parseInt(cond.goto_step));
    });
  });

  steps.forEach((step, i) => {
    const nextStep = steps[i + 1];
    const hasConditions = step.conditions && step.conditions.length > 0;

    if (hasConditions) {
      step.conditions.forEach((cond, ci) => {
        if (cond.goto_step && cond.if_answer) {
          edges.push({
            id: `cond-${step.order}-${ci}`,
            source: `step-${step.order}`,
            target: `step-${cond.goto_step}`,
            label: cond.if_answer,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "5,3" },
            labelBgStyle: { fill: "#fef3c7", fillOpacity: 0.9 },
            labelStyle: { fill: "#d97706", fontWeight: 600, fontSize: 11 },
            type: "smoothstep",
          });
        }
      });
    } else {
      if (nextStep) {
        edges.push({
          id: `seq-${step.order}`,
          source: `step-${step.order}`,
          target: `step-${nextStep.order}`,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#94a3b8", strokeWidth: 2 }, type: "smoothstep",
        });
      } else {
        edges.push({
          id: `end-${step.order}`,
          source: `step-${step.order}`,
          target: "end",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#11998e", strokeWidth: 2 }, type: "smoothstep",
        });
      }
    }
  });

  conditionTargets.forEach(targetOrder => {
    const targetStep = steps.find(s => s.order === targetOrder);
    if (!targetStep) return;
    const hasOwnConditions = targetStep.conditions && targetStep.conditions.length > 0;
    const hasOutgoing = edges.some(e => e.source === `step-${targetOrder}`);
    if (!hasOwnConditions && !hasOutgoing) {
      const targetIdx = steps.findIndex(s => s.order === targetOrder);
      const nextAfterTarget = steps[targetIdx + 1];
      edges.push({
        id: `end-target-${targetOrder}`,
        source: `step-${targetOrder}`,
        target: nextAfterTarget ? `step-${nextAfterTarget.order}` : "end",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#94a3b8", strokeWidth: 2 }, type: "smoothstep",
      });
    }
  });

  return edges;
}

function buildNodes(steps) {
  const nodes = [];
  const SPACING_X = 300;
  const BASE_Y = 200;

  nodes.push({
    id: "start", type: "start", position: { x: 80, y: BASE_Y },
    data: { label: "Start" },
  });

  (steps || []).forEach((step, i) => {
    nodes.push({
      id: `step-${step.order}`, type: "step",
      position: { x: 80 + SPACING_X * (i + 1), y: BASE_Y - 40 },
      data: { ...step },
    });
  });

  nodes.push({
    id: "end", type: "end",
    position: { x: 80 + SPACING_X * ((steps || []).length + 1), y: BASE_Y },
    data: { label: "End" },
  });

  return nodes;
}

function nodesToSteps(nodes) {
  return nodes
    .filter(n => n.type === "step")
    .sort((a, b) => a.data.order - b.data.order)
    .map(n => ({
      order: n.data.order,
      field_name: (n.data.field_name || "").trim(),
      field_type: n.data.field_type || "text",
      question: n.data.question || "",
      options: n.data.options || [],
      is_required: !!n.data.is_required,
      data_source: n.data.data_source || "static",
      api_endpoint: n.data.api_endpoint || "",
      api_response_path: n.data.api_response_path || "",
      depends_on_field: n.data.depends_on_field || "",
      conditions: n.data.conditions || [],
      knowledge_base: n.data.knowledge_base || "",
      response_message: n.data.response_message || "",
    }));
}

// ── Step Editor — uses LOCAL state so typing never loses focus ─────
const StepEditor = ({ node, allNodes, onChange, onClose, onDelete }) => {
  console.log("StepEditor re-rendered at", Date.now()); // ADD THIS
  const [localData, setLocalData] = useState({ ...node.data });
  const stepNodes = allNodes.filter(n => n.type === "step" && n.id !== node.id);

  // Reset local state only when a DIFFERENT node is selected
  useEffect(() => {
    setLocalData({ ...node.data });
  }, [node.id]); // eslint-disable-line

  const update = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));     // notifies parent to update nodes/edges
  };
  const save = () => {
    onChange(localData);
  };

  return (
    <div style={{
      position: "absolute", right: 0, top: 0, width: 320,
      background: "#fff", borderRadius: "0 12px 12px 0",
      boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
      border: "1px solid #e2e8f0", zIndex: 1000,
      height: "100%", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#f8fafc", flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
          Edit Step {localData.order}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onDelete} style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "4px 10px", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
            Delete
          </button>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 10px", color: "#64748b", cursor: "pointer", fontSize: 12 }}>
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>

        {/* Question */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Question</label>
          <textarea
            value={localData.question || ""}
            rows={3}
            onChange={e => update("question", e.target.value)}
            onBlur={save}
            style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        {/* Field Name */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
            Field Name <span style={{ color: "#94a3b8", fontWeight: 400 }}>(no spaces)</span>
          </label>
          <input
            value={localData.field_name || ""}
            type="text"
            onChange={e => update("field_name", e.target.value.replace(/\s/g, "_").toLowerCase())}
            onBlur={save}
            style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" }}
          />
        </div>

        {/* Field Type */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Field Type</label>
          <select
            value={localData.field_type || "text"}
            onChange={e => { update("field_type", e.target.value); onChange({...localData, field_type: e.target.value}); }}
            style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff", boxSizing: "border-box" }}
          >
            {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
          </select>
        </div>

        {/* Options */}
        {(localData.field_type === "options" || localData.field_type === "multi_options") && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
              Options <span style={{ color: "#94a3b8", fontWeight: 400 }}>(comma separated)</span>
            </label>
            <input
              value={(localData.options || []).join(", ")}
              onChange={e => update("options", e.target.value.split(",").map(o => o.trim()).filter(Boolean))}
              onBlur={save}
              placeholder="Yes, No, Maybe"
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* Required */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Required field</span>
          <input
            type="checkbox"
            checked={!!localData.is_required}
            onChange={e => update("is_required", e.target.checked)}
            onBlur={save}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
        </div>

        {/* Conditions */}
        <div style={{ background: "#fffbf0", border: "1px solid #fde68a", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>⚡ Conditions</span>
            <button
              onClick={() => update("conditions", [...(localData.conditions || []), { if_answer: "", goto_step: "" }])}
              style={{ background: "#fbbf24", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#78350f", cursor: "pointer" }}
            >
              + Add
            </button>
          </div>

          {(!localData.conditions || localData.conditions.length === 0) ? (
            <p style={{ fontSize: 11, color: "#92400e", margin: 0 }}>No conditions — goes to next step in order.</p>
          ) : (
            localData.conditions.map((cond, ci) => (
              <div key={ci} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <input
                  value={cond.if_answer || ""}
                  placeholder="Answer"
                  onChange={e => {
                    const c = [...localData.conditions];
                    c[ci] = { ...c[ci], if_answer: e.target.value };
                    update("conditions", c);
                  }}
                  onBlur={save}
                  style={{ flex: 1, border: "1px solid #fde68a", borderRadius: 6, padding: "5px 8px", fontSize: 12 }}
                />
                <span style={{ fontSize: 11, color: "#92400e" }}>→</span>
                <select
                  value={cond.goto_step || ""}
                  onChange={e => { update("field_type", e.target.value); onChange({...localData, field_type: e.target.value}); }}
                  style={{ flex: 1, border: "1px solid #fde68a", borderRadius: 6, padding: "5px 6px", fontSize: 11, background: "#fff" }}
                >
                  <option value="">Step?</option>
                  {stepNodes.map(n => (
                    <option key={n.id} value={n.data.order}>{n.data.order}: {n.data.field_name}</option>
                  ))}
                </select>
                <button
                  onChange={e => { update("field_type", e.target.value); onChange({...localData, field_type: e.target.value}); }}
                  style={{ background: "#fee2e2", border: "none", borderRadius: 4, padding: "4px 7px", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                >✕</button>
              </div>
            ))
          )}
        </div>
        {/* Knowledge Base */}
        <div style={{ background: "#f0fff4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, marginTop: 12 }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="mdi mdi-database-outline" style={{ color: "#22c55e" }}></i>
            <strong style={{ fontSize: 12, color: "#15803d" }}>Knowledge Base</strong>
          </div>
          <small className="text-muted d-block mb-2" style={{ fontSize: 10 }}>
            Claude uses this info to answer at this step (product links, pricing, catalog).
          </small>
          <textarea
            rows={4}
            value={localData.knowledge_base || ""}
            placeholder="Paste product links, pricing, catalog..."
            onChange={e => update("knowledge_base", e.target.value)}
            style={{ width: "100%", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 8px", fontSize: 11, fontFamily: "monospace", boxSizing: "border-box", resize: "vertical" }}
          />
        </div>
        <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 12, marginTop: 12 }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="mdi mdi-message-reply-outline" style={{ color: "#3b82f6" }}></i>
            <strong style={{ fontSize: 12, color: "#1d4ed8" }}>Response Message</strong>
          </div>
          <small className="text-muted d-block mb-2" style={{ fontSize: 10 }}>
            Shown after user answers. Use {"{field_name}"} placeholders.
          </small>
          <textarea
            rows={2}
            value={localData.response_message || ""}
            placeholder="e.g. Great! You selected {motor_type}..."
            onChange={e => update("response_message", e.target.value)}
            style={{ width: "100%", border: "1px solid #bfdbfe", borderRadius: 6, padding: "6px 8px", fontSize: 11, boxSizing: "border-box", resize: "vertical" }}
          />
        </div>
      </div>
    </div>
  );
};

// ── Main FlowBuilder ──────────────────────────────────────────────
const FlowBuilder = ({ flowSteps = [], onChange }) => {
  console.log("FlowBuilder re-rendered at", Date.now()); // ADD THIS
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(flowSteps));
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(flowSteps));
  const [selectedNode, setSelectedNode] = useState(null);
  const prevStepsRef = useRef(JSON.stringify(flowSteps));

  useEffect(() => {
    const key = JSON.stringify(flowSteps);
    if (key !== prevStepsRef.current) {
      prevStepsRef.current = key;
      setNodes(buildNodes(flowSteps));
      setEdges(buildEdges(flowSteps));
      setSelectedNode(null);
    }
  }, [flowSteps]); // eslint-disable-line

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params, id: `manual-${Date.now()}`,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#94a3b8", strokeWidth: 2 }, type: "smoothstep",
    }, eds));
  }, []); // eslint-disable-line

  const onNodeClick = useCallback((e, node) => {
    if (node.type === "step") setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    //setSelectedNode(null);
  }, []);

  // Does NOT call setSelectedNode — prevents re-render of StepEditor
  const handleNodeDataChange = useCallback((newData) => {
    setNodes(nds => {
      const updated = nds.map(n =>
        n.id === selectedNode.id ? { ...n, data: newData } : n
      );
      const steps = nodesToSteps(updated);
      setEdges(buildEdges(steps));
      onChange(steps);
      return updated;
    });
  }, [selectedNode, onChange]); // eslint-disable-line

  const handleDeleteNode = useCallback(() => {
    setNodes(nds => {
      const filtered = nds
        .filter(n => n.id !== selectedNode.id)
        .map(n => n.type === "step" && n.data.order > selectedNode.data.order
          ? { ...n, data: { ...n.data, order: n.data.order - 1 } } : n);
      const steps = nodesToSteps(filtered);
      setEdges(buildEdges(steps));
      onChange(steps);
      return filtered;
    });
    setSelectedNode(null);
  }, [selectedNode, onChange]); // eslint-disable-line

  const addStep = useCallback(() => {
    setNodes(nds => {
      const stepNodes = nds.filter(n => n.type === "step");
      const newOrder = stepNodes.length + 1;
      const lastStep = stepNodes[stepNodes.length - 1];
      const newNode = {
        id: `step-${newOrder}`, type: "step",
        position: {
          x: lastStep ? lastStep.position.x + 300 : 400,
          y: lastStep ? lastStep.position.y : 160,
        },
        data: { order: newOrder, question: "New question", field_name: `field_${newOrder}`, field_type: "text", options: [], is_required: false, data_source: "static", api_endpoint: "", api_response_path: "", depends_on_field: "", conditions: [], knowledge_base: "", response_message: "" },
      };
      const updated = [
        ...nds.map(n => n.id === "end" ? { ...n, position: { ...n.position, x: n.position.x + 300 } } : n),
        newNode,
      ];
      const steps = nodesToSteps(updated);
      setEdges(buildEdges(steps));
      onChange(steps);
      return updated;
    });
  }, [onChange]); // eslint-disable-line

  return (
    <div style={{ display: "flex", width: "100%", height: 560, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      {/* Canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={n =>
              n.type === "start" ? "#667eea" :
              n.type === "end" ? "#11998e" :
              FIELD_COLORS[n.data?.field_type]?.border || "#94a3b8"
            }
            style={{ borderRadius: 8 }}
          />
          <Panel position="top-left">
            <button onClick={addStep} style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 16px", fontWeight: 600, fontSize: 13,
              cursor: "pointer", boxShadow: "0 2px 8px rgba(102,126,234,0.4)",
            }}>
              + Add Step
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Editor — outside ReactFlow, zero event conflicts */}
      {selectedNode && (
        <div id="flow-step-editor" style={{ width: 320, borderLeft: "1px solid #e2e8f0", background: "#fff", flexShrink: 0, position: "relative" }}> 
          <StepEditor
            node={selectedNode}
            allNodes={nodes}
            onChange={handleNodeDataChange}
            onClose={() => setSelectedNode(null)}
            onDelete={handleDeleteNode}
          />
        </div>
      )}
    </div>
  );
};

export default FlowBuilder;
