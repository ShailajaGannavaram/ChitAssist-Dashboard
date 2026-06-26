import React, { useEffect, useState, useCallback } from "react";
import { connect } from "react-redux";
import { Row, Col, Card, CardBody, Input, Badge, Label } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";

const API = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const STATUS_OPTIONS = [
  { value: "new",            label: "New",            color: "primary" },
  { value: "contacted",      label: "Contacted",      color: "info" },
  { value: "converted",      label: "Converted",      color: "success" },
  { value: "not_interested", label: "Not Interested", color: "danger" },
];

const getStatusColor = (s) => STATUS_OPTIONS.find(o => o.value === s)?.color || "secondary";
const getStatusLabel = (s) => STATUS_OPTIONS.find(o => o.value === s)?.label || s;

const Leads = ({ setBreadcrumbItems }) => {
  const user = getAuthUser();
  const allUserBots = user.all_bots || user.all_user_bots || [];

  // Bot switcher — default to first bot or user's bot_id
  const [botId, setBotId] = useState(user.bot_id || (allUserBots[0]?.bot_id) || "margadarsi");
  const [botName, setBotName] = useState(user.bot_name || (allUserBots[0]?.bot_name) || "");

  // Lead state
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [pushingId, setPushingId] = useState(null);
  const [pushResult, setPushResult] = useState({});

  // Filter state
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importHistory, setImportHistory] = useState([]);

  document.title = "Leads | ANTS Bot Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Leads", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "Leads", link: "#" },
    ]);
    fetchLeads();
    fetchImportHistory();
  }, [botId]); // eslint-disable-line

  // ── Switch bot ────────────────────────────────────────────────
  const handleBotSwitch = (newBotId) => {
    const bot = allUserBots.find(b => b.bot_id === newBotId);
    setBotId(newBotId);
    setBotName(bot?.bot_name || newBotId);
    setLeads([]);
    setStatusFilter("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  // ── Fetch leads ────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/api/client/leads/?bot_id=${botId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [botId, statusFilter, dateFrom, dateTo]); // eslint-disable-line

  // ── Update lead status ─────────────────────────────────────────
  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`${API}/api/client/leads/${leadId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  // ── Phase 2: Push lead to CRM ─────────────────────────────────
  // Sends lead data to the bot's configured webhook_url (CRM endpoint)
  // Phase 3 will extend this with CRMIntegration model and field mapping
  const handlePushToCRM = async (lead) => {
    setPushingId(lead.id);
    setPushResult(prev => ({ ...prev, [lead.id]: null }));
    try {
      const res = await fetch(`${API}/api/client/leads/${lead.id}/push-crm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access}` },
        body: JSON.stringify({ bot_id: botId }),
      });
      const data = await res.json();
      setPushResult(prev => ({ ...prev, [lead.id]: data.success ? "success" : "error" }));
      // Clear result after 3 seconds
      setTimeout(() => setPushResult(prev => ({ ...prev, [lead.id]: null })), 3000);
    } catch (e) {
      setPushResult(prev => ({ ...prev, [lead.id]: "error" }));
      setTimeout(() => setPushResult(prev => ({ ...prev, [lead.id]: null })), 3000);
    } finally {
      setPushingId(null);
    }
  };

  // ── Import history ─────────────────────────────────────────────
  const fetchImportHistory = async () => {
    try {
      const res = await fetch(`${API}/api/client/leads/import/history/?bot_id=${botId}`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setImportHistory(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // ── Handle CSV import ──────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("bot_id", botId);
      const res = await fetch(`${API}/api/client/leads/import/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.access}` },
        body: formData,
      });
      const data = await res.json();
      setImportResult(data);
      if (data.success) { fetchLeads(); fetchImportHistory(); }
    } catch (e) {
      setImportResult({ error: "Upload failed. Please try again." });
    } finally { setImporting(false); setImportFile(null); }
  };

  // ── Export CSV ─────────────────────────────────────────────────
  const allKeys = Array.from(new Set((leads || []).flatMap(l => Object.keys(l.data || {}))));

  const filtered = (leads || []).filter(lead => {
    const s = search.toLowerCase();
    return !s || allKeys.some(k => String(lead.data?.[k] || "").toLowerCase().includes(s));
  });

  const exportCSV = () => {
    const headers = ["Serial", "Status", ...allKeys, "Date", "Time", "Webhook"];
    const rows = filtered.map(l => [
      `${l.lead_date}#${String(l.serial_number).padStart(3, "0")}`,
      getStatusLabel(l.status),
      ...allKeys.map(k => `"${l.data?.[k] || ""}"`),
      l.lead_date, l.created_at,
      l.webhook_sent ? "Sent" : "Pending",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `leads_${botId}_${dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : "all"}.csv`;
    a.click();
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = (leads || []).filter(l => l.status === s.value).length;
    return acc;
  }, {});

  return (
    <React.Fragment>

      {/* ── Status Summary Cards ── */}
      <Row className="mb-3">
        {STATUS_OPTIONS.map(s => (
          <Col xl={3} key={s.value}>
            <Card
              style={{
                border: `2px solid ${statusFilter === s.value ? "#008ed3" : "#e9ecef"}`,
                cursor: "pointer", background: statusFilter === s.value ? "#f0f7ff" : "#fff",
              }}
              onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)}
            >
              <CardBody className="py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#1e293b" }}>{counts[s.value]}</div>
                    <div style={{ fontSize: 13, color: "#6c757d" }}>{s.label}</div>
                  </div>
                  <Badge color={s.color} style={{ fontSize: 12, padding: "6px 10px" }}>{s.label}</Badge>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>

              {/* ── Header + Bot Switcher + Filters ── */}
              <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                <div>
                  <h4 className="card-title mb-1">All Leads</h4>
                  <p className="text-muted mb-0">
                    Showing <strong>{filtered.length}</strong> of <strong>{leads?.length || 0}</strong> leads
                    for <strong>{botName || botId}</strong>
                    {statusFilter && <> — <Badge color={getStatusColor(statusFilter)}>{getStatusLabel(statusFilter)}</Badge></>}
                  </p>
                  {/* Bot switcher — only shows if client has more than one bot */}
                  {allUserBots.length > 1 && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <small className="text-muted">Switch Bot:</small>
                      <Input type="select" value={botId}
                        onChange={e => handleBotSwitch(e.target.value)}
                        style={{ fontSize: 13, width: "auto", minWidth: 180 }}>
                        {allUserBots.map(b => (
                          <option key={b.bot_id} value={b.bot_id}>{b.bot_name} ({b.bot_id})</option>
                        ))}
                      </Input>
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2 flex-wrap align-items-end">
                  <div>
                    <Label style={{ fontSize: 12, marginBottom: 2 }}>Status</Label>
                    <Input type="select" value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)} style={{ width: 150 }}>
                      <option value="">All Statuses</option>
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Input>
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, marginBottom: 2 }}>From</Label>
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 145 }} />
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, marginBottom: 2 }}>To</Label>
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 145 }} />
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, marginBottom: 2 }}>Search</Label>
                    <Input type="text" placeholder="Name, phone, email..."
                      value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
                  </div>
                  <button className="btn btn-sm btn-outline-primary" style={{ height: 38 }} onClick={fetchLeads}>
                    <i className="mdi mdi-filter me-1"></i>Apply
                  </button>
                  {(dateFrom || dateTo || statusFilter) && (
                    <button className="btn btn-sm btn-outline-secondary" style={{ height: 38 }}
                      onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter(""); }}>
                      Clear
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm" style={{ height: 38 }}
                    onClick={() => { setShowImport(!showImport); setImportResult(null); }}>
                    <i className="mdi mdi-upload me-1"></i>Import CSV
                  </button>
                  <button className="btn btn-success btn-sm" style={{ height: 38 }} onClick={exportCSV}>
                    <i className="mdi mdi-download me-1"></i>Export CSV
                  </button>
                </div>
              </div>

              {/* ── Import Panel ── */}
              {showImport && (
                <div style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                  <h6 className="mb-3"><i className="mdi mdi-upload me-2"></i>Import Leads from CSV</h6>
                  <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
                    <i className="mdi mdi-information-outline me-2"></i>
                    CSV first row must be column headers. Example columns: <strong>name, email, phone, city</strong>
                  </div>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <input type="file" accept=".csv"
                      onChange={e => { setImportFile(e.target.files[0]); setImportResult(null); }}
                      style={{ fontSize: 13 }} />
                    {importFile && <span style={{ fontSize: 12, color: "#22c55e" }}>✓ {importFile.name}</span>}
                    <button className="btn btn-primary btn-sm" onClick={handleImport} disabled={!importFile || importing}>
                      {importing
                        ? <><span className="spinner-border spinner-border-sm me-2" />Importing...</>
                        : <><i className="mdi mdi-upload me-1"></i>Upload & Import</>}
                    </button>
                  </div>
                  {importResult && (
                    <div style={{
                      marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13,
                      background: importResult.success ? "#f0fdf4" : "#fef2f2",
                      border: `1px solid ${importResult.success ? "#bbf7d0" : "#fecaca"}`,
                    }}>
                      {importResult.success ? (
                        <>
                          <strong style={{ color: "#15803d" }}>✓ Import complete!</strong>
                          <span className="ms-2">{importResult.imported} leads imported.</span>
                          {importResult.failed > 0 && <span className="ms-2 text-danger">{importResult.failed} failed.</span>}
                        </>
                      ) : (
                        <span style={{ color: "#dc2626" }}>✗ {importResult.error}</span>
                      )}
                    </div>
                  )}
                  {importHistory.length > 0 && (
                    <div className="mt-3">
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Recent Imports</div>
                      {importHistory.slice(0, 5).map(imp => (
                        <div key={imp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                          <i className="mdi mdi-file-delimited-outline" style={{ color: "#64748b" }}></i>
                          <span style={{ fontWeight: 500 }}>{imp.file_name}</span>
                          <span style={{ color: "#64748b" }}>{imp.imported_count}/{imp.total_rows} rows</span>
                          <span style={{
                            background: imp.status === "done" ? "#f0fdf4" : "#fef2f2",
                            color: imp.status === "done" ? "#15803d" : "#dc2626",
                            borderRadius: 4, padding: "1px 6px", fontSize: 11, fontWeight: 600,
                          }}>{imp.status}</span>
                          <span style={{ color: "#94a3b8", marginLeft: "auto" }}>{imp.created_at}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Leads Table ── */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                  <p className="mt-3 text-muted">Loading leads...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-centered table-hover table-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Serial</th>
                        <th>Status</th>
                        {allKeys.map(k => (
                          <th key={k} style={{ textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</th>
                        ))}
                        <th>Date</th>
                        <th>Time</th>
                        <th>Webhook</th>
                        <th>CRM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={allKeys.length + 7} className="text-center text-muted py-5">
                            <i className="mdi mdi-account-group-outline d-block mb-2" style={{ fontSize: 40 }}></i>
                            {search || dateFrom || dateTo || statusFilter
                              ? "No leads match your filters."
                              : "No leads yet."}
                          </td>
                        </tr>
                      ) : (
                        filtered.map((lead, i) => (
                          <tr key={lead.id || i}>
                            <td style={{ fontSize: 13, color: "#6c757d" }}>{i + 1}</td>
                            <td>
                              <Badge color="primary" style={{ fontSize: 11 }}>
                                {lead.lead_date}#{String(lead.serial_number).padStart(3, "0")}
                              </Badge>
                            </td>
                            <td>
                              {/* Inline status dropdown — change without leaving page */}
                              <Input type="select" value={lead.status || "new"}
                                disabled={updatingId === lead.id}
                                onChange={e => handleStatusChange(lead.id, e.target.value)}
                                style={{
                                  fontSize: 11, padding: "2px 6px", width: 135, height: 28, borderRadius: 6,
                                  border: "1px solid",
                                  borderColor: lead.status === "converted" ? "#22c55e" : lead.status === "not_interested" ? "#ef4444" : lead.status === "contacted" ? "#3b82f6" : "#94a3b8",
                                  color: lead.status === "converted" ? "#15803d" : lead.status === "not_interested" ? "#b91c1c" : lead.status === "contacted" ? "#1d4ed8" : "#475569",
                                }}>
                                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </Input>
                            </td>
                            {allKeys.map(k => (
                              <td key={k} style={{ fontSize: 13 }}>{lead.data?.[k] || "—"}</td>
                            ))}
                            <td style={{ fontSize: 12, color: "#6c757d" }}>{lead.lead_date}</td>
                            <td style={{ fontSize: 12, color: "#6c757d" }}>{lead.created_at}</td>
                            <td>
                              <Badge color={lead.webhook_sent ? "success" : "warning"} style={{ fontSize: 10 }}>
                                {lead.webhook_sent ? "Sent" : "Pending"}
                              </Badge>
                            </td>
                            <td>
                              {/* Phase 2: Push to CRM button
                                  Uses bot's webhook_url as CRM endpoint.
                                  Phase 3 will add CRMIntegration model with field mapping UI */}
                              {pushResult[lead.id] === "success" ? (
                                <span style={{ fontSize: 11, color: "#15803d" }}>✓ Pushed</span>
                              ) : pushResult[lead.id] === "error" ? (
                                <span style={{ fontSize: 11, color: "#dc2626" }}>✗ Failed</span>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ fontSize: 11, padding: "2px 8px" }}
                                  disabled={pushingId === lead.id}
                                  onClick={() => handlePushToCRM(lead)}
                                >
                                  {pushingId === lead.id
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : <><i className="mdi mdi-send me-1"></i>Push</>}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(Leads);

