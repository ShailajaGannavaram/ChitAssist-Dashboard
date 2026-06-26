import React, { useEffect, useState } from "react";
import { Card, CardBody, Badge, Row, Col, Alert } from "reactstrap";
import { connect } from "react-redux";
import { setBreadcrumbItems } from "../../store/actions";

const API = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const STATUS_COLORS = { success: "success", failed: "danger", refunded: "warning" };

const Billing = ({ setBreadcrumbItems }) => {
  const user = getAuthUser();
  const isAdmin = user.is_superuser || user.is_staff;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  document.title = "Billing | ANTS Bot Dashboard";

  useEffect(() => {
    setBreadcrumbItems("Billing & Invoices", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "Billing", link: "#" },
    ]);
    fetchPayments();
  }, []); // eslint-disable-line

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API}/api/account/payments/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      });
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load payment history.");
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = payments
    .filter(p => p.status === "success")
    .reduce((sum, p) => sum + (p.amount_raw || 0), 0);

  return (
    <React.Fragment>
      {error && <Alert color="danger">{error}</Alert>}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col xl={3}>
          <Card style={{ border: "1px solid #bfdbfe", background: "#f0f7ff" }}>
            <CardBody className="py-3">
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>TOTAL PAYMENTS</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>{payments.length}</div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3}>
          <Card style={{ border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
            <CardBody className="py-3">
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>TOTAL SPENT</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>₹{(totalSpent / 100).toLocaleString("en-IN")}</div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3}>
          <Card style={{ border: "1px solid #fde68a", background: "#fffbeb" }}>
            <CardBody className="py-3">
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>CURRENT PLAN</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#d97706" }}>{user.plan_name || "Basic"}</div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3}>
          <Card style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <CardBody className="py-3">
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>BOT QUOTA</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1e293b" }}>{user.bot_quota || 1}</div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card>
        <CardBody>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h5 className="mb-1">{isAdmin ? "All Client Payments" : "Payment History"}</h5>
              <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                {isAdmin ? "Billing records for all clients." : "Your subscription payments and invoices."}
              </p>
            </div>
            <button className="btn btn-sm btn-outline-primary" onClick={fetchPayments}>
              <i className="mdi mdi-refresh me-1"></i>Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : payments.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="mdi mdi-receipt-outline d-block mb-2" style={{ fontSize: 48 }}></i>
              <div style={{ fontSize: 15, fontWeight: 500 }}>No payments yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Your payment history will appear here after your first subscription.</div>
              <a href="/my-plan" className="btn btn-primary btn-sm mt-3">View Plans</a>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Invoice</th>
                    {isAdmin && <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Client</th>}
                    <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Plan</th>
                    <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Amount</th>
                    <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Status</th>
                    <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Payment ID</th>
                    <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Date</th>
                    <th style={{ fontSize: 12, fontWeight: 600, color: "#6c757d" }}>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{p.invoice_number || `INV-${p.id}`}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.username}</div>
                          <div style={{ fontSize: 11, color: "#6c757d" }}>{p.user}</div>
                        </td>
                      )}
                      <td>
                        <span style={{ fontSize: 12, background: "#f0f7ff", color: "#3b82f6", borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>
                          {p.plan_name}
                        </span>
                      </td>
                      <td style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{p.amount}</td>
                      <td>
                        <Badge color={STATUS_COLORS[p.status] || "secondary"} style={{ fontSize: 10 }}>
                          {p.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 11, color: "#6c757d", fontFamily: "monospace" }}>
                        {p.razorpay_payment_id || "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "#6c757d", whiteSpace: "nowrap" }}>{p.created_at}</td>
                      <td>
                        {p.status === "success" ? (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ fontSize: 11, padding: "2px 8px" }}
                            onClick={async () => {
                              try {
                                const res = await fetch(`${API}/api/account/invoice/${p.id}/`, {
                                  headers: { Authorization: `Bearer ${user.access}` },
                                });
                                if (res.ok) {
                                  const blob = await res.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `Invoice-${p.invoice_number || p.id}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  window.URL.revokeObjectURL(url);
                                } else {
                                  alert('Failed to download invoice.');
                                }
                              } catch (e) {
                                alert('Something went wrong.');
                              }
                            }}
                          >
                            <i className="mdi mdi-download me-1"></i>PDF
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "#adb5bd" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(Billing);

