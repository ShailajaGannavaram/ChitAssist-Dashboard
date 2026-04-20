import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody, Input, Badge } from "reactstrap";
import { setBreadcrumbItems, fetchConversations, fetchConversationHistory } from "../../store/actions";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const Conversations = ({ setBreadcrumbItems }) => {
  const dispatch = useDispatch();
  const user = getAuthUser();
  const botId = user.bot_id || "margadarsi";
  const [search, setSearch] = useState("");
  const [offcanvasOpen, setOffcanvasOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  document.title = "Conversations | ChitAssist Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Conversations", [{ title: "Dashboard", link: "/dashboard" }, { title: "Conversations", link: "#" }]);
    dispatch(fetchConversations(botId));
  }, [botId]); // eslint-disable-line

  const { conversations, loading, history, historyLoading } = useSelector((s) => s.Conversations);

  const filtered = (conversations || []).filter((c) =>
    c.session_id?.toLowerCase().includes(search.toLowerCase())
  );

  const openHistory = useCallback((sessionId) => {
    setSelectedSession(sessionId);
    setOffcanvasOpen(true);
    dispatch(fetchConversationHistory(sessionId, botId));
  }, [botId, dispatch]);

  const messages = history?.history || [];

  return (
    <React.Fragment>
      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="card-title mb-1">All Conversations</h4>
                  <p className="text-muted mb-0">Total: <strong>{conversations?.length || 0}</strong> sessions for <strong>{user.bot_name}</strong></p>
                </div>
                <Input type="text" placeholder="Search session ID..." value={search}
                  onChange={(e) => setSearch(e.target.value)} style={{ width: 260 }} />
              </div>

              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-centered table-hover table-nowrap mb-0">
                    <thead className="table-light">
                      <tr><th>#</th><th>Session ID</th><th>Messages</th><th>Started</th><th>Last Active</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-4">{search ? "No match" : "No conversations yet"}</td></tr>
                      ) : filtered.map((conv, i) => (
                        <tr key={conv.id || i}>
                          <td>{i + 1}</td>
                          <td><code style={{ fontSize: 12 }}>{conv.session_id?.substring(0, 20)}...</code></td>
                          <td><Badge color="info">{conv.messages?.length || conv.message_count || 0} msgs</Badge></td>
                          <td>{new Date(conv.created_at).toLocaleString("en-IN")}</td>
                          <td>{new Date(conv.updated_at).toLocaleString("en-IN")}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openHistory(conv.session_id)}>
                              <i className="mdi mdi-eye me-1"></i>View Chat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ── Offcanvas Chat Panel (right side) ── */}
      <>
        {/* Backdrop */}
        {offcanvasOpen && (
          <div onClick={() => setOffcanvasOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1040 }} />
        )}

        {/* Offcanvas Panel */}
        <div style={{
          position: "fixed", top: 0, right: 0, height: "100vh", width: 420,
          background: "#fff", zIndex: 1045, boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
          transform: offcanvasOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e9ecef", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f9fa" }}>
            <div>
              <h6 className="mb-1">Chat History</h6>
              <code style={{ fontSize: 11, color: "#6c757d" }}>{selectedSession?.substring(0, 28)}...</code>
            </div>
            <button className="btn btn-sm btn-light" onClick={() => setOffcanvasOpen(false)}>
              <i className="mdi mdi-close font-size-18"></i>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {historyLoading ? (
              <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted py-4">No messages found</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                      {!isUser && (
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <i className="mdi mdi-robot" style={{ color: "#fff", fontSize: 14 }}></i>
                        </div>
                      )}
                      <div style={{
                        maxWidth: "75%", padding: "9px 13px",
                        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isUser ? "#008ed3" : "#f1f3f7",
                        color: isUser ? "#fff" : "#343a40",
                        fontSize: 13.5, lineHeight: 1.5,
                      }}>
                        <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                        {msg.timestamp && (
                          <div style={{ fontSize: 10, opacity: 0.65, marginTop: 3, textAlign: "right" }}>
                            {new Date(msg.timestamp).toLocaleTimeString("en-IN")}
                          </div>
                        )}
                      </div>
                      {isUser && (
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#34c38f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <i className="mdi mdi-account" style={{ color: "#fff", fontSize: 14 }}></i>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(Conversations);