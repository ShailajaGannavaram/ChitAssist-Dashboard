import React, { useEffect, useState } from "react";
import { Card, CardBody, Badge, Input, Label, Row, Col, Alert, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { connect } from "react-redux";
import { setBreadcrumbItems } from "../../store/actions";
import { useNavigate } from "react-router-dom";
// inside component:

const API = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const STATUS_COLORS = {
  open:        "danger",
  in_progress: "warning",
  resolved:    "success",
  closed:      "secondary",
};

const STATUS_LABELS = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
};

const PRIORITY_COLORS = {
  low:    "success",
  medium: "warning",
  high:   "danger",
};


const Tickets = ({ setBreadcrumbItems }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const navigate = useNavigate();

  const user = getAuthUser();
  const isAdmin = user.is_superuser;

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    bot_id: user.bot_id || "",
  });

  document.title = "Support Tickets | ChitAssist Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Support Tickets", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "Tickets", link: "#" },
    ]);
    fetchTickets();
  }, []); // eslint-disable-line

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API}/api/tickets/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/tickets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Ticket #${data.ticket_id} raised successfully! You will receive a confirmation email.`);
        setShowForm(false);
        setForm({ title: "", description: "", priority: "medium", bot_id: user.bot_id || "" });
        fetchTickets();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Failed to raise ticket.");
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !selectedTicket) return;
    try {
      const res = await fetch(`${API}/api/tickets/${selectedTicket.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSuccess("Ticket status updated successfully.");
        setSelectedTicket(null);
        setError("");
        fetchTickets();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update status.");
      }
    } catch (e) {
      setError("Failed to update status.");
    }
  };

  const filtered = tickets.filter(t => !statusFilter || t.status === statusFilter);

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  return (
    <React.Fragment>
      {success && <Alert color="success">{success}</Alert>}
      {error && <Alert color="danger" toggle={() => setError("")}>{error}</Alert>}

      {/* Stats */}
      <Row className="mb-3">
        {[
          { label: "Open", count: stats.open, color: "#ef4444", bg: "#fef2f2" },
          { label: "In Progress", count: stats.in_progress, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Resolved", count: stats.resolved, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Closed", count: stats.closed, color: "#6b7280", bg: "#f9fafb" },
        ].map((s, i) => (
          <Col xl={3} key={i}>
            <Card style={{ border: `1px solid ${s.color}22`, background: s.bg }}>
              <CardBody className="py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</div>
                  </div>
                  <i className="mdi mdi-ticket" style={{ fontSize: 32, color: s.color + "44" }}></i>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <CardBody>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="mb-1">Support Tickets</h5>
              <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                {isAdmin ? "Manage all support tickets." : "Raise and track your support tickets."}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-primary" onClick={fetchTickets}>
                <i className="mdi mdi-refresh me-1"></i>Refresh
              </button>
              {!isAdmin && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowForm(!showForm)}>
                  <i className="mdi mdi-plus me-1"></i>Raise Ticket
                </button>
              )}
            </div>
          </div>

          {/* Raise Ticket Form */}
          {showForm && (
            <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 20, marginBottom: 20, border: "1px solid #e9ecef" }}>
              <h6 className="mb-3">New Support Ticket</h6>
              <Row>
                <Col xl={8}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Title</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Brief description of the issue" />
                  </div>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Description</Label>
                    <Input type="textarea" rows={4} value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Detailed description of the issue, steps to reproduce, expected behavior..." />
                  </div>
                </Col>
                <Col xl={4}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Priority</Label>
                    <Input type="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Input>
                  </div>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Bot ID</Label>
                    <Input value={form.bot_id} onChange={e => setForm(f => ({ ...f, bot_id: e.target.value }))}
                      placeholder="e.g. margadarsi" />
                  </div>
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-primary flex-fill" onClick={handleSubmit} disabled={loading}>
                      {loading ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : <><i className="mdi mdi-send me-1"></i>Submit Ticket</>}
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* Filter */}
          <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ display: "flex", gap: 8 }}>
              {["", "open", "in_progress", "resolved", "closed"].map(s => (
                <button key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline-secondary"}`}
                  style={{ fontSize: 12 }}>
                  {s === "" ? "All" : STATUS_LABELS[s]}
                  {s !== "" && <span className="ms-1">({stats[s] || 0})</span>}
                </button>
              ))}
            </div>
            <small className="text-muted ms-auto">{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</small>
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="mdi mdi-ticket-outline font-size-36 d-block mb-2"></i>
              {statusFilter ? `No ${STATUS_LABELS[statusFilter]} tickets.` : "No tickets yet."}
              {!isAdmin && !showForm && (
                <div className="mt-2">
                  <button className="btn btn-sm btn-primary" onClick={() => setShowForm(true)}>
                    Raise your first ticket
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {filtered.map(ticket => (
                <div key={ticket.id} style={{
                  border: "1px solid #e9ecef", borderRadius: 10, padding: "16px 20px",
                  marginBottom: 12, background: "#fff",
                  borderLeft: `4px solid ${ticket.priority === "high" ? "#ef4444" : ticket.priority === "medium" ? "#f59e0b" : "#22c55e"}`,
                }}>
                  <div className="d-flex align-items-start justify-content-between">
                    <div style={{ flex: 1 }}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>#{ticket.id}</span>
                        <Badge color={STATUS_COLORS[ticket.status]} style={{ fontSize: 10 }}>
                          {STATUS_LABELS[ticket.status]}
                        </Badge>
                        <Badge color={PRIORITY_COLORS[ticket.priority]} style={{ fontSize: 10 }}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                        {ticket.bot && (
                          <span style={{ fontSize: 11, background: "#f0f7ff", color: "#3b82f6", borderRadius: 4, padding: "1px 6px" }}>
                            {ticket.bot}
                          </span>
                        )}
                      </div>
                      <div
                        style={{ fontWeight: 600, fontSize: 14, color: "#3b82f6", marginBottom: 4, cursor: "pointer" }}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        
                        
                      >
                        {ticket.title} <i className="mdi mdi-arrow-right" style={{ fontSize: 12 }}></i>
                      </div>
                      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8, lineHeight: 1.5 }}>
                        {ticket.description.length > 150
                          ? ticket.description.substring(0, 150) + "..."
                          : ticket.description}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {isAdmin && <span className="me-3">By: {ticket.username} ({ticket.user})</span>}
                        <span className="me-3">Raised: {ticket.created_at}</span>
                        <span>Updated: {ticket.updated_at}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        className="btn btn-sm btn-outline-primary ms-3"
                        onClick={() => { setSelectedTicket(ticket); setNewStatus(ticket.status); }}
                        style={{ flexShrink: 0 }}>
                        Update Status
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Status Update Modal */}
      <Modal isOpen={!!selectedTicket} toggle={() => setSelectedTicket(null)}>
        <ModalHeader toggle={() => setSelectedTicket(null)}>
          Update Ticket #{selectedTicket?.id}
        </ModalHeader>
        <ModalBody>
          <p className="text-muted" style={{ fontSize: 13 }}>{selectedTicket?.title}</p>
          <Label className="form-label fw-medium">New Status</Label>
          <Input type="select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Input>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-primary" onClick={handleStatusUpdate}>Update</button>
          <button className="btn btn-outline-secondary" onClick={() => setSelectedTicket(null)}>Cancel</button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};



export default connect(null, { setBreadcrumbItems })(Tickets);
