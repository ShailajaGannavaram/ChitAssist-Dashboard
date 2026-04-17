import React, { useEffect, useState } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody, Input, Badge, Modal, ModalHeader, ModalBody } from "reactstrap";
import { setBreadcrumbItems, fetchConversations, fetchConversationHistory } from "../../store/actions";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const Conversations = (props) => {
  const dispatch = useDispatch();
  const user = getAuthUser();
  const botId = user.bot_id || "margadarsi";
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  document.title = "Conversations | ChitAssist Dashboard";

  useEffect(() => {
    props.setBreadcrumbItems("Conversations", [{ title: "Dashboard", link: "/dashboard" }, { title: "Conversations", link: "#" }]);
    dispatch(fetchConversations(botId));
  }, [botId]);

  const { conversations, loading, history, historyLoading } = useSelector((s) => s.Conversations);

  const filtered = (conversations || []).filter((c) =>
    c.session_id?.toLowerCase().includes(search.toLowerCase())
  );

  const openHistory = (sessionId) => {
    setSelectedSession(sessionId);
    setModal(true);
    dispatch(fetchConversationHistory(sessionId, botId));
  };

  // Django returns { history: [ {role, content, timestamp}, ... ] }
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
                <Input type="text" placeholder="Search session ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 260 }} />
              </div>

              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /><p className="mt-3 text-muted">Loading...</p></div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-centered table-hover table-nowrap mb-0">
                    <thead className="table-light">
                      <tr><th>#</th><th>Session ID</th><th>Messages</th><th>Started</th><th>Last Active</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-4">{search ? "No match" : "No conversations yet"}</td></tr>
                      ) : (
                        filtered.map((conv, i) => (
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

      <Modal isOpen={modal} toggle={() => setModal(false)} size="lg" scrollable>
        <ModalHeader toggle={() => setModal(false)}>
          Chat History — <code style={{ fontSize: 12 }}>{selectedSession?.substring(0, 24)}...</code>
        </ModalHeader>
        <ModalBody style={{ maxHeight: "70vh", overflowY: "auto", padding: 20 }}>
          {historyLoading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted py-4">No messages found</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                    {!isUser && (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#556ee6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className="mdi mdi-robot" style={{ color: "#fff", fontSize: 16 }}></i>
                      </div>
                    )}
                    <div style={{
                      maxWidth: "72%", padding: "10px 14px",
                      borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isUser ? "#556ee6" : "#f8f9fa",
                      color: isUser ? "#fff" : "#495057",
                      fontSize: 14, lineHeight: 1.5,
                    }}>
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                      {msg.timestamp && (
                        <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: "right" }}>
                          {new Date(msg.timestamp).toLocaleTimeString("en-IN")}
                        </div>
                      )}
                    </div>
                    {isUser && (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#34c38f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className="mdi mdi-account" style={{ color: "#fff", fontSize: 16 }}></i>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(Conversations);