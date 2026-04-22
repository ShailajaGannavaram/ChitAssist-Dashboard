import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, CardBody, Input, Label, Alert } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";
import { createBot } from "../../helpers/fakebackend_helper";
import React, { useState } from "react";

// F is defined OUTSIDE so React doesn't recreate it on every keystroke
const F = ({ label, field, type = "text", help, placeholder, form, set }) => (
  <div className="mb-3">
    <Label className="form-label fw-medium">{label}</Label>
    <Input
      type={type}
      value={form[field] ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const val = e.target.value;
        if (field === "bot_id") {
          set("bot_id", val.toLowerCase().replace(/[^a-z0-9_]/g, ""));
        } else {
          set(field, val);
        }
      }}
    />
    {help && <small className="text-muted">{help}</small>}
  </div>
);

const CreateBot = (props) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bot_id: "", bot_name: "", company_name: "", tagline: "",
    welcome_message: "Hello! How can I help you today?",
    logo_url: "", primary_color: "#556ee6", secondary_color: "#34c38f",
  });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  document.title = "Create Bot | ChitAssist Admin";

  React.useEffect(() => {
    props.setBreadcrumbItems("Create Bot", [{ title: "Admin", link: "#" }, { title: "Create Bot", link: "#" }]);
  }, []); // eslint-disable-line

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!form.bot_id) return setAlert({ msg: "Bot ID is required", color: "danger" });
    if (!form.bot_name) return setAlert({ msg: "Bot Name is required", color: "danger" });
    setSaving(true);
    createBot(form)
      .then((r) => {
        setSaving(false);
        if (r.success) {
          setAlert({ msg: `Bot "${r.bot_name}" created successfully!`, color: "success" });
          setTimeout(() => navigate("/admin-bots"), 1500);
        } else {
          setAlert({ msg: r.error || "Failed to create bot", color: "danger" });
        }
      })
      .catch((err) => {
        setSaving(false);
        const msg = err?.response?.data?.error || err?.message || "Failed to create bot";
        setAlert({ msg, color: "danger" });
      });
  };

  return (
    <React.Fragment>
      {alert && <Alert color={alert.color} className="mb-3">{alert.msg}</Alert>}
      <Row>
        <Col xl={8}>
          <Card>
            <CardBody>
              <h4 className="card-title mb-4">Create New Bot</h4>
              <Row>
                <Col xl={6}>
                  <F label="Bot ID *" field="bot_id" placeholder="e.g. mycompany_bot" help="Lowercase letters, numbers, underscores only. Cannot be changed later." form={form} set={set} />
                </Col>
                <Col xl={6}>
                  <F label="Bot Name *" field="bot_name" placeholder="e.g. MyCompany Assistant" form={form} set={set} />
                </Col>
                <Col xl={6}>
                  <F label="Company Name" field="company_name" placeholder="e.g. MyCompany Pvt Ltd" form={form} set={set} />
                </Col>
                <Col xl={6}>
                  <F label="Tagline" field="tagline" placeholder="e.g. Your trusted assistant" form={form} set={set} />
                </Col>
                <Col xl={12}>
                  <F label="Welcome Message" field="welcome_message" type="textarea" form={form} set={set} />
                </Col>
                <Col xl={12}>
                  <F label="Logo URL" field="logo_url" placeholder="https://yourcompany.com/logo.png" form={form} set={set} />
                </Col>
                <Col xl={6}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Primary Color</Label>
                    <div className="d-flex align-items-center gap-2">
                      <Input type="color" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} style={{ width: 60, height: 40 }} />
                      <Input value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} style={{ flex: 1 }} />
                    </div>
                  </div>
                </Col>
                <Col xl={6}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Secondary Color</Label>
                    <div className="d-flex align-items-center gap-2">
                      <Input type="color" value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} style={{ width: 60, height: 40 }} />
                      <Input value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} style={{ flex: 1 }} />
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="d-flex gap-2 mt-2">
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : <><i className="mdi mdi-robot-outline me-1"></i>Create Bot</>}
                </button>
                <button className="btn btn-secondary" onClick={() => navigate("/admin-bots")}>Cancel</button>
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Preview */}
        <Col xl={4}>
          <Card style={{ position: "sticky", top: 80 }}>
            <CardBody>
              <h6 className="mb-3">Live Preview</h6>
              <div style={{ background: form.primary_color, borderRadius: 14, padding: 20 }}>
                <div className="d-flex align-items-center gap-3 mb-3">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="" style={{ height: 36, filter: "brightness(0) invert(1)" }} onError={(e) => e.target.style.display = "none"} />
                    : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="mdi mdi-robot" style={{ color: "#fff", fontSize: 20 }}></i></div>}
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{form.bot_name || "Bot Name"}</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{form.tagline || "Tagline"}</div>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13 }}>
                  {form.welcome_message?.substring(0, 100)}
                </div>
                <div className="mt-3 d-flex gap-2">
                  <div style={{ flex: 1, background: form.secondary_color, borderRadius: 8, padding: "8px", textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 600 }}>Start Chat</div>
                </div>
              </div>
              <div className="mt-3">
                <small className="text-muted">Bot ID: </small>
                <code style={{ fontSize: 12 }}>{form.bot_id || "—"}</code>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(CreateBot);