import React, { useEffect, useState } from "react";
import { Card, CardBody, Badge, Input, Row, Col } from "reactstrap";
import { connect } from "react-redux";
import { setBreadcrumbItems } from "../../store/actions";

const API = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const ACTION_LABELS = {
  bot_config_updated: { label: "Config Updated", color: "primary" },
  flow_steps_updated: { label: "Flow Updated", color: "info" },
  bot_created:        { label: "Bot Created", color: "success" },
  bot_status_changed: { label: "Status Changed", color: "warning" },
  user_created:       { label: "User Created", color: "success" },
  user_updated:       { label: "User Updated", color: "primary" },
  user_deleted:       { label: "User Deleted", color: "danger" },
};

const ActivityLog = ({ setBreadcrumbItems }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const user = getAuthUser();

  document.title = "Activity Log | ChitAssist Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Activity Log", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "Activity Log", link: "#" },
    ]);
    fetchLogs();
  }, []); // eslint-disable-line

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API}/api/activity-logs/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.toLowerCase().includes(search.toLowerCase()) ||
      log.bot?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || log.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <React.Fragment>
      <Row className="mb-3">
        <Col xl={12}>
          <Card>
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-1">Activity Log</h5>
                  <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                    Track all changes made in the dashboard.
                  </p>
                </div>
                <button className="btn btn-sm btn-outline-primary" onClick={fetchLogs}>
                  <i className="mdi mdi-refresh me-1"></i>Refresh
                </button>
              </div>

              <Row className="mb-3">
                <Col xl={6}>
                  <Input
                    placeholder="Search by user, bot, or description..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </Col>
                <Col xl={3}>
                  <Input type="select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                    <option value="">All Actions</option>
                    {Object.entries(ACTION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Input>
                </Col>
                <Col xl={3}>
                  <div className="d-flex align-items-center h-100">
                    <small className="text-muted">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</small>
                  </div>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="mdi mdi-history font-size-36 d-block mb-2"></i>
                  No activity logs found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-nowrap mb-0">
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr>
                        <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Time</th>
                        <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>User</th>
                        <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Action</th>
                        <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Bot</th>
                        <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(log => {
                        const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "secondary" };
                        return (
                          <tr key={log.id}>
                            <td style={{ fontSize: 12, color: "#6c757d", whiteSpace: "nowrap" }}>
                              {log.created_at}
                            </td>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{log.username}</div>
                              <div style={{ fontSize: 11, color: "#6c757d" }}>{log.user}</div>
                            </td>
                            <td>
                              <Badge color={actionInfo.color} style={{ fontSize: 10 }}>
                                {actionInfo.label}
                              </Badge>
                            </td>
                            <td>
                              {log.bot ? (
                                <span style={{ fontSize: 12, background: "#f0f7ff", color: "#3b82f6", borderRadius: 4, padding: "2px 8px" }}>
                                  {log.bot}
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, color: "#adb5bd" }}>—</span>
                              )}
                            </td>
                            <td style={{ fontSize: 13, maxWidth: 400 }}>
                              {log.description}
                            </td>
                          </tr>
                        );
                      })}
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

export default connect(null, { setBreadcrumbItems })(ActivityLog);
