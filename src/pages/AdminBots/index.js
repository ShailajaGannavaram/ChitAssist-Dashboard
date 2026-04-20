import React, { useEffect, useState, useCallback } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, CardBody, Badge, Input, Nav, NavItem, NavLink, TabContent, TabPane, Modal, ModalHeader, ModalBody } from "reactstrap";
import { setBreadcrumbItems, fetchConversationHistory } from "../../store/actions";
import { getAdminAllBots, getLeads, getConversations } from "../../helpers/fakebackend_helper";
import BotConfig from "../BotConfig/index";

const AdminBots = ({ setBreadcrumbItems }) => {
  const dispatch = useDispatch();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState(null);
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [offcanvasOpen, setOffcanvasOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [configModal, setConfigModal] = useState(false);
  document.title = "All Bots | ChitAssist Admin";

  const { history, historyLoading } = useSelector((s) => s.Conversations);

  useEffect(() => {
    setBreadcrumbItems("All Bots", [{ title: "Admin", link: "#" }, { title: "All Bots", link: "#" }]);
    getAdminAllBots().then((d) => { setBots(d.bots || []); setLoading(false); }).catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const selectBot = useCallback((bot) => {
    setSelectedBot(bot); setSearch(""); setActiveTab("leads"); setDataLoading(true);
    Promise.all([getLeads(bot.bot_id), getConversations(bot.bot_id)])
      .then(([l, c]) => { setLeads(Array.isArray(l) ? l : []); setConversations(Array.isArray(c) ? c : []); setDataLoading(false); })
      .catch(() => setDataLoading(false));
  }, []);

  const openHistory = useCallback((sessionId) => {
    setSelectedSession(sessionId); setOffcanvasOpen(true);
    dispatch(fetchConversationHistory(sessionId, selectedBot.bot_id));
  }, [dispatch, selectedBot]);

  const messages = history?.history || [];
  const allKeys = Array.from(new Set((leads || []).flatMap((l) => Object.keys(l.data || {}))));
  const filteredLeads = leads.filter((l) => allKeys.some((k) => String(l.data?.[k] || "").toLowerCase().includes(search.toLowerCase())));
  const filteredConvs = conversations.filter((c) => c.session_id?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  return (
    <React.Fragment>
      <Row>
        <Col xl={3}>
          <Card style={{ position: "sticky", top: 80 }}>
            <CardBody>
              <h6 className="mb-3">All Bots <Badge color="primary">{bots.length}</Badge></h6>
              {bots.map((bot) => (
                <div key={bot.bot_id} onClick={() => selectBot(bot)} style={{ padding: 12, borderRadius: 10, marginBottom: 8, cursor: "pointer", border: `2px solid ${selectedBot?.bot_id === bot.bot_id ? bot.primary_color || "#008ed3" : "#e9ecef"}`, background: selectedBot?.bot_id === bot.bot_id ? `${bot.primary_color}11` : "#fff", transition: "all 0.2s" }}>
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: bot.primary_color || "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {bot.logo_url ? <img src={bot.logo_url} alt="" style={{ height: 20, filter: "brightness(0) invert(1)" }} onError={(e) => e.target.style.display = "none"} /> : <i className="mdi mdi-robot" style={{ color: "#fff", fontSize: 16 }}></i>}
                    </div>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{bot.bot_name}</div><div style={{ fontSize: 11, color: "#6c757d" }}>{bot.bot_id}</div></div>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <span style={{ fontSize: 11, background: "#f1f3f7", borderRadius: 6, padding: "2px 8px" }}>📊 {bot.total_leads ?? 0} leads</span>
                    <span style={{ fontSize: 11, background: "#f1f3f7", borderRadius: 6, padding: "2px 8px" }}>💬 {bot.total_conversations ?? 0} convs</span>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </Col>

        <Col xl={9}>
          {!selectedBot ? (
            <Card><CardBody className="text-center py-5 text-muted"><i className="mdi mdi-cursor-pointer font-size-36 d-block mb-2"></i>Select a bot from the left</CardBody></Card>
          ) : (
            <>
              <Card className="mb-3">
                <CardBody>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: selectedBot.primary_color || "#008ed3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectedBot.logo_url ? <img src={selectedBot.logo_url} alt="" style={{ height: 28, filter: "brightness(0) invert(1)" }} onError={(e) => e.target.style.display = "none"} /> : <i className="mdi mdi-robot" style={{ color: "#fff", fontSize: 22 }}></i>}
                    </div>
                    <div><h5 className="mb-0">{selectedBot.bot_name}</h5><small className="text-muted">{selectedBot.company_name} — {selectedBot.bot_id}</small></div>
                    <div className="ms-auto">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => setConfigModal(true)}><i className="mdi mdi-cog me-1"></i>Edit Config</button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Nav tabs>
                      <NavItem><NavLink className={activeTab === "leads" ? "active" : ""} onClick={() => { setActiveTab("leads"); setSearch(""); }} style={{ cursor: "pointer" }}>Leads <Badge color="primary" className="ms-1">{leads.length}</Badge></NavLink></NavItem>
                      <NavItem><NavLink className={activeTab === "conversations" ? "active" : ""} onClick={() => { setActiveTab("conversations"); setSearch(""); }} style={{ cursor: "pointer" }}>Conversations <Badge color="info" className="ms-1">{conversations.length}</Badge></NavLink></NavItem>
                    </Nav>
                    <Input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
                  </div>

                  <TabContent activeTab={activeTab}>
                    <TabPane tabId="leads">
                      {dataLoading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
                        <div className="table-responsive">
                          <table className="table table-centered table-hover table-nowrap mb-0">
                            <thead className="table-light"><tr><th>#</th><th>Serial</th>{allKeys.map((k) => <th key={k} style={{ textTransform: "capitalize" }}>{k}</th>)}<th>Date</th><th>Webhook</th></tr></thead>
                            <tbody>
                              {filteredLeads.length === 0 ? <tr><td colSpan={allKeys.length + 4} className="text-center text-muted py-4">No leads yet</td></tr>
                                : filteredLeads.map((lead, i) => (
                                  <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td><Badge color="primary">{lead.lead_date}#{String(lead.serial_number).padStart(3, "0")}</Badge></td>
                                    {allKeys.map((k) => <td key={k}>{lead.data?.[k] || "—"}</td>)}
                                    <td>{lead.lead_date}</td>
                                    <td><Badge color={lead.webhook_sent ? "success" : "warning"}>{lead.webhook_sent ? "Sent" : "Pending"}</Badge></td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabPane>
                    <TabPane tabId="conversations">
                      {dataLoading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> : (
                        <div className="table-responsive">
                          <table className="table table-centered table-hover table-nowrap mb-0">
                            <thead className="table-light"><tr><th>#</th><th>Session ID</th><th>Messages</th><th>Started</th><th>Action</th></tr></thead>
                            <tbody>
                              {filteredConvs.length === 0 ? <tr><td colSpan={5} className="text-center text-muted py-4">No conversations yet</td></tr>
                                : filteredConvs.map((conv, i) => (
                                  <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td><code style={{ fontSize: 12 }}>{conv.session_id?.substring(0, 20)}...</code></td>
                                    <td><Badge color="info">{conv.messages?.length || conv.message_count || 0} msgs</Badge></td>
                                    <td>{new Date(conv.created_at).toLocaleString("en-IN")}</td>
                                    <td><button className="btn btn-sm btn-outline-primary" onClick={() => openHistory(conv.session_id)}><i className="mdi mdi-eye me-1"></i>View</button></td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabPane>
                  </TabContent>
                </CardBody>
              </Card>
            </>
          )}
        </Col>
      </Row>

      {/* Offcanvas Chat */}
      {offcanvasOpen && <div onClick={() => setOffcanvasOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1040 }} />}
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 420, background: "#fff", zIndex: 1045, boxShadow: "-4px 0 24px rgba(0,0,0,0.15)", transform: offcanvasOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s ease", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e9ecef", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f9fa" }}>
          <div><h6 className="mb-1">Chat History</h6><code style={{ fontSize: 11, color: "#6c757d" }}>{selectedSession?.substring(0, 28)}...</code></div>
          <button className="btn btn-sm btn-light" onClick={() => setOffcanvasOpen(false)}><i className="mdi mdi-close font-size-18"></i></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {historyLoading ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
            : messages.length === 0 ? <p className="text-center text-muted py-4">No messages found</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                      {!isUser && <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><i className="mdi mdi-robot" style={{ color: "#fff", fontSize: 14 }}></i></div>}
                      <div style={{ maxWidth: "75%", padding: "9px 13px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isUser ? "#008ed3" : "#f1f3f7", color: isUser ? "#fff" : "#343a40", fontSize: 13.5, lineHeight: 1.5 }}>
                        <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                        {msg.timestamp && <div style={{ fontSize: 10, opacity: 0.65, marginTop: 3, textAlign: "right" }}>{new Date(msg.timestamp).toLocaleTimeString("en-IN")}</div>}
                      </div>
                      {isUser && <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#34c38f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><i className="mdi mdi-account" style={{ color: "#fff", fontSize: 14 }}></i></div>}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      {/* Bot Config Modal */}
      <Modal isOpen={configModal} toggle={() => setConfigModal(false)} size="xl" scrollable>
        <ModalHeader toggle={() => setConfigModal(false)}>Edit Bot — {selectedBot?.bot_name}</ModalHeader>
        <ModalBody>{selectedBot && <BotConfig botId={selectedBot.bot_id} setBreadcrumbItems={() => {}} />}</ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(AdminBots);