import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Label, Form, Alert, Input, FormFeedback } from 'reactstrap';
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import PropTypes from "prop-types";
import * as Yup from "yup";
import { useFormik } from "formik";
import withRouter from 'components/Common/withRouter';
import { loginUser } from "../../store/actions";

const Login = props => {
  document.title = "Login | Ants Digital Dashboard";
  const dispatch = useDispatch();
  const [rememberMe, setRememberMe] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().required("Please enter your email"),
      password: Yup.string().required("Please enter your password"),
    }),
    onSubmit: (values) => {
      dispatch(loginUser({ ...values, rememberMe }, props.router.navigate));
    }
  });

  const { error, loading } = useSelector(createSelector(
    (state) => state.Login,
    (login) => ({ error: login.error, loading: login.loading })
  ));

  return (
    <React.Fragment>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e8f4fd 0%, #ffffff 100%)", display: "flex", alignItems: "center" }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={5} xl={4}>
              <div className="text-center mb-4">
                <img src="https://antsdigital.in/assets/images/antslogo.png" alt="Ants Digital"
                  style={{ height: 48, objectFit: "contain" }}
                  onError={(e) => e.target.style.display = "none"} />
              </div>
              <Card style={{ border: "none", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,142,211,0.12)" }}>
                <CardBody style={{ padding: "36px 40px" }}>
                  <div style={{ background: "#008ed3", borderRadius: 10, padding: "16px 20px", marginBottom: 28, textAlign: "center" }}>
                    <h5 className="mb-0" style={{ color: "#fff", fontWeight: 700 }}>Dashboard Login</h5>
                    <p className="mb-0" style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>Sign in to your account</p>
                  </div>
                  <Form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                    {error && <Alert color="danger" className="mb-3">{error}</Alert>}
                    <div className="mb-3">
                      <Label className="fw-medium">Email</Label>
                      <Input name="email" type="email" placeholder="Enter your email"
                        onChange={validation.handleChange} onBlur={validation.handleBlur}
                        value={validation.values.email}
                        invalid={!!(validation.touched.email && validation.errors.email)}
                        style={{ borderRadius: 8, padding: "10px 14px" }} />
                      {validation.touched.email && validation.errors.email &&
                        <FormFeedback>{validation.errors.email}</FormFeedback>}
                    </div>
                    <div className="mb-3">
                      <Label className="fw-medium">Password</Label>
                      <Input name="password" type="password" placeholder="Enter your password"
                        onChange={validation.handleChange} onBlur={validation.handleBlur}
                        value={validation.values.password}
                        invalid={!!(validation.touched.password && validation.errors.password)}
                        style={{ borderRadius: 8, padding: "10px 14px" }} />
                      {validation.touched.password && validation.errors.password &&
                        <FormFeedback>{validation.errors.password}</FormFeedback>}
                    </div>

                    {/* Remember Me + Forgot Password */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="d-flex align-items-center gap-2">
                        <input type="checkbox" id="rememberMe" checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#008ed3" }} />
                        <label htmlFor="rememberMe" style={{ fontSize: 13, color: "#555", cursor: "pointer", marginBottom: 0 }}>
                          Remember me
                        </label>
                      </div>
                      <Link to="/forgot-password" style={{ fontSize: 13, color: "#008ed3" }}>
                        Forgot password?
                      </Link>
                    </div>

                    <button type="submit" disabled={loading} className="btn w-100"
                      style={{ background: "#008ed3", color: "#fff", borderRadius: 8, padding: "11px", fontWeight: 600, fontSize: 15, border: "none", opacity: loading ? 0.8 : 1 }}>
                      {loading
                        ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Signing in...</>
                        : "Sign In"}
                    </button>
                  </Form>
                </CardBody>
              </Card>
              <div className="text-center mt-3" style={{ color: "#99aabb", fontSize: 12 }}>
                © {new Date().getFullYear()} Ants Digital. All rights reserved.
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(Login);
Login.propTypes = { history: PropTypes.object };