import React, { useEffect, useState, useCallback } from "react";
import FlowBuilder from "./FlowBuilder";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Input, Label, Alert } from "reactstrap";
import { setBreadcrumbItems, fetchBotConfig, saveBotConfig } from "../../store/actions";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const BotConfig = ({ setBreadcrumbItems, botId: propBotId }) => {
  const dispatch = useDispatch();
  const user = getAuthUser();
  const allUserBots = user.all_bots || user.all_user_bots || [];
  const [botId, setBotIdLocal] = useState(propBotId || user.bot_id || (allUserBots[0]?.bot_id) || "margadarsi");
  const [activeTab, setActiveTab] = useState("1");
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [embedCopied, setEmbedCopied] = useState("");
  document.title = "Bot Configuration | ChitAssist Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Bot Configuration", [{ title: "Dashboard", link: "/dashboard" }, { title: "Bot Config", link: "#" }]);
    dispatch(fetchBotConfig(botId));
  }, [botId]); // eslint-disable-line

  const { config, loading, saving, saveSuccess, saveError } = useSelector((s) => s.BotConfig);

  useEffect(() => {
    if (config && !dirty) setForm({ ...config });
  }, [config]); // eslint-disable-line

  const set = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }, []);

  const handleSave = () => {
    dispatch(saveBotConfig({ ...form, bot_id: botId }));
    setDirty(false);
  };

  const F = ({ label, field, type = "text", help, placeholder }) => (
    <div className="mb-3">
      <Label className="form-label fw-medium">{label}</Label>
      <Input key={field} type={type} value={form?.[field] ?? ""} placeholder={placeholder}
        onChange={(e) => set(field, e.target.value)} />
      {help && <small className="text-muted">{help}</small>}
    </div>
  );

  const Toggle = ({ label, field }) => (
    <div className="d-flex align-items-center justify-content-between mb-3 p-3" style={{ background: "#f8f9fa", borderRadius: 8 }}>
      <span className="fw-medium">{label}</span>
      <div className="form-check form-switch mb-0">
        <input className="form-check-input" type="checkbox" checked={!!form?.[field]}
          onChange={(e) => set(field, e.target.checked)} style={{ width: 40, height: 20, cursor: "pointer" }} />
      </div>
    </div>
  );

  if (loading || !form) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  const flowSteps = form.flow_steps || [];
  const quickSuggestions = form.quick_suggestions || [];
  const FIELD_TYPES = { text: "Text", phone: "Phone", email: "Email", options: "Multiple Choice", multi_options: "Multi-Select", consent: "Consent", state: "State" };

  const chatbotUrl = `https://chitassist.vercel.app/?bot_id=${botId}`;
  const iframeCode = `<iframe\n  src="${chatbotUrl}"\n  width="400"\n  height="600"\n  frameborder="0"\n  allow="microphone"\n  style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15)">\n</iframe>`;
  const scriptCode = `<!-- ${form.bot_name} Chatbot -->\n<script>\n  (function() {\n    var iframe = document.createElement('iframe');\n    iframe.src = '${chatbotUrl}';\n    iframe.style = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:9999';\n    iframe.allow = 'microphone';\n    document.body.appendChild(iframe);\n  })();\n<\/script>`;

  const copyEmbed = (text, type) => {
    navigator.clipboard.writeText(text);
    setEmbedCopied(type);
    setTimeout(() => setEmbedCopied(""), 2000);
  };

  // ── Flow step helpers ─────────────────────────────────────────────
  const updateStep = (i, field, value) => {
    const steps = [...flowSteps];
    steps[i] = { ...steps[i], [field]: value };
    set("flow_steps", steps);
  };

  const addCondition = (stepIndex) => {
    const steps = [...flowSteps];
    const conditions = [...(steps[stepIndex].conditions || [])];
    conditions.push({ if_answer: "", goto_step: "" });
    steps[stepIndex] = { ...steps[stepIndex], conditions };
    set("flow_steps", steps);
  };

  const updateCondition = (stepIndex, condIndex, field, value) => {
    const steps = [...flowSteps];
    const conditions = [...(steps[stepIndex].conditions || [])];
    conditions[condIndex] = { ...conditions[condIndex], [field]: value };
    steps[stepIndex] = { ...steps[stepIndex], conditions };
    set("flow_steps", steps);
  };

  const removeCondition = (stepIndex, condIndex) => {
    const steps = [...flowSteps];
    const conditions = (steps[stepIndex].conditions || []).filter((_, j) => j !== condIndex);
    steps[stepIndex] = { ...steps[stepIndex], conditions };
    set("flow_steps", steps);
  };

  const tabs = ["Basic Info", "Appearance", "Welcome Card", "Flow Steps", "Quick Suggestions", "Webhook & API", "Embed & Share"];

  return (
    <React.Fragment>
      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <div className="d-flex align-items-center gap-4">
                {config.logo_url && <img src={config.logo_url} alt="" style={{ height: 48, objectFit: "contain" }} onError={(e) => e.target.style.display = "none"} />}
                <div>
                  <h4 className="mb-1">{form.bot_name}</h4>
                  <p className="text-muted mb-0">{form.company_name} — <Badge color="secondary">{botId}</Badge></p>
                  {allUserBots.length > 1 && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <small className="text-muted">Switch Bot:</small>
                      <Input type="select" value={botId}
                      onChange={(e) => {
                        setBotIdLocal(e.target.value);
                        setForm(null);
                        setDirty(false);
                        dispatch(fetchBotConfig(e.target.value));
                      }}
                      style={{ fontSize: 13, width: "auto", minWidth: 180 }}>
                      {allUserBots.map((b) => (
                        <option key={b.bot_id} value={b.bot_id}>
                          {b.bot_name} ({b.bot_id})
                        </option>
                      ))}
                      </Input>
                    </div>
                  )}
                </div>
                <div className="ms-auto d-flex gap-2 align-items-center">
                  <a href={chatbotUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                    <i className="mdi mdi-open-in-new me-1"></i>Preview Bot
                  </a>
                  {dirty && <span className="text-warning" style={{ fontSize: 13 }}><i className="mdi mdi-circle-medium"></i> Unsaved changes</span>}
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="mdi mdi-content-save me-1"></i>Save Changes</>}
                  </button>
                </div>
              </div>
              {saveSuccess && <Alert color="success" className="mt-3 mb-0"><i className="mdi mdi-check-circle me-2"></i>Saved successfully!</Alert>}
              {saveError && <Alert color="danger" className="mt-3 mb-0">{saveError}</Alert>}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <Nav tabs className="mb-4">
                {tabs.map((t, i) => (
                  <NavItem key={i}>
                    <NavLink className={activeTab === String(i+1) ? "active" : ""} onClick={() => setActiveTab(String(i+1))} style={{ cursor: "pointer" }}>{t}</NavLink>
                  </NavItem>
                ))}
              </Nav>

              <TabContent activeTab={activeTab}>

                {/* Tab 1: Basic Info */}
                <TabPane tabId="1">
                  <Row>
                    <Col xl={6}><F label="Bot Name" field="bot_name" /></Col>
                    <Col xl={6}><F label="Company Name" field="company_name" /></Col>
                    <Col xl={6}><F label="Tagline" field="tagline" /></Col>
                    <Col xl={6}><F label="Logo URL" field="logo_url" /></Col>
                    <Col xl={12}><F label="Welcome Message" field="welcome_message" type="textarea" /></Col>
                    <Col xl={4}><Toggle label="Voice Enabled" field="voice_enabled" /></Col>
                    <Col xl={4}><Toggle label="Show Progress Bar" field="show_progress" /></Col>
                    <Col xl={4}><Toggle label="Show Blogs" field="show_blogs" /></Col>
                    <Col xl={12}>
                      <F label="Completion Message" field="completion_message" type="textarea"
                        help='Message shown when flow completes. Use {field_name} for user answers. e.g. Thank you {name}! We will call at {phone}.' />
                    </Col>
                  </Row>
                </TabPane>

                {/* Tab 2: Appearance */}
                <TabPane tabId="2">
                  <Row>
                    <Col xl={4}>
                      <F label="Primary Color" field="primary_color" type="color" />
                      <F label="Secondary Color" field="secondary_color" type="color" />
                    </Col>
                    <Col xl={8}>
                      <Label className="form-label fw-medium">Live Preview</Label>
                      <div style={{ background: form.primary_color || "#556ee6", borderRadius: 14, padding: 20, maxWidth: 340 }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                          {form.logo_url && <img src={form.logo_url} alt="" style={{ height: 36, filter: "brightness(0) invert(1)" }} onError={(e) => e.target.style.display = "none"} />}
                          <div>
                            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{form.bot_name}</div>
                            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{form.tagline}</div>
                          </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13 }}>
                          {(form.welcome_message || "").substring(0, 80)}...
                        </div>
                      </div>
                    </Col>
                  </Row>
                </TabPane>

                {/* Tab 3: Welcome Card */}
                <TabPane tabId="3">
                  <Row>
                    <Col xl={12}><Toggle label="Show Stats Box" field="show_stats" /></Col>
                    {form.show_stats && <>
                      <Col xl={4}><F label="Years Value" field="stat_years" /><F label="Years Label" field="stat_years_label" /></Col>
                      <Col xl={4}><F label="Branches Value" field="stat_branches" /><F label="Branches Label" field="stat_branches_label" /></Col>
                      <Col xl={4}><F label="Members Value" field="stat_members" /><F label="Members Label" field="stat_members_label" /></Col>
                    </>}
                    <Col xl={12} className="mt-2"><Toggle label="Show Welcome Buttons" field="show_welcome_buttons" /></Col>
                    {form.show_welcome_buttons && <>
                      <Col xl={6}><F label="Button 1 Text" field="button_1_text" /><F label="Button 1 Action" field="button_1_action" /></Col>
                      <Col xl={6}><F label="Button 2 Text" field="button_2_text" /><F label="Button 2 Action" field="button_2_action" /></Col>
                    </>}
                    <Col xl={12}><Toggle label="Show Welcome Note" field="show_welcome_note" /></Col>
                    {form.show_welcome_note && <Col xl={12}><F label="Welcome Note Text" field="welcome_note" /></Col>}
                  </Row>
                </TabPane>

                {/* Tab 4: Flow Steps — with API + Conditions */}
                <TabPane tabId="4">
                  <div className="mb-3">
                    <h6 className="mb-1">Conversation Flow Builder</h6>
                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                      Drag nodes to rearrange. Click a node to edit it. Connect nodes by dragging from the edge handles.
                      Dashed yellow arrows = conditional routing.
                    </p>
                  </div>
                  <FlowBuilder
                    flowSteps={flowSteps}
                    onChange={(newSteps) => set("flow_steps", newSteps)}
                  />
                  <div className="text-end mt-3">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Flow"}
                    </button>
                  </div>
                </TabPane>

                {/* Tab 5: Quick Suggestions */}
                <TabPane tabId="5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div><h6 className="mb-1">Quick Suggestions</h6><p className="text-muted mb-0" style={{ fontSize: 13 }}>Buttons shown at start of chat.</p></div>
                    <button className="btn btn-sm btn-success" onClick={() => set("quick_suggestions", [...quickSuggestions, { order: quickSuggestions.length + 1, icon: "💬", text: "New suggestion" }])}>
                      <i className="mdi mdi-plus me-1"></i>Add
                    </button>
                  </div>
                  {quickSuggestions.length === 0
                    ? <div className="text-center text-muted py-5"><i className="mdi mdi-gesture-tap-button font-size-36 d-block mb-2"></i>No quick suggestions yet.</div>
                    : quickSuggestions.map((s, i) => (
                      <div key={i} style={{ border: "1px solid #e9ecef", borderRadius: 10, padding: "12px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                        <Input value={s.icon} style={{ width: 60, fontSize: 20, textAlign: "center" }}
                          onChange={(e) => { const arr = [...quickSuggestions]; arr[i] = { ...arr[i], icon: e.target.value }; set("quick_suggestions", arr); }} />
                        <Input value={s.text} placeholder="Button text" style={{ flex: 1 }}
                          onChange={(e) => { const arr = [...quickSuggestions]; arr[i] = { ...arr[i], text: e.target.value }; set("quick_suggestions", arr); }} />
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={() => set("quick_suggestions", quickSuggestions.filter((_, j) => j !== i).map((st, j) => ({ ...st, order: j + 1 })))}>
                          <i className="mdi mdi-delete"></i>
                        </button>
                      </div>
                    ))}
                  <div className="text-end mt-3">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Suggestions"}</button>
                  </div>
                </TabPane>

                {/* Tab 6: Webhook & API */}
                <TabPane tabId="6">
                  <Row>
                    <Col xl={6}>
                      <h6 className="mb-3">Webhook</h6>
                      <Toggle label="Webhook Active" field="webhook_active" />
                      <F label="Webhook URL" field="webhook_url" help="URL to receive lead data" />
                      <F label="Webhook Secret" field="webhook_secret" />
                    </Col>
                    <Col xl={6}>
                      <h6 className="mb-3">External API</h6>
                      <F label="API Endpoint" field="api_endpoint" />
                      <F label="Cities Path" field="api_cities_path" />
                      <F label="Branches Path" field="api_branches_path" />
                      <F label="API Key" field="api_key" />
                    </Col>
                  </Row>
                  <div className="text-end mt-2">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </TabPane>

                {/* Tab 7: Embed & Share */}
                <TabPane tabId="7">
                  <div className="mb-3">
                    <h6>Embed Your Chatbot</h6>
                    <p className="text-muted" style={{ fontSize: 13 }}>Add <strong>{form.bot_name}</strong> to your website.</p>
                  </div>
                  <div style={{ background: "#f4f9fd", border: "1px solid #e0ecf8", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "#445566" }}><strong>Bot URL:</strong> {chatbotUrl}</span>
                    <a href={chatbotUrl} target="_blank" rel="noreferrer" className="btn btn-sm ms-auto"
                      style={{ background: "#008ed3", color: "#fff", border: "none", borderRadius: 6, fontSize: 12 }}>
                      <i className="mdi mdi-open-in-new me-1"></i>Open Bot
                    </a>
                  </div>
                  <Row>
                    <Col xl={6}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Option 1 — iFrame</h6>
                        <button className="btn btn-sm" onClick={() => copyEmbed(iframeCode, "iframe")}
                          style={{ background: embedCopied === "iframe" ? "#34c38f" : "#008ed3", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, padding: "3px 12px" }}>
                          <i className={`mdi ${embedCopied === "iframe" ? "mdi-check" : "mdi-content-copy"} me-1`}></i>
                          {embedCopied === "iframe" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <pre style={{ background: "#fff", border: "1px solid #e0ecf8", borderRadius: 8, padding: "12px", fontSize: 11, overflow: "auto", color: "#334" }}>{iframeCode}</pre>
                    </Col>
                    <Col xl={6}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Option 2 — Floating Widget <Badge color="success" style={{ fontSize: 10 }}>Recommended</Badge></h6>
                        <button className="btn btn-sm" onClick={() => copyEmbed(scriptCode, "script")}
                          style={{ background: embedCopied === "script" ? "#34c38f" : "#008ed3", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, padding: "3px 12px" }}>
                          <i className={`mdi ${embedCopied === "script" ? "mdi-check" : "mdi-content-copy"} me-1`}></i>
                          {embedCopied === "script" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <pre style={{ background: "#fff", border: "1px solid #e0ecf8", borderRadius: 8, padding: "12px", fontSize: 11, overflow: "auto", color: "#334" }}>{scriptCode}</pre>
                      <small className="text-muted">Paste before <code>&lt;/body&gt;</code> tag.</small>
                    </Col>
                  </Row>
                </TabPane>

              </TabContent>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(BotConfig);