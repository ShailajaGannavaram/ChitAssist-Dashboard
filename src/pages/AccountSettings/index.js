import React, { useEffect, useState } from "react";
import { Card, CardBody, Row, Col, Input, Label, Alert } from "reactstrap";
import { connect } from "react-redux";
import { setBreadcrumbItems } from "../../store/actions";

const API = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const AccountSettings = ({ setBreadcrumbItems }) => {
  const user = getAuthUser();
  const [form, setForm] = useState({
    username: "", email: "", phone: "", company: "", gst_number: "", address: "",
    plan_name: "", bot_quota: "", member_since: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  document.title = "Account Settings | ANTS Bot Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Account Settings", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "Account Settings", link: "#" },
    ]);
    fetchSettings();
  }, []); // eslint-disable-line

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/api/account/settings/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setForm(data);
    } catch (e) {
      setError("Failed to load account settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API}/api/account/settings/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access}`,
        },
        body: JSON.stringify({
          username: form.username,
          phone: form.phone,
          company: form.company,
          gst_number: form.gst_number,
          address: form.address,
        }),
      });
      if (res.ok) {
        setSuccess("Account settings updated successfully.");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save.");
      }
    } catch (e) {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  return (
    <React.Fragment>
      {success && <Alert color="success" toggle={() => setSuccess("")}>{success}</Alert>}
      {error && <Alert color="danger" toggle={() => setError("")}>{error}</Alert>}

      <Row>
        {/* Profile Info */}
        <Col xl={8}>
          <Card className="mb-4">
            <CardBody>
              <h5 className="mb-4">Profile Information</h5>
              <Row>
                <Col xl={6}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Display Name</Label>
                    <Input value={form.username || ""} onChange={e => set("username", e.target.value)} placeholder="Your name" />
                  </div>
                </Col>
                <Col xl={6}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Email Address</Label>
                    <Input value={form.email || ""} disabled style={{ background: "#f8f9fa" }} />
                    <small className="text-muted">Email cannot be changed</small>
                  </div>
                </Col>
                <Col xl={6}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Phone Number</Label>
                    <Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </Col>
                <Col xl={6}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Company Name</Label>
                    <Input value={form.company || ""} onChange={e => set("company", e.target.value)} placeholder="Your company name" />
                  </div>
                </Col>
                <Col xl={12}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">Address</Label>
                    <Input type="textarea" rows={3} value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Full address for invoices" />
                  </div>
                </Col>
              </Row>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="mdi mdi-content-save me-1"></i>Save Changes</>}
              </button>
            </CardBody>
          </Card>

          {/* GST Info */}
          <Card>
            <CardBody>
              <h5 className="mb-1">GST Information</h5>
              <p className="text-muted mb-4" style={{ fontSize: 13 }}>Your GST number will appear on all invoices for tax purposes.</p>
              <Row>
                <Col xl={6}>
                  <div className="mb-3">
                    <Label className="form-label fw-medium">GST Number</Label>
                    <Input value={form.gst_number || ""} onChange={e => set("gst_number", e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                    <small className="text-muted">15-character GST identification number</small>
                  </div>
                </Col>
              </Row>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save GST Info"}
              </button>
            </CardBody>
          </Card>
        </Col>

        {/* Plan Summary */}
        <Col xl={4}>
          <Card className="mb-4">
            <CardBody>
              <h5 className="mb-3">Account Summary</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: "12px 16px", background: "#f0f7ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>CURRENT PLAN</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>{form.plan_name || "Basic"}</div>
                </div>
                <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>BOT QUOTA</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#22c55e" }}>{form.bot_quota || 1} Bots</div>
                </div>
                <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>MEMBER SINCE</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{form.member_since || "—"}</div>
                </div>
              </div>
              <div className="mt-3 d-grid gap-2">
                <a href="/my-plan" className="btn btn-outline-primary btn-sm">
                  <i className="mdi mdi-crown me-1"></i>Manage Plan
                </a>
                <a href="/billing" className="btn btn-outline-secondary btn-sm">
                  <i className="mdi mdi-receipt me-1"></i>View Billing
                </a>
                <a href="/change-password" className="btn btn-outline-secondary btn-sm">
                  <i className="mdi mdi-lock-reset me-1"></i>Change Password
                </a>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(AccountSettings);

