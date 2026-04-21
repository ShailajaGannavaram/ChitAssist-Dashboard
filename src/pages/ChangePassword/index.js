import React, { useState } from "react";
import { connect } from "react-redux";
import { Row, Col, Card, CardBody, Label, Input, Alert } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";
const getToken = () => { try { return JSON.parse(localStorage.getItem("authUser") || "{}").access || ""; } catch { return ""; } };
const getAuthUser = () => { try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; } };

const ChangePassword = ({ setBreadcrumbItems }) => {
  const user = getAuthUser();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  document.title = "Change Password | Ants Digital Dashboard";

  React.useEffect(() => {
    setBreadcrumbItems("Change Password", [{ title: "Account", link: "#" }, { title: "Change Password", link: "#" }]);
  }, []); // eslint-disable-line

  const showAlert = (msg, color) => { setAlert({ msg, color }); setTimeout(() => setAlert(null), 4000); };

  const handleSubmit = async () => {
    if (!form.current_password || !form.new_password || !form.confirm_password)
      return showAlert("All fields are required.", "danger");
    if (form.new_password.length < 6)
      return showAlert("New password must be at least 6 characters.", "danger");
    if (form.new_password !== form.confirm_password)
      return showAlert("New passwords do not match.", "danger");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("Password changed successfully!", "success");
        setForm({ current_password: "", new_password: "", confirm_password: "" });
      } else {
        showAlert(data.error || "Failed to change password.", "danger");
      }
    } catch {
      showAlert("Could not connect to server.", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <Row className="justify-content-center">
        <Col xl={5} lg={6}>
          <Card>
            <CardBody style={{ padding: "32px 36px" }}>
              <div className="text-center mb-4">
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <i className="mdi mdi-lock-reset" style={{ color: "#fff", fontSize: 26 }}></i>
                </div>
                <h5 className="mb-1">Change Password</h5>
                <p className="text-muted mb-0" style={{ fontSize: 13 }}>Logged in as <strong>{user.email}</strong></p>
              </div>

              {alert && <Alert color={alert.color}>{alert.msg}</Alert>}

              <div className="mb-3">
                <Label className="fw-medium">Current Password</Label>
                <Input key="current" type="password" value={form.current_password} placeholder="Enter current password"
                  onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
                  style={{ borderRadius: 8 }} />
              </div>
              <div className="mb-3">
                <Label className="fw-medium">New Password</Label>
                <Input key="new" type="password" value={form.new_password} placeholder="Enter new password (min 6 chars)"
                  onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                  style={{ borderRadius: 8 }} />
              </div>
              <div className="mb-4">
                <Label className="fw-medium">Confirm New Password</Label>
                <Input key="confirm" type="password" value={form.confirm_password} placeholder="Repeat new password"
                  onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
                  style={{ borderRadius: 8 }} />
              </div>

              <button className="btn w-100" disabled={loading}
                style={{ background: "#008ed3", color: "#fff", borderRadius: 8, padding: "11px", fontWeight: 600, fontSize: 15, border: "none" }}
                onClick={handleSubmit}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : "Update Password"}
              </button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(ChangePassword);