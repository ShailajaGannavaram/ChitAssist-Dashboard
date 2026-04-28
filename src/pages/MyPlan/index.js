import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Row, Col, Card, CardBody, Badge, Alert, Input } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const PLANS = [
  {
    name: "Starter",
    price: "₹1,999",
    period: "/month",
    bots: 1,
    color: "#6c757d",
    features: [
      "1 Chatbot",
      "Unlimited Leads",
      "Conversation History",
      "Basic Analytics",
      "Email Support",
      "Embed Code",
    ],
  },
  {
    name: "Pro",
    price: "₹4,999",
    period: "/month",
    bots: 3,
    color: "#008ed3",
    popular: true,
    features: [
      "3 Chatbots",
      "Unlimited Leads",
      "Conversation History",
      "Advanced Analytics",
      "Webhook Integration",
      "Priority Support",
      "Custom Flow Steps",
      "Embed Code",
    ],
  },
  {
    name: "Enterprise",
    price: "₹9,999",
    period: "/month",
    bots: 10,
    color: "#5b3cc4",
    features: [
      "10 Chatbots",
      "Unlimited Leads",
      "Full Conversation History",
      "Advanced Analytics",
      "Webhook + External API",
      "Dedicated Support",
      "Custom Branding",
      "Embed Code",
      "SLA Guarantee",
    ],
  },
  {
    name: "Custom",
    price: "Contact Us",
    period: "",
    bots: "Unlimited",
    color: "#f1b44c",
    features: [
      "Unlimited Chatbots",
      "Custom Features",
      "White-label Option",
      "API Access",
      "Dedicated Account Manager",
      "Custom Integrations",
      "On-premise Option",
    ],
  },
];

const MyPlan = ({ setBreadcrumbItems }) => {
  const user = getAuthUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [requestingPlan, setRequestingPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [showMessageFor, setShowMessageFor] = useState(null);

  const currentPlan = user.plan_name || "Starter";
  const botQuota = user.bot_quota || 1;
  const botsUsed = user.all_user_bots?.length || 1;

  document.title = "My Plan | ChitAssist Dashboard";

  useEffect(() => {
    setBreadcrumbItems("My Plan", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "My Plan", link: "#" },
    ]);
  }, []); // eslint-disable-line

  const handleRequest = async (planName) => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/client/plan/upgrade/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access || ""}`,
        },
        body: JSON.stringify({ requested_plan: planName, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Your request for the ${planName} plan has been sent! Our team will contact you within 24 hours.`);
        setRequestingPlan(null);
        setShowMessageFor(null);
        setMessage("");
      } else {
        setError(data.error || "Failed to send request.");
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlan = (planName) => planName === currentPlan;
  const isUpgrade = (plan) => PLANS.findIndex((p) => p.name === plan.name) > PLANS.findIndex((p) => p.name === currentPlan);

  return (
    <React.Fragment>
      {/* Current Plan Banner */}
      <Row className="mb-4">
        <Col xl={12}>
          <Card style={{ border: `2px solid #008ed3`, background: "linear-gradient(135deg, #f4f9fd, #fff)" }}>
            <CardBody>
              <div className="d-flex align-items-center gap-4 flex-wrap">
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="mdi mdi-crown" style={{ color: "#fff", fontSize: 26 }}></i>
                </div>
                <div>
                  <h5 className="mb-1">Current Plan: <strong style={{ color: "#008ed3" }}>{currentPlan}</strong></h5>
                  <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                    {user.email} — {user.bot_name || "Dashboard"}
                  </p>
                </div>
                <div className="d-flex gap-4 ms-auto flex-wrap">
                  <div className="text-center">
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#008ed3" }}>{botsUsed}</div>
                    <div style={{ fontSize: 12, color: "#6c757d" }}>Bots Used</div>
                  </div>
                  <div className="text-center">
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#34c38f" }}>{botQuota}</div>
                    <div style={{ fontSize: 12, color: "#6c757d" }}>Bot Quota</div>
                  </div>
                  <div className="text-center">
                    <div style={{ fontSize: 28, fontWeight: 700, color: botQuota - botsUsed > 0 ? "#34c38f" : "#f46a6a" }}>
                      {botQuota - botsUsed}
                    </div>
                    <div style={{ fontSize: 12, color: "#6c757d" }}>Available</div>
                  </div>
                </div>
              </div>

              {/* Usage bar */}
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Bot Usage</small>
                  <small className="text-muted">{botsUsed}/{botQuota}</small>
                </div>
                <div style={{ height: 8, background: "#e9ecef", borderRadius: 4 }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: `${Math.min((botsUsed / botQuota) * 100, 100)}%`,
                    background: botsUsed >= botQuota ? "#f46a6a" : "#008ed3",
                    transition: "width 0.3s",
                  }} />
                </div>
                {botsUsed >= botQuota && (
                  <small className="text-danger mt-1 d-block">
                    <i className="mdi mdi-alert-circle me-1"></i>
                    You've reached your bot limit. Upgrade your plan to add more bots.
                  </small>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {success && <Alert color="success" className="mb-4"><i className="mdi mdi-check-circle me-2"></i>{success}</Alert>}
      {error && <Alert color="danger" className="mb-4">{error}</Alert>}

      {/* Plan Cards */}
      <h5 className="mb-4">Available Plans</h5>
      <Row>
        {PLANS.map((plan) => {
          const isCurrent = isCurrentPlan(plan.name);
          const canUpgrade = isUpgrade(plan);

          return (
            <Col xl={3} md={6} key={plan.name} className="mb-4">
              <Card style={{
                border: `2px solid ${isCurrent ? plan.color : "#e9ecef"}`,
                borderRadius: 14,
                height: "100%",
                position: "relative",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: plan.popular ? `0 8px 24px ${plan.color}33` : "none",
              }}>
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: plan.color, color: "#fff", borderRadius: 20,
                    padding: "3px 16px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                  }}>
                    ⭐ Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div style={{
                    position: "absolute", top: -12, right: 16,
                    background: "#34c38f", color: "#fff", borderRadius: 20,
                    padding: "3px 12px", fontSize: 11, fontWeight: 700,
                  }}>
                    ✓ Current
                  </div>
                )}

                <CardBody style={{ display: "flex", flexDirection: "column" }}>
                  {/* Plan header */}
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: plan.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <i className="mdi mdi-robot-outline" style={{ color: "#fff", fontSize: 22 }}></i>
                    </div>
                    <h5 style={{ color: plan.color, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h5>
                    <div>
                      <span style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e" }}>{plan.price}</span>
                      <span style={{ fontSize: 13, color: "#6c757d" }}>{plan.period}</span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <Badge style={{ background: plan.color, fontSize: 12, padding: "4px 10px" }}>
                        {typeof plan.bots === "number" ? `${plan.bots} Bot${plan.bots > 1 ? "s" : ""}` : "Unlimited Bots"}
                      </Badge>
                    </div>
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ padding: "5px 0", fontSize: 13, color: "#445566", display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="mdi mdi-check-circle" style={{ color: plan.color, fontSize: 16, flexShrink: 0 }}></i>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Action button */}
                  {isCurrent ? (
                    <button disabled className="btn w-100"
                      style={{ background: "#f8f9fa", color: "#6c757d", border: "1px solid #dee2e6", borderRadius: 8 }}>
                      Current Plan
                    </button>
                  ) : !canUpgrade ? (
                    <button disabled className="btn w-100"
                      style={{ background: "#f8f9fa", color: "#adb5bd", border: "1px solid #dee2e6", borderRadius: 8, fontSize: 13 }}>
                      Lower Plan
                    </button>
                  ) : showMessageFor === plan.name ? (
                    <div>
                      <Input type="textarea" rows={2} placeholder="Any message for the team? (optional)"
                        value={message} onChange={(e) => setMessage(e.target.value)}
                        style={{ borderRadius: 8, fontSize: 13, marginBottom: 8 }} />
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary flex-fill"
                          onClick={() => { setShowMessageFor(null); setMessage(""); }}>
                          Cancel
                        </button>
                        <button className="btn btn-sm flex-fill"
                          style={{ background: plan.color, color: "#fff", border: "none", borderRadius: 6 }}
                          disabled={loading}
                          onClick={() => handleRequest(plan.name)}>
                          {loading && requestingPlan === plan.name
                            ? <><span className="spinner-border spinner-border-sm me-1"></span>Sending...</>
                            : "Send Request"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn w-100"
                      style={{ background: plan.color, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 }}
                      onClick={() => { setShowMessageFor(plan.name); setRequestingPlan(plan.name); }}>
                      {plan.name === "Custom" ? "Contact Sales" : "Request Upgrade"} →
                    </button>
                  )}
                </CardBody>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* FAQ */}
      <Row className="mt-2">
        <Col xl={12}>
          <Card>
            <CardBody>
              <h6 className="mb-3">Frequently Asked Questions</h6>
              <Row>
                <Col xl={6}>
                  <p style={{ fontSize: 13 }}><strong>How does the upgrade work?</strong><br />
                    Click "Request Upgrade", optionally add a message, and submit. Our team at Ants Digital will process your request within 24 hours and send you a confirmation email.
                  </p>
                  <p style={{ fontSize: 13 }}><strong>Will I lose my data when upgrading?</strong><br />
                    No. All your existing leads, conversations, and bot configuration are preserved when you upgrade.
                  </p>
                </Col>
                <Col xl={6}>
                  <p style={{ fontSize: 13 }}><strong>Can I add more bots after upgrading?</strong><br />
                    Yes. Once your plan is upgraded, new bots will be created by the Ants Digital team and assigned to your account.
                  </p>
                  <p style={{ fontSize: 13 }}><strong>Need a custom plan?</strong><br />
                    Contact us at <a href="mailto:gannavaram.shailaja@antsdigital.in">gannavaram.shailaja@antsdigital.in</a> for custom pricing and features.
                  </p>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(MyPlan);