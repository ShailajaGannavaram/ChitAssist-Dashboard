import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Label, Form, Alert, Input, FormFeedback } from 'reactstrap';
import PropTypes from "prop-types";
import * as Yup from "yup";
import { useFormik } from "formik";
import withRouter from 'components/Common/withRouter';

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const ForgetPassword = () => {
  document.title = "Forgot Password | Ants Digital Dashboard";
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const validation = useFormik({
    initialValues: { email: '' },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Please enter your email"),
    }),
    onSubmit: async (values) => {
      setLoading(true); setError(""); setSuccess(false);
      try {
        const res = await fetch(`${API_URL}/api/admin/forgot-password/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email }),
        });
        const data = await res.json();
        if (res.ok) setSuccess(true);
        else setError(data.error || "Something went wrong. Please try again.");
      } catch (err) {
        setError(err?.response?.data?.error || "Could not connect to server. Please try again.");
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
                    <h5 className="mb-0" style={{ color: "#fff", fontWeight: 700 }}>Forgot Password</h5>
                    <p className="mb-0" style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>Enter your email to reset your password</p>
                  </div>

                  {success ? (
                    <Alert color="success">
                      <i className="mdi mdi-check-circle me-2"></i>
                      Password reset instructions have been sent to your email. Please check your inbox.
                    </Alert>
                  ) : (
                    <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                      {error && <Alert color="danger" className="mb-3">{error}</Alert>}
                      <div className="mb-4">
                        <Label className="fw-medium">Email Address</Label>
                        <Input name="email" type="email" placeholder="Enter your email"
                          onChange={validation.handleChange} onBlur={validation.handleBlur}
                          value={validation.values.email}
                          invalid={!!(validation.touched.email && validation.errors.email)}
                          style={{ borderRadius: 8, padding: "10px 14px" }} />
                        {validation.touched.email && validation.errors.email &&
                          <FormFeedback>{validation.errors.email}</FormFeedback>}
                      </div>
                      <button type="submit" disabled={loading} className="btn w-100"
                        style={{ background: "#008ed3", color: "#fff", borderRadius: 8, padding: "11px", fontWeight: 600, fontSize: 15, border: "none" }}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</> : "Send Reset Link"}
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

export default withRouter(ForgetPassword);
ForgetPassword.propTypes = { history: PropTypes.object };