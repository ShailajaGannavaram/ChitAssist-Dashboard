import React, { useEffect, useState, useCallback } from "react";
import { connect } from "react-redux";
import { Row, Col, Card, CardBody, Input, Badge, Label } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";

const API = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const STATUS_OPTIONS = [
  { value: "new",           label: "New",           color: "primary" },
  { value: "contacted",     label: "Contacted",     color: "info" },
  { value: "converted",     label: "Converted",     color: "success" },
  { value: "not_interested",label: "Not Interested",color: "danger" },
];

const getStatusColor = (status) => STATUS_OPTIONS.find(s => s.value === status)?.color || "secondary";
const getStatusLabel = (status) => STATUS_OPTIONS.find(s => s.value === status)?.label || status;

const Leads = ({ setBreadcrumbItems }) => {
  const user = getAuthUser();
  const botId = user.bot_id || "margadarsi";

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  document.title = "Leads | ChitAssist Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Leads", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "Leads", link: "#" },
    ]);
    fetchLeads();
  }, [botId]); // eslint-disable-line

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

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`${API}/api/client/leads/${leadId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

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
      l.lead_date,
      l.created_at,
      l.webhook_sent ? "Sent" : "Pending",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const label = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : "all";
    a.download = `leads_${botId}_${label}.csv`;
    a.click();
  };

  // Status counts
  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = (leads || []).filter(l => l.status === s.value).length;
    return acc;
  }, {});

  return (
    <React.Fragment>
      {/* Status summary cards */}
      <Row className="mb-3">
        {STATUS_OPTIONS.map(s => (
          <Col xl={3} key={s.value}>
            <Card
              style={{
                border: `1px solid ${statusFilter === s.value ? "#008ed3" : "#e9ecef"}`,
                cursor: "pointer",
                background: statusFilter === s.value ? "#f0f7ff" : "#fff",
              }}
              onClick={() => { setStatusFilter(statusFilter === s.value ? "" : s.value); fetchLeads(); }}
            >
              <CardBody className="py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{counts[s.value]}</div>
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
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                  <h4 className="card-title mb-1">All Leads</h4>
                  <p className="text-muted mb-0">
                    Showing <strong>{filtered.length}</strong> of <strong>{leads?.length || 0}</strong> leads
                    {statusFilter && <> — filtered by <Badge color={getStatusColor(statusFilter)}>{getStatusLabel(statusFilter)}</Badge></>}
                  </p>
                </div>
                <div className="d-flex gap-2 flex-wrap align-items-end">
                  <div>
                    <Label style={{ fontSize: 12, marginBottom: 2 }}>Status</Label>
                    <Input type="select" value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      style={{ width: 150 }}>
                      <option value="">All Statuses</option>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
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
                  <button className="btn btn-success btn-sm" style={{ height: 38 }} onClick={exportCSV}>
                    <i className="mdi mdi-download me-1"></i>Export CSV
                  </button>
                </div>
              </div>

              {/* Table */}
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
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={allKeys.length + 6} className="text-center text-muted py-4">
                            {search || dateFrom || dateTo || statusFilter
                              ? "No leads match your filters"
                              : "No leads yet"}
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
                              <Input
                                type="select"
                                value={lead.status || "new"}
                                disabled={updatingId === lead.id}
                                onChange={e => handleStatusChange(lead.id, e.target.value)}
                                style={{
                                  fontSize: 11, padding: "2px 6px", width: 130, height: 28,
                                  border: `1px solid`,
                                  borderColor: lead.status === "converted" ? "#22c55e"
                                    : lead.status === "not_interested" ? "#ef4444"
                                    : lead.status === "contacted" ? "#3b82f6"
                                    : "#94a3b8",
                                  borderRadius: 6,
                                  color: lead.status === "converted" ? "#15803d"
                                    : lead.status === "not_interested" ? "#b91c1c"
                                    : lead.status === "contacted" ? "#1d4ed8"
                                    : "#475569",
                                }}
                              >
                                {STATUS_OPTIONS.map(s => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
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
