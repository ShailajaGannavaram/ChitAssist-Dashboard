import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, Badge, Input, Alert } from "reactstrap";
import { connect } from "react-redux";
import { setBreadcrumbItems } from "../../store/actions";

const API = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const STATUS_COLORS = { open: "danger", in_progress: "warning", resolved: "success", closed: "secondary" };
const STATUS_LABELS = { open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed" };
const PRIORITY_COLORS = { low: "success", medium: "warning", high: "danger" };

const TicketDetail = ({ setBreadcrumbItems }) => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const user = getAuthUser();
  const isAdmin = user.is_superuser || user.is_staff;
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");

  document.title = `Ticket #${ticketId} | ChitAssist Dashboard`;

  useEffect(() => {
    setBreadcrumbItems(`Ticket #${ticketId}`, [
      { title: "Dashboard", link: "/dashboard" },
      { title: "Tickets", link: "/tickets" },
      { title: `#${ticketId}`, link: "#" },
    ]);
    fetchTicket();
  }, [ticketId]); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`${API}/api/tickets/${ticketId}/detail/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setTicket(data);
      setNewStatus(data.status);
    } catch (e) {
      setError("Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/tickets/${ticketId}/reply/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({ message: replyText, is_internal: isInternal }),
      });
      if (res.ok) {
        setReplyText("");
        setIsInternal(false);
        fetchTicket();
      } else {
        setError("Failed to send reply.");
      }
    } catch (e) {
      setError("Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === ticket.status) return;
    try {
      const res = await fetch(`${API}/api/tickets/${ticketId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSuccess("Status updated successfully.");
        fetchTicket();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (e) {
      setError("Failed to update status.");
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  if (!ticket) return <div className="text-center py-5 text-muted">Ticket not found.</div>;

  return (
    <React.Fragment>
      {success && <Alert color="success" toggle={() => setSuccess("")}>{success}</Alert>}
      {error && <Alert color="danger" toggle={() => setError("")}>{error}</Alert>}

      {/* Ticket Header */}
      <Card className="mb-3">
        <CardBody>
          <div className="d-flex align-items-start justify-content-between">
            <div>
              <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate("/tickets")}>
                <i className="mdi mdi-arrow-left me-1"></i>Back to Tickets
              </button>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>#{ticket.id}</span>
                <Badge color={STATUS_COLORS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
                <Badge color={PRIORITY_COLORS[ticket.priority]}>{ticket.priority.toUpperCase()}</Badge>
                {ticket.bot && (
                  <span style={{ fontSize: 11, background: "#f0f7ff", color: "#3b82f6", borderRadius: 4, padding: "2px 8px" }}>
                    {ticket.bot}
                  </span>
                )}
              </div>
              <h5 className="mb-1">{ticket.title}</h5>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Raised by {ticket.username} · {ticket.created_at}
              </div>
            </div>

            {/* Admin status update */}
            {isAdmin && (
              <div className="d-flex align-items-center gap-2">
                <Input type="select" value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  style={{ width: 140, fontSize: 13 }}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Input>
                <button className="btn btn-sm btn-primary" onClick={handleStatusUpdate}
                  disabled={newStatus === ticket.status}>
                  Update
                </button>
              </div>
            )}
          </div>

          {/* Original description */}
          <div style={{
            background: "#f8f9fa", borderRadius: 8, padding: "12px 16px", marginTop: 16,
            borderLeft: "4px solid #3b82f6",
          }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Original Message</div>
            <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Replies Thread */}
      <Card className="mb-3">
        <CardBody>
          <h6 className="mb-3" style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Conversation ({ticket.replies?.length || 0} replies)
          </h6>

          {(!ticket.replies || ticket.replies.length === 0) ? (
            <div className="text-center text-muted py-4" style={{ fontSize: 13 }}>
              <i className="mdi mdi-chat-outline d-block mb-2" style={{ fontSize: 32 }}></i>
              No replies yet. Be the first to respond.
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: "auto", paddingRight: 4 }}>
              {ticket.replies.map(reply => (
                <div key={reply.id} style={{
                  display: "flex",
                  justifyContent: reply.is_admin ? "flex-start" : "flex-end",
                  marginBottom: 16,
                }}>
                  <div style={{
                    maxWidth: "75%",
                    background: reply.is_internal ? "#fffbf0"
                      : reply.is_admin ? "#f0f7ff" : "#f0fdf4",
                    border: reply.is_internal ? "1px solid #fde68a"
                      : reply.is_admin ? "1px solid #bfdbfe" : "1px solid #bbf7d0",
                    borderRadius: reply.is_admin ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                    padding: "10px 14px",
                  }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ fontSize: 12, fontWeight: 600, color: reply.is_admin ? "#3b82f6" : "#22c55e" }}>
                        {reply.username}
                      </span>
                      {reply.is_admin && (
                        <Badge color="primary" style={{ fontSize: 9 }}>Support</Badge>
                      )}
                      {reply.is_internal && (
                        <Badge color="warning" style={{ fontSize: 9 }}>Internal Note</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {reply.message}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6, textAlign: "right" }}>
                      {reply.created_at}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Reply Box — only show if ticket is not closed */}
      {ticket.status !== "closed" && (
        <Card>
          <CardBody>
            <h6 className="mb-3">Add Reply</h6>
            <Input
              type="textarea"
              rows={4}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              style={{ marginBottom: 12, resize: "vertical" }}
            />
            {/* File upload — ready for future, just uncomment:
            <div className="mb-3">
              <Label>Attachment (optional)</Label>
              <Input type="file" />
            </div>
            */}
            <div className="d-flex align-items-center justify-content-between">
              <div>
                {isAdmin && (
                  <div className="d-flex align-items-center gap-2">
                    <input type="checkbox" id="internal" checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      style={{ cursor: "pointer" }} />
                    <label htmlFor="internal" style={{ fontSize: 13, color: "#d97706", cursor: "pointer", marginBottom: 0 }}>
                      Internal note (hidden from user)
                    </label>
                  </div>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
              >
                {sending
                  ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
                  : <><i className="mdi mdi-send me-1"></i>Send Reply</>
                }
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {ticket.status === "closed" && (
        <div className="text-center text-muted py-3" style={{ fontSize: 13 }}>
          This ticket is closed. <span
            style={{ color: "#3b82f6", cursor: "pointer" }}
            onClick={() => { setNewStatus("open"); handleStatusUpdate(); }}>
            Reopen ticket
          </span>
        </div>
      )}
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(TicketDetail);
