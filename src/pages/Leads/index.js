import React, { useEffect, useState } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody, Input, Badge, Label } from "reactstrap";
import { setBreadcrumbItems, fetchLeads } from "../../store/actions";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const Leads = ({ setBreadcrumbItems }) => {
  const dispatch = useDispatch();
  const user = getAuthUser();
  const botId = user.bot_id || "margadarsi";
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  document.title = "Leads | ChitAssist Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Leads", [{ title: "Dashboard", link: "/dashboard" }, { title: "Leads", link: "#" }]);
    dispatch(fetchLeads(botId));
  }, [botId]); // eslint-disable-line

  const { leads, loading } = useSelector((s) => s.Leads);
  const allKeys = Array.from(new Set((leads || []).flatMap((l) => Object.keys(l.data || {}))));

  const filtered = (leads || []).filter((lead) => {
    const s = search.toLowerCase();
    const matchSearch = !s || allKeys.some((k) => String(lead.data?.[k] || "").toLowerCase().includes(s));
    const leadDate = lead.lead_date || "";
    const matchFrom = !dateFrom || leadDate >= dateFrom;
    const matchTo = !dateTo || leadDate <= dateTo;
    return matchSearch && matchFrom && matchTo;
  });

  const exportCSV = () => {
    const headers = ["Serial", ...allKeys, "Date", "Webhook"];
    const rows = filtered.map((l) => [
      `${l.lead_date}#${String(l.serial_number).padStart(3, "0")}`,
      ...allKeys.map((k) => `"${l.data?.[k] || ""}"`),
      l.lead_date,
      l.webhook_sent ? "Sent" : "Pending",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const label = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : "all";
    a.download = `leads_${botId}_${label}.csv`;
    a.click();
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /><p className="mt-3 text-muted">Loading leads...</p></div>;

  return (
    <React.Fragment>
      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                  <h4 className="card-title mb-1">All Leads</h4>
                  <p className="text-muted mb-0">
                    Showing <strong>{filtered.length}</strong> of <strong>{leads?.length || 0}</strong> leads for <strong>{user.bot_name}</strong>
                  </p>
                </div>
                <div className="d-flex gap-2 flex-wrap align-items-end">
                  <div>
                    <Label style={{ fontSize: 12, marginBottom: 2 }}>From</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 145 }} />
                  </div>
                  <div>
                    <Label style={{ fontSize: 12, marginBottom: 2 }}>To</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 145 }} />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                      Clear
                    </button>
                  )}
                  <div>
                    <Label style={{ fontSize: 12, marginBottom: 2 }}>Search</Label>
                    <Input type="text" placeholder="Name, phone, email..." value={search}
                      onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
                  </div>
                  <button className="btn btn-success btn-sm" style={{ height: 38 }} onClick={exportCSV}>
                    <i className="mdi mdi-download me-1"></i>Export CSV
                    {(dateFrom || dateTo) && <span style={{ fontSize: 10, marginLeft: 4 }}>({filtered.length})</span>}
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-centered table-hover table-nowrap mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Serial</th>
                      {allKeys.map((k) => <th key={k} style={{ textTransform: "capitalize" }}>{k}</th>)}
                      <th>Date</th>
                      <th>Webhook</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={allKeys.length + 4} className="text-center text-muted py-4">
                        {search || dateFrom || dateTo ? "No leads match your filters" : "No leads yet"}
                      </td></tr>
                    ) : (
                      filtered.map((lead, i) => (
                        <tr key={lead.id || i}>
                          <td>{i + 1}</td>
                          <td><Badge color="primary">{lead.lead_date}#{String(lead.serial_number).padStart(3, "0")}</Badge></td>
                          {allKeys.map((k) => <td key={k}>{lead.data?.[k] || "—"}</td>)}
                          <td>{lead.lead_date}</td>
                          <td><Badge color={lead.webhook_sent ? "success" : "warning"}>{lead.webhook_sent ? "Sent" : "Pending"}</Badge></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(Leads);