import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Row, Col, Card, CardBody, Badge, Alert, Input } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";
import { requestPlanUpgrade } from "../../helpers/fakebackend_helper";

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";
const RAZORPAY_KEY_ID = "rzp_test_SlAuqIaSG0ZtRw";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}").access || ""; } catch { return ""; }
};

const PLANS = [
  {
    name: "Starter", price: "₹1,999", amount: 199900, period: "/month", bots: 1, color: "#6c757d",
    features: ["1 Chatbot", "Unlimited Leads", "Conversation History", "Basic Analytics", "Email Support", "Embed Code"],
  },
  {
    name: "Pro", price: "₹4,999", amount: 499900, period: "/month", bots: 3, color: "#008ed3", popular: true,
    features: ["3 Chatbots", "Unlimited Leads", "Conversation History", "Advanced Analytics", "Webhook Integration", "Priority Support", "Custom Flow Steps", "Embed Code"],
  },
  {
    name: "Enterprise", price: "₹9,999", amount: 999900, period: "/month", bots: 10, color: "#5b3cc4",
    features: ["10 Chatbots", "Unlimited Leads", "Full History", "Advanced Analytics", "Webhook + API", "Dedicated Support", "Custom Branding", "Embed Code", "SLA Guarantee"],
  },
  {
    name: "Custom", price: "Contact Us", amount: null, period: "", bots: "Unlimited", color: "#f1b44c",
    features: ["Unlimited Chatbots", "Custom Features", "White-label Option", "API Access", "Dedicated Manager", "Custom Integrations"],
  },
];

// Load Razorpay script dynamically
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const MyPlan = ({ setBreadcrumbItems }) => {
  const user = getAuthUser();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showMessageFor, setShowMessageFor] = useState(null);
  const [message, setMessage] = useState("");
  const [currentPlan, setCurrentPlan] = useState(user.plan_name || "Starter");
  const [botQuota, setBotQuota] = useState(user.bot_quota || 1);

  const botsUsed = user.all_user_bots?.length || 1;

  document.title = "My Plan | ChitAssist Dashboard";

  useEffect(() => {
    setBreadcrumbItems("My Plan", [
      { title: "Dashboard", link: "/dashboard" },
      { title: "My Plan", link: "#" },
    ]);
  }, []); // eslint-disable-line

  const handlePayment = async (plan) => {
    setPaymentLoading(true); setError(""); setSuccess("");

    // Load Razorpay script
    const loaded = await loadRazorpay();
    if (!loaded) {
      setError("Could not load payment gateway. Please check your internet connection.");
      setPaymentLoading(false); return;
    }

    try {
      // Step 1: Create order on Django backend
      const orderRes = await fetch(`${API_URL}/api/client/payment/create-order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ plan_name: plan.name }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderData.error || "Failed to initiate payment.");
        setPaymentLoading(false); return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Ants Digital",
        description: `${plan.name} Plan — ${plan.price}/month`,
        image: "https://antsdigital.in/assets/images/antslogo.png",
        order_id: orderData.order_id,
        prefill: {
          name: user.username || "",
          email: user.email || "",
        },
        theme: { color: "#008ed3" },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            setError("Payment cancelled.");
          }
        },
        handler: async (response) => {
          // Step 3: Verify payment on Django backend
          try {
            const verifyRes = await fetch(`${API_URL}/api/client/payment/verify/`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_name: plan.name,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setCurrentPlan(verifyData.plan_name);
              setBotQuota(verifyData.bot_quota);
              setSuccess(`🎉 Payment successful! Your plan has been upgraded to ${verifyData.plan_name}. A confirmation email has been sent to ${user.email}. Please log out and log back in to see updated quota.`);

              // Update localStorage so sidebar shows new plan
              const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
              authUser.plan_name = verifyData.plan_name;
              authUser.bot_quota = verifyData.bot_quota;
              localStorage.setItem("authUser", JSON.stringify(authUser));
            } else {
              setError(verifyData.error || "Payment verification failed.");
            }
          } catch {
            setError("Payment was received but verification failed. Please contact support with Payment ID: " + response.razorpay_payment_id);
          } finally {
            setPaymentLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setPaymentLoading(false);
      });
      rzp.open();

    } catch {
      setError("Could not connect to server. Please try again.");
      setPaymentLoading(false);
    }
  };

  const handleRequest = async (planName) => {
    setRequestLoading(true); setError(""); setSuccess("");
    try {
      const data = await requestPlanUpgrade({ requested_plan: planName, message });
      if (data.success) {
        setSuccess(`Your request for the ${planName} plan has been sent! Our team will contact you within 24 hours.`);
        setShowMessageFor(null); setMessage("");
      } else {
        setError(data.error || "Failed to send request.");
      }
    } catch (err) {
      setError("Could not connect. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  };

  const planIndex = (name) => PLANS.findIndex((p) => p.name === name);
  const isCurrentPlan = (name) => name === currentPlan;
  const isUpgrade = (name) => planIndex(name) > planIndex(currentPlan);

  return (
    <React.Fragment>
      {/* Current Plan Banner */}
      <Row className="mb-4">
        <Col xl={12}>
          <Card style={{ border: "2px solid #008ed3", background: "linear-gradient(135deg, #f4f9fd, #fff)" }}>
            <CardBody>
              <div className="d-flex align-items-center gap-4 flex-wrap">
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="mdi mdi-crown" style={{ color: "#fff", fontSize: 26 }}></i>
                </div>
                <div>
                  <h5 className="mb-1">Current Plan: <strong style={{ color: "#008ed3" }}>{currentPlan}</strong></h5>
                  <p className="text-muted mb-0" style={{ fontSize: 13 }}>{user.email}</p>
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
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Bot Usage</small>
                  <small className="text-muted">{botsUsed}/{botQuota}</small>
                </div>
                <div style={{ height: 8, background: "#e9ecef", borderRadius: 4 }}>
                  <div style={{ height: "100%", borderRadius: 4, width: `${Math.min((botsUsed / botQuota) * 100, 100)}%`, background: botsUsed >= botQuota ? "#f46a6a" : "#008ed3", transition: "width 0.3s" }} />
                </div>
                {botsUsed >= botQuota && (
                  <small className="text-danger mt-1 d-block">
                    <i className="mdi mdi-alert-circle me-1"></i>Bot limit reached. Upgrade to add more.
                  </small>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {success && <Alert color="success" className="mb-4"><i className="mdi mdi-check-circle me-2"></i>{success}</Alert>}
      {error && <Alert color="danger" className="mb-4">{error}</Alert>}

      {/* Test mode notice */}
      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#856404" }}>
        <i className="mdi mdi-information-outline me-2"></i>
        <strong>Test Mode:</strong> Use card number <strong>4111 1111 1111 1111</strong>, any future expiry, CVV <strong>123</strong> to test payment.
      </div>

      <h5 className="mb-4">Available Plans</h5>
      <Row>
        {PLANS.map((plan) => {
          const isCurrent = isCurrentPlan(plan.name);
          const canUpgrade = isUpgrade(plan.name);

          return (
            <Col xl={3} md={6} key={plan.name} className="mb-4">
              <Card style={{ border: `2px solid ${isCurrent ? plan.color : "#e9ecef"}`, borderRadius: 14, height: "100%", position: "relative", boxShadow: plan.popular ? `0 8px 24px ${plan.color}33` : "none" }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", borderRadius: 20, padding: "3px 16px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    ⭐ Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div style={{ position: "absolute", top: -12, right: 16, background: "#34c38f", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>
                    ✓ Current
                  </div>
                )}
                <CardBody style={{ display: "flex", flexDirection: "column" }}>
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

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ padding: "5px 0", fontSize: 13, color: "#445566", display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="mdi mdi-check-circle" style={{ color: plan.color, fontSize: 16, flexShrink: 0 }}></i>{f}
                      </li>
                    ))}
                  </ul>

                  {/* Action buttons */}
                  {isCurrent ? (
                    <button disabled className="btn w-100" style={{ background: "#f8f9fa", color: "#6c757d", border: "1px solid #dee2e6", borderRadius: 8 }}>
                      Current Plan
                    </button>
                  ) : !canUpgrade ? (
                    <button disabled className="btn w-100" style={{ background: "#f8f9fa", color: "#adb5bd", border: "1px solid #dee2e6", borderRadius: 8, fontSize: 13 }}>
                      Lower Plan
                    </button>
                  ) : plan.name === "Custom" ? (
                    // Custom plan — request only, no payment
                    showMessageFor === plan.name ? (
                      <div>
                        <Input type="textarea" rows={2} placeholder="Tell us your requirements..." value={message}
                          onChange={(e) => setMessage(e.target.value)} style={{ borderRadius: 8, fontSize: 13, marginBottom: 8 }} />
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => { setShowMessageFor(null); setMessage(""); }}>Cancel</button>
                          <button className="btn btn-sm flex-fill" disabled={requestLoading}
                            style={{ background: plan.color, color: "#fff", border: "none", borderRadius: 6 }}
                            onClick={() => handleRequest(plan.name)}>
                            {requestLoading ? <><span className="spinner-border spinner-border-sm me-1"></span>Sending...</> : "Contact Sales"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn w-100" style={{ background: plan.color, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 }}
                        onClick={() => setShowMessageFor(plan.name)}>
                        Contact Sales →
                      </button>
                    )
                  ) : (
                    // Starter/Pro/Enterprise — Razorpay payment
                    <button className="btn w-100" disabled={paymentLoading}
                      style={{ background: plan.color, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 }}
                      onClick={() => handlePayment(plan)}>
                      {paymentLoading
                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                        : <><i className="mdi mdi-credit-card me-1"></i>Pay {plan.price}</>}
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
          <Card><CardBody>
            <h6 className="mb-3">Frequently Asked Questions</h6>
            <Row>
              <Col xl={6}>
                <p style={{ fontSize: 13 }}><strong>Is the payment secure?</strong><br />Yes. All payments are processed by Razorpay, a PCI DSS compliant payment gateway. We never store your card details.</p>
                <p style={{ fontSize: 13 }}><strong>When does my plan upgrade?</strong><br />Immediately after successful payment. Your bot quota updates instantly and a confirmation email is sent.</p>
              </Col>
              <Col xl={6}>
                <p style={{ fontSize: 13 }}><strong>Will I lose my data?</strong><br />No. All existing leads, conversations, and bot configuration are preserved.</p>
                <p style={{ fontSize: 13 }}><strong>Need a custom plan?</strong><br />Click "Contact Sales" on the Custom plan or email <a href="mailto:gannavaram.shailaja@antsdigital.in">gannavaram.shailaja@antsdigital.in</a></p>
              </Col>
            </Row>
          </CardBody></Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(MyPlan);