import React, { useEffect, useState, useCallback } from "react";
import FlowBuilder from "./FlowBuilder";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Input, Label, Alert } from "reactstrap";
import { setBreadcrumbItems, fetchBotConfig, saveBotConfig } from "../../store/actions";

const API = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

// ── F and Toggle are OUTSIDE BotConfig to prevent focus loss on re-render ──
// If defined inside, every keystroke re-renders BotConfig and recreates these
// components, causing React to unmount/remount inputs and lose focus.
const F = ({ label, field, type = "text", help, placeholder, form, set }) => (
  <div className="mb-3">
    <Label className="form-label fw-medium">{label}</Label>
    <Input
      type={type}
      value={form?.[field] ?? ""}
      placeholder={placeholder}
      onChange={(e) => set(field, e.target.value)}
    />
    {help && <small className="text-muted">{help}</small>}
  </div>
);

const Toggle = ({ label, field, form, set }) => (
  <div className="d-flex align-items-center justify-content-between mb-3 p-3" style={{ background: "#f8f9fa", borderRadius: 8 }}>
    <span className="fw-medium">{label}</span>
    <div className="form-check form-switch mb-0">
      <input
        className="form-check-input"
        type="checkbox"
        checked={!!form?.[field]}
        onChange={(e) => set(field, e.target.checked)}
        style={{ width: 40, height: 20, cursor: "pointer" }}
      />
    </div>
  </div>
);

// ── CRM Integration Tab — Phase 3 ─────────────────────────────────────────
// Supports: Generic REST, Zoho CRM, HubSpot, Salesforce, Odoo
// Per-bot configuration — each bot can have its own CRM
// Supports auto-push on new lead + manual push from leads page
const CRM_TYPES = [
  { value: "generic_rest", label: "Generic REST API", color: "#6c757d" },
  { value: "zoho",         label: "Zoho CRM",         color: "#e02020" },
  { value: "hubspot",      label: "HubSpot",           color: "#ff7a59" },
  { value: "salesforce",   label: "Salesforce",        color: "#0070d2" },
  { value: "odoo",         label: "Odoo",              color: "#714B67" },
];

// Pre-filled API endpoints for known CRMs — client only needs to paste API key
const CRM_ENDPOINTS = {
  zoho:        "https://www.zohoapis.com/crm/v3/Leads",
  hubspot:     "https://api.hubapi.com/crm/v3/objects/contacts",
  salesforce:  "", // needs instance URL from client
  odoo:        "", // needs instance URL from client
  generic_rest: "",
};

const CRMTab = ({ botId, form, set, handleSave, saving, dirty }) => {
  const user = getAuthUser();
  const [crmForm, setCrmForm] = useState({
    crm_type: "generic_rest",
    name: "",
    api_key: "",
    api_endpoint: "",
    auto_push: false,
    is_active: true,
    field_mapping: {},
  });
  const [crmLoading, setCrmLoading] = useState(true);
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmSuccess, setCrmSuccess] = useState("");
  const [crmError, setCrmError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [fieldMappingRaw, setFieldMappingRaw] = useState("");

  useEffect(() => {
    fetchCRM();
  }, [botId]); // eslint-disable-line

  const fetchCRM = async () => {
    setCrmLoading(true);
    try {
      const res = await fetch(`${API}/api/crm/config/?bot_id=${botId}`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setCrmForm(data);
          setFieldMappingRaw(JSON.stringify(data.field_mapping || {}, null, 2));
        }
      }
    } catch (e) { console.error(e); }
    finally { setCrmLoading(false); }
  };

  const handleCrmTypeChange = (type) => {
    setCrmForm(f => ({
      ...f,
      crm_type: type,
      api_endpoint: CRM_ENDPOINTS[type] || f.api_endpoint,
    }));
  };

  const saveCRM = async () => {
    setCrmSaving(true);
    setCrmError("");
    setCrmSuccess("");
    try {
      // Parse field mapping JSON
      let mapping = {};
      if (fieldMappingRaw.trim()) {
        try { mapping = JSON.parse(fieldMappingRaw); }
        catch { setCrmError("Field mapping is not valid JSON. Please fix it."); setCrmSaving(false); return; }
      }
      const payload = { ...crmForm, field_mapping: mapping, bot_id: botId };
      const res = await fetch(`${API}/api/crm/config/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCrmSuccess("CRM configuration saved successfully!");
        setCrmForm(prev => ({ ...prev, id: data.id }));
        setTimeout(() => setCrmSuccess(""), 3000);
      } else {
        setCrmError(data.error || "Failed to save CRM configuration.");
      }
    } catch (e) { setCrmError("Something went wrong. Please try again."); }
    finally { setCrmSaving(false); }
  };

  const testCRM = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API}/api/crm/test/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.access}` },
        body: JSON.stringify({ bot_id: botId }),
      });
      const data = await res.json();
      setTestResult(data.success ? { ok: true, msg: "Connection successful! CRM is reachable." } : { ok: false, msg: data.error || "Connection failed." });
    } catch (e) { setTestResult({ ok: false, msg: "Could not reach the server." }); }
    finally { setTesting(false); }
  };

  if (crmLoading) return <div className="text-center py-4"><div className="spinner-border text-primary" /></div>;

  const selectedCRM = CRM_TYPES.find(c => c.value === crmForm.crm_type);

  return (
    <div>
      {crmSuccess && <Alert color="success" toggle={() => setCrmSuccess("")}>{crmSuccess}</Alert>}
      {crmError && <Alert color="danger" toggle={() => setCrmError("")}>{crmError}</Alert>}

      {/* CRM type selector */}
      <div className="mb-4">
        <Label className="form-label fw-medium">Select CRM Type</Label>
        <div className="d-flex gap-2 flex-wrap">
          {CRM_TYPES.map(crm => (
            <button key={crm.value}
              onClick={() => handleCrmTypeChange(crm.value)}
              style={{
                border: `2px solid ${crmForm.crm_type === crm.value ? crm.color : "#e9ecef"}`,
                borderRadius: 8, padding: "8px 16px", background: crmForm.crm_type === crm.value ? crm.color + "15" : "#fff",
                color: crmForm.crm_type === crm.value ? crm.color : "#6c757d",
                fontWeight: crmForm.crm_type === crm.value ? 600 : 400,
                cursor: "pointer", fontSize: 13,
              }}>
              {crm.label}
            </button>
          ))}
        </div>
      </div>

      <Row>
        <Col xl={6}>
          {/* Connection details */}
          <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <h6 className="mb-3" style={{ color: selectedCRM?.color }}>
              {selectedCRM?.label} Configuration
            </h6>

            <div className="mb-3">
              <Label className="form-label fw-medium">Connection Name</Label>
              <Input value={crmForm.name} placeholder={`e.g. Our ${selectedCRM?.label}`}
                onChange={e => setCrmForm(f => ({ ...f, name: e.target.value }))} />
              <small className="text-muted">A label to identify this CRM connection</small>
            </div>

            {/* API endpoint — pre-filled for known CRMs, editable for generic/salesforce/odoo */}
            <div className="mb-3">
              <Label className="form-label fw-medium">API Endpoint</Label>
              <Input value={crmForm.api_endpoint}
                placeholder="https://api.yourcrm.com/leads"
                onChange={e => setCrmForm(f => ({ ...f, api_endpoint: e.target.value }))} />
              {crmForm.crm_type === "zoho" && (
                <small className="text-muted">Pre-filled with Zoho's leads endpoint. Change region if needed (EU: zohoapis.eu)</small>
              )}
              {crmForm.crm_type === "hubspot" && (
                <small className="text-muted">Pre-filled with HubSpot contacts endpoint.</small>
              )}
              {(crmForm.crm_type === "salesforce" || crmForm.crm_type === "odoo") && (
                <small className="text-muted">Enter your instance URL e.g. https://yourcompany.salesforce.com/services/data/v57.0/sobjects/Lead</small>
              )}
            </div>

            {/* API Key */}
            <div className="mb-3">
              <Label className="form-label fw-medium">
                {crmForm.crm_type === "zoho" ? "Zoho OAuth Access Token" :
                 crmForm.crm_type === "hubspot" ? "HubSpot Private App Token" :
                 crmForm.crm_type === "salesforce" ? "Salesforce Access Token" :
                 "API Key / Bearer Token"}
              </Label>
              <Input type="password" value={crmForm.api_key}
                placeholder="Paste your API key or access token here"
                onChange={e => setCrmForm(f => ({ ...f, api_key: e.target.value }))} />
              <small className="text-muted">
                {crmForm.crm_type === "zoho" && "Get from Zoho Developer Console → OAuth → Generate Token"}
                {crmForm.crm_type === "hubspot" && "Get from HubSpot → Settings → Private Apps → Create App"}
                {crmForm.crm_type === "salesforce" && "Get from Salesforce → Setup → Security → Session Settings"}
                {crmForm.crm_type === "odoo" && "Get from Odoo → Settings → Technical → API Keys"}
                {crmForm.crm_type === "generic_rest" && "Bearer token or API key to include in Authorization header"}
              </small>
            </div>

            {/* Auto push toggle */}
            <div className="d-flex align-items-center justify-content-between p-3 mb-3" style={{ background: "#fff", borderRadius: 8, border: "1px solid #e9ecef" }}>
              <div>
                <div className="fw-medium" style={{ fontSize: 14 }}>Auto Push New Leads</div>
                <small className="text-muted">Automatically push every new lead to {selectedCRM?.label} when collected</small>
              </div>
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" checked={!!crmForm.auto_push}
                  onChange={e => setCrmForm(f => ({ ...f, auto_push: e.target.checked }))}
                  style={{ width: 40, height: 20, cursor: "pointer" }} />
              </div>
            </div>

            {/* Active toggle */}
            <div className="d-flex align-items-center justify-content-between p-3" style={{ background: "#fff", borderRadius: 8, border: "1px solid #e9ecef" }}>
              <div>
                <div className="fw-medium" style={{ fontSize: 14 }}>Integration Active</div>
                <small className="text-muted">Enable or disable this CRM connection</small>
              </div>
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" checked={!!crmForm.is_active}
                  onChange={e => setCrmForm(f => ({ ...f, is_active: e.target.checked }))}
                  style={{ width: 40, height: 20, cursor: "pointer" }} />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={saveCRM} disabled={crmSaving}>
              {crmSaving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="mdi mdi-content-save me-1"></i>Save CRM Config</>}
            </button>
            <button className="btn btn-outline-secondary" onClick={testCRM} disabled={testing || !crmForm.api_endpoint}>
              {testing ? <><span className="spinner-border spinner-border-sm me-2" />Testing...</> : <><i className="mdi mdi-connection me-1"></i>Test Connection</>}
            </button>
          </div>

          {/* Test result */}
          {testResult && (
            <div style={{
              marginTop: 12, padding: "8px 14px", borderRadius: 8, fontSize: 13,
              background: testResult.ok ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${testResult.ok ? "#bbf7d0" : "#fecaca"}`,
              color: testResult.ok ? "#15803d" : "#dc2626",
            }}>
              {testResult.ok ? "✓" : "✗"} {testResult.msg}
            </div>
          )}
        </Col>

        <Col xl={6}>
          {/* Field Mapping */}
          <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 20 }}>
            <h6 className="mb-2">Field Mapping</h6>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
              Map ChitAssist field names to your CRM's field names.
              Left side = ChitAssist field, Right side = CRM field name.
            </p>

            {/* Visual mapping helper */}
            <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 12, border: "1px solid #e9ecef" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>EXAMPLE MAPPING</div>
              {[
                { from: "name", to: crmForm.crm_type === "zoho" ? "Last_Name" : crmForm.crm_type === "hubspot" ? "lastname" : "name" },
                { from: "email", to: crmForm.crm_type === "zoho" ? "Email" : crmForm.crm_type === "hubspot" ? "email" : "email" },
                { from: "phone", to: crmForm.crm_type === "zoho" ? "Phone" : crmForm.crm_type === "hubspot" ? "phone" : "phone" },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 12 }}>
                  <code style={{ background: "#f0f7ff", padding: "2px 6px", borderRadius: 4, color: "#3b82f6" }}>{m.from}</code>
                  <span style={{ color: "#94a3b8" }}>→</span>
                  <code style={{ background: "#f0fdf4", padding: "2px 6px", borderRadius: 4, color: "#22c55e" }}>{m.to}</code>
                </div>
              ))}
            </div>

            <Label className="form-label fw-medium">Custom Field Mapping (JSON)</Label>
            <textarea
              rows={8}
              value={fieldMappingRaw}
              onChange={e => setFieldMappingRaw(e.target.value)}
              placeholder={`{\n  "name": "${crmForm.crm_type === "zoho" ? "Last_Name" : "name"}",\n  "email": "${crmForm.crm_type === "zoho" ? "Email" : "email"}",\n  "phone": "${crmForm.crm_type === "zoho" ? "Phone" : "phone"}"\n}`}
              style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "monospace", boxSizing: "border-box", resize: "vertical" }}
            />
            <small className="text-muted">
              Leave empty to send all fields as-is. Use JSON format.
              {crmForm.crm_type === "zoho" && " Zoho requires Last_Name as minimum required field."}
              {crmForm.crm_type === "hubspot" && " HubSpot uses lowercase field names like firstname, lastname, email, phone."}
            </small>
          </div>
        </Col>
      </Row>
    </div>
  );
};

// ── Main BotConfig Component ──────────────────────────────────────────────
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
    setBreadcrumbItems("Bot Configuration", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "Bot Config", link: "#" },
    ]);
    dispatch(fetchBotConfig(botId));
  }, [botId]); // eslint-disable-line

  const { config, loading, saving, saveSuccess, saveError } = useSelector(s => s.BotConfig);

  useEffect(() => {
    if (config && !dirty) setForm({ ...config });
  }, [config]); // eslint-disable-line

  const set = useCallback((field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setDirty(true);
  }, []);

  const handleSave = () => {
    dispatch(saveBotConfig({ ...form, bot_id: botId }));
    setDirty(false);
  };

  if (loading || !form) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  const flowSteps = form.flow_steps || [];
  const quickSuggestions = form.quick_suggestions || [];

  const chatbotUrl = `https://antsbotai.vercel.app/?bot_id=${botId}`;
  const iframeCode = `<iframe\n  src="${chatbotUrl}"\n  width="400"\n  height="600"\n  frameborder="0"\n  allow="microphone"\n  style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15)">\n</iframe>`;
  const scriptCode = `<!-- ${form.bot_name} Chatbot -->\n<script>\n  (function() {\n    var iframe = document.createElement('iframe');\n    iframe.src = '${chatbotUrl}';\n    iframe.style = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:9999';\n    iframe.allow = 'microphone';\n    document.body.appendChild(iframe);\n  })();\n<\/script>`;

  const copyEmbed = (text, type) => {
    navigator.clipboard.writeText(text);
    setEmbedCopied(type);
    setTimeout(() => setEmbedCopied(""), 2000);
  };

  const tabs = ["Basic Info", "Appearance", "Welcome Card", "Flow Steps", "Quick Suggestions", "Webhook & API", "CRM Integration", "Embed & Share"];

  return (
    <React.Fragment>
      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <div className="d-flex align-items-center gap-4">
                {config.logo_url && (
                  <img src={config.logo_url} alt="" style={{ height: 48, objectFit: "contain" }}
                    onError={e => e.target.style.display = "none"} />
                )}
                <div>
                  <h4 className="mb-1">{form.bot_name}</h4>
                  <p className="text-muted mb-0">{form.company_name} — <Badge color="secondary">{botId}</Badge></p>
                  {allUserBots.length > 1 && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <small className="text-muted">Switch Bot:</small>
                      <Input type="select" value={botId}
                        onChange={e => { setBotIdLocal(e.target.value); setForm(null); setDirty(false); dispatch(fetchBotConfig(e.target.value)); }}
                        style={{ fontSize: 13, width: "auto", minWidth: 180 }}>
                        {allUserBots.map(b => (
                          <option key={b.bot_id} value={b.bot_id}>{b.bot_name} ({b.bot_id})</option>
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
                    <NavLink className={activeTab === String(i + 1) ? "active" : ""}
                      onClick={() => setActiveTab(String(i + 1))}
                      style={{ cursor: "pointer" }}>
                      {t}
                    </NavLink>
                  </NavItem>
                ))}
              </Nav>

              <TabContent activeTab={activeTab}>

                {/* Tab 1: Basic Info */}
                <TabPane tabId="1">
                  <Row>
                    <Col xl={6}><F label="Bot Name" field="bot_name" form={form} set={set} /></Col>
                    <Col xl={6}><F label="Company Name" field="company_name" form={form} set={set} /></Col>
                    <Col xl={6}><F label="Tagline" field="tagline" form={form} set={set} /></Col>
                    <Col xl={6}><F label="Logo URL" field="logo_url" form={form} set={set} /></Col>
                    <Col xl={12}><F label="Welcome Message" field="welcome_message" type="textarea" form={form} set={set} /></Col>
                    <Col xl={4}><Toggle label="Voice Enabled" field="voice_enabled" form={form} set={set} /></Col>
                    <Col xl={4}><Toggle label="Show Progress Bar" field="show_progress" form={form} set={set} /></Col>
                    <Col xl={4}><Toggle label="Show Blogs" field="show_blogs" form={form} set={set} /></Col>
                    <Col xl={12}>
                      <F label="Completion Message" field="completion_message" type="textarea" form={form} set={set}
                        help="Message shown when flow completes. Use {field_name} for user answers. e.g. Thank you {name}! We will call at {phone}." />
                    </Col>
                  </Row>
                </TabPane>

                {/* Tab 2: Appearance */}
                <TabPane tabId="2">
                  <Row>
                    <Col xl={4}>
                      <F label="Primary Color" field="primary_color" type="color" form={form} set={set} />
                      <F label="Secondary Color" field="secondary_color" type="color" form={form} set={set} />
                    </Col>
                    <Col xl={8}>
                      <Label className="form-label fw-medium">Live Preview</Label>
                      <div style={{ background: form.primary_color || "#556ee6", borderRadius: 14, padding: 20, maxWidth: 340 }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                          {form.logo_url && <img src={form.logo_url} alt="" style={{ height: 36, filter: "brightness(0) invert(1)" }} onError={e => e.target.style.display = "none"} />}
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
                    <Col xl={12}><Toggle label="Show Stats Box" field="show_stats" form={form} set={set} /></Col>
                    {form.show_stats && <>
                      <Col xl={4}>
                        <F label="Years Value" field="stat_years" form={form} set={set} />
                        <F label="Years Label" field="stat_years_label" form={form} set={set} />
                      </Col>
                      <Col xl={4}>
                        <F label="Branches Value" field="stat_branches" form={form} set={set} />
                        <F label="Branches Label" field="stat_branches_label" form={form} set={set} />
                      </Col>
                      <Col xl={4}>
                        <F label="Members Value" field="stat_members" form={form} set={set} />
                        <F label="Members Label" field="stat_members_label" form={form} set={set} />
                      </Col>
                    </>}
                    <Col xl={12} className="mt-2"><Toggle label="Show Welcome Buttons" field="show_welcome_buttons" form={form} set={set} /></Col>
                    {form.show_welcome_buttons && <>
                      <Col xl={6}>
                        <F label="Button 1 Text" field="button_1_text" form={form} set={set} />
                        <F label="Button 1 Action" field="button_1_action" form={form} set={set} />
                      </Col>
                      <Col xl={6}>
                        <F label="Button 2 Text" field="button_2_text" form={form} set={set} />
                        <F label="Button 2 Action" field="button_2_action" form={form} set={set} />
                      </Col>
                    </>}
                    <Col xl={12}><Toggle label="Show Welcome Note" field="show_welcome_note" form={form} set={set} /></Col>
                    {form.show_welcome_note && <Col xl={12}><F label="Welcome Note Text" field="welcome_note" form={form} set={set} /></Col>}
                  </Row>
                </TabPane>

                {/* Tab 4: Flow Steps */}
                <TabPane tabId="4">
                  <div className="mb-3">
                    <h6 className="mb-1">Conversation Flow Builder</h6>
                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                      Drag nodes to rearrange. Click a node to edit it. Dashed yellow arrows = conditional routing.
                    </p>
                  </div>
                  <FlowBuilder flowSteps={flowSteps} onChange={newSteps => set("flow_steps", newSteps)} />
                  <div className="text-end mt-3">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Flow"}
                    </button>
                  </div>
                </TabPane>

                {/* Tab 5: Quick Suggestions */}
                <TabPane tabId="5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1">Quick Suggestions</h6>
                      <p className="text-muted mb-0" style={{ fontSize: 13 }}>Buttons shown at start of chat.</p>
                    </div>
                    <button className="btn btn-sm btn-success"
                      onClick={() => set("quick_suggestions", [...quickSuggestions, { order: quickSuggestions.length + 1, icon: "💬", text: "New suggestion" }])}>
                      <i className="mdi mdi-plus me-1"></i>Add
                    </button>
                  </div>
                  {quickSuggestions.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <i className="mdi mdi-gesture-tap-button font-size-36 d-block mb-2"></i>No quick suggestions yet.
                    </div>
                  ) : (
                    quickSuggestions.map((s, i) => (
                      <div key={i} style={{ border: "1px solid #e9ecef", borderRadius: 10, padding: "12px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                        <Input value={s.icon} style={{ width: 60, fontSize: 20, textAlign: "center" }}
                          onChange={e => { const arr = [...quickSuggestions]; arr[i] = { ...arr[i], icon: e.target.value }; set("quick_suggestions", arr); }} />
                        <Input value={s.text} placeholder="Button text" style={{ flex: 1 }}
                          onChange={e => { const arr = [...quickSuggestions]; arr[i] = { ...arr[i], text: e.target.value }; set("quick_suggestions", arr); }} />
                        <button className="btn btn-sm btn-outline-danger"
                          onClick={() => set("quick_suggestions", quickSuggestions.filter((_, j) => j !== i).map((st, j) => ({ ...st, order: j + 1 })))}>
                          <i className="mdi mdi-delete"></i>
                        </button>
                      </div>
                    ))
                  )}
                  <div className="text-end mt-3">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Suggestions"}
                    </button>
                  </div>
                </TabPane>

                {/* Tab 6: Webhook & API */}
                <TabPane tabId="6">
                  <Row>
                    <Col xl={6}>
                      <h6 className="mb-3">Webhook</h6>
                      <Toggle label="Webhook Active" field="webhook_active" form={form} set={set} />
                      <F label="Webhook URL" field="webhook_url" help="URL to receive lead data as JSON POST" form={form} set={set} />
                      <F label="Webhook Secret" field="webhook_secret" form={form} set={set} />
                    </Col>
                    <Col xl={6}>
                      <h6 className="mb-3">External API</h6>
                      <F label="API Endpoint" field="api_endpoint" form={form} set={set} />
                      <F label="Cities Path" field="api_cities_path" form={form} set={set} />
                      <F label="Branches Path" field="api_branches_path" form={form} set={set} />
                      <F label="API Key" field="api_key" form={form} set={set} />
                    </Col>
                  </Row>
                  <div className="text-end mt-2">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </TabPane>

                {/* Tab 7: CRM Integration — Phase 3 */}
                <TabPane tabId="7">
                  <div className="mb-4">
                    <h6 className="mb-1">CRM Integration</h6>
                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                      Connect this bot to your CRM. New leads can be pushed automatically or manually from the Leads page.
                      Each bot can have its own CRM connection.
                    </p>
                  </div>
                  <CRMTab
                    botId={botId}
                    form={form}
                    set={set}
                    handleSave={handleSave}
                    saving={saving}
                    dirty={dirty}
                  />
                </TabPane>

                {/* Tab 8: Embed & Share */}
                <TabPane tabId="8">
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
                      <pre style={{ background: "#fff", border: "1px solid #e0ecf8", borderRadius: 8, padding: 12, fontSize: 11, overflow: "auto", color: "#334" }}>{iframeCode}</pre>
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
                      <pre style={{ background: "#fff", border: "1px solid #e0ecf8", borderRadius: 8, padding: 12, fontSize: 11, overflow: "auto", color: "#334" }}>{scriptCode}</pre>
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
