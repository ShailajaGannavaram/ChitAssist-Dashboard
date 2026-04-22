import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Label, Form, Alert, Input, FormFeedback } from 'reactstrap';
import PropTypes from "prop-types";
import * as Yup from "yup";
import { useFormik } from "formik";
import withRouter from 'components/Common/withRouter';

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const ResetPassword = (props) => {
  document.title = "Reset Password | Ants Digital Dashboard";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Get token from URL ?token=xxx
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setError("Invalid or missing reset link. Please request a new one.");
    } else {
      setToken(t);
    }
  }, []);

  const validation = useFormik({
    initialValues: { new_password: '', confirm_password: '' },
    validationSchema: Yup.object({
      new_password: Yup.string().min(6, "Password must be at least 6 characters").required("Required"),
      confirm_password: Yup.string()
        .oneOf([Yup.ref('new_password')], "Passwords do not match")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      if (!token) return setError("Invalid reset link.");
      setLoading(true); setError("");
      try {
        const res = await fetch(`${API_URL}/api/admin/reset-password/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: values.new_password }),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setError(data.error || "Failed to reset password.");
        }
      } catch {
        setError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <React.Fragment>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e8f4fd 0%, #ffffff 100%)", display: "flex", alignItems: "center" }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={5} xl={4}>
              <div className="text-center mb-4">
                <img src="https://antsdigital.in/assets/images/antslogo.png" alt="Ants Digital"
                  style={{ height: 48, objectFit: "contain" }} onError={(e) => e.target.style.display = "none"} />
              </div>

              <Card style={{ border: "none", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,142,211,0.12)" }}>
                <CardBody style={{ padding: "36px 40px" }}>
                  <div style={{ background: "#008ed3", borderRadius: 10, padding: "16px 20px", marginBottom: 28, textAlign: "center" }}>
                    <h5 className="mb-0" style={{ color: "#fff", fontWeight: 700 }}>Reset Password</h5>
                    <p className="mb-0" style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>Enter your new password</p>
                  </div>

                  {success ? (
                    <Alert color="success">
                      <i className="mdi mdi-check-circle me-2"></i>
                      Password reset successfully! Redirecting to login...
                    </Alert>
                  ) : (
                    <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                      {error && <Alert color="danger" className="mb-3">{error}</Alert>}

                      <div className="mb-3">
                        <Label className="fw-medium">New Password</Label>
                        <Input name="new_password" type="password" placeholder="Enter new password"
                          onChange={validation.handleChange} onBlur={validation.handleBlur}
                          value={validation.values.new_password}
                          invalid={!!(validation.touched.new_password && validation.errors.new_password)}
                          style={{ borderRadius: 8, padding: "10px 14px" }} />
                        {validation.touched.new_password && validation.errors.new_password &&
                          <FormFeedback>{validation.errors.new_password}</FormFeedback>}
                      </div>

                      <div className="mb-4">
                        <Label className="fw-medium">Confirm New Password</Label>
                        <Input name="confirm_password" type="password" placeholder="Repeat new password"
                          onChange={validation.handleChange} onBlur={validation.handleBlur}
                          value={validation.values.confirm_password}
                          invalid={!!(validation.touched.confirm_password && validation.errors.confirm_password)}
                          style={{ borderRadius: 8, padding: "10px 14px" }} />
                        {validation.touched.confirm_password && validation.errors.confirm_password &&
                          <FormFeedback>{validation.errors.confirm_password}</FormFeedback>}
                      </div>

                      <button type="submit" disabled={loading || !token} className="btn w-100"
                        style={{ background: "#008ed3", color: "#fff", borderRadius: 8, padding: "11px", fontWeight: 600, fontSize: 15, border: "none" }}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Resetting...</> : "Reset Password"}
                      </button>
                    </Form>
                  )}

                  <div className="text-center mt-3">
                    <Link to="/login" style={{ color: "#008ed3", fontSize: 13 }}>
                      <i className="mdi mdi-arrow-left me-1"></i>Back to Login
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(ResetPassword);
ResetPassword.propTypes = { history: PropTypes.object };