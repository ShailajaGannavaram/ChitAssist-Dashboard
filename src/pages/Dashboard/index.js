import React, { useEffect, useState } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody, Alert } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import { setBreadcrumbItems, fetchDashboardData } from "../../store/actions";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const StatCard = ({ title, value, sub, icon, color }) => (
  <Card className="mini-stats-wid">
    <CardBody>
      <div className="d-flex">
        <div className="flex-grow-1">
          <p className="text-muted fw-medium mb-2">{title}</p>
          <h4 className="mb-0">{value ?? "—"}</h4>
          {sub && <p className="text-muted mt-1 mb-0" style={{ fontSize: 12 }}>{sub}</p>}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center", flexShrink: 0 }}>
          <i className={`${icon} font-size-22`} style={{ color: "#fff" }}></i>
        </div>
      </div>
    </CardBody>
  </Card>
);

const EmbedCode = ({ botId, botName }) => {
  const [copied, setCopied] = useState("");
  const chatbotUrl = `https://chitassist.vercel.app/?bot_id=${botId}`;

  const iframeCode = `<iframe
  src="${chatbotUrl}"
  width="400"
  height="600"
  frameborder="0"
  allow="microphone"
  style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15)">
</iframe>`;

  const scriptCode = `<!-- ${botName} Chatbot -->
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${chatbotUrl}';
    iframe.style = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:9999';
    iframe.allow = 'microphone';
    document.body.appendChild(iframe);
  })();
</script>`;

  const copy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <Card>
      <CardBody>
        <h5 className="card-title mb-1">
          <i className="mdi mdi-code-tags me-2" style={{ color: "#008ed3" }}></i>
          Embed Your Chatbot
        </h5>
        <p className="text-muted mb-4" style={{ fontSize: 13 }}>
          Add <strong>{botName}</strong> to your website using one of these options:
        </p>

        {/* Option 1: iFrame */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Option 1 — iFrame (Fixed size)</h6>
            <button className="btn btn-sm"
              style={{ background: copied === "iframe" ? "#34c38f" : "#008ed3", color: "#fff", borderRadius: 6, border: "none", padding: "4px 12px", fontSize: 12 }}
              onClick={() => copy(iframeCode, "iframe")}>
              <i className={`mdi ${copied === "iframe" ? "mdi-check" : "mdi-content-copy"} me-1`}></i>
              {copied === "iframe" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre style={{ background: "#f4f9fd", border: "1px solid #e0ecf8", borderRadius: 8, padding: "12px 16px", fontSize: 12, overflow: "auto", margin: 0, color: "#334" }}>
            {iframeCode}
          </pre>
        </div>

        {/* Option 2: Floating Script */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Option 2 — Floating Widget (Recommended)</h6>
            <button className="btn btn-sm"
              style={{ background: copied === "script" ? "#34c38f" : "#008ed3", color: "#fff", borderRadius: 6, border: "none", padding: "4px 12px", fontSize: 12 }}
              onClick={() => copy(scriptCode, "script")}>
              <i className={`mdi ${copied === "script" ? "mdi-check" : "mdi-content-copy"} me-1`}></i>
              {copied === "script" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre style={{ background: "#f4f9fd", border: "1px solid #e0ecf8", borderRadius: 8, padding: "12px 16px", fontSize: 12, overflow: "auto", margin: 0, color: "#334" }}>
            {scriptCode}
          </pre>
          <p className="text-muted mt-2 mb-0" style={{ fontSize: 12 }}>
            <i className="mdi mdi-information-outline me-1"></i>
            Paste this just before the <code>&lt;/body&gt;</code> tag in your website's HTML.
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

const Dashboard = ({ setBreadcrumbItems }) => {
  const dispatch = useDispatch();
  const user = getAuthUser();
  const botId = user.bot_id || "margadarsi";
  document.title = `Dashboard | ${user.bot_name || "Ants Digital"}`;

  useEffect(() => {
    setBreadcrumbItems(user.bot_name || "Dashboard", [{ title: "Dashboard", link: "#" }]);
    dispatch(fetchDashboardData(botId));
  }, [botId]); // eslint-disable-line

  const { stats, leadsChart, convsChart, recentLeads, loading } = useSelector((s) => s.Dashboard);

  const leadsOptions = {
    chart: { type: "area", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
    colors: ["#008ed3"],
    xaxis: { categories: (leadsChart || []).map((d) => d.date), labels: { rotate: -45, style: { fontSize: "10px" } }, tickAmount: 10 },
    yaxis: { min: 0, labels: { formatter: (v) => Math.round(v) } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f1f1f1" },
    tooltip: { y: { formatter: (v) => `${v} leads` } },
  };

  const convsOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#34c38f"],
    xaxis: { categories: (convsChart || []).map((d) => d.date), labels: { rotate: -45, style: { fontSize: "10px" } }, tickAmount: 10 },
    yaxis: { min: 0, labels: { formatter: (v) => Math.round(v) } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f1f1f1" },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "60%" } },
    tooltip: { y: { formatter: (v) => `${v} conversations` } },
  };

  const leadsTotal = (leadsChart || []).reduce((a, d) => a + (d.leads || 0), 0);
  const convsTotal = (convsChart || []).reduce((a, d) => a + (d.conversations || 0), 0);
  const leadsAvg = leadsChart?.length ? (leadsTotal / leadsChart.length).toFixed(1) : 0;
  const convsAvg = convsChart?.length ? (convsTotal / convsChart.length).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "#008ed3" }} role="status" />
        <p className="mt-3 text-muted">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Row>
        <Col xl={3} md={6}><StatCard title="Total Leads" value={stats?.total_leads ?? "—"} sub={`Today: ${stats?.today_leads ?? 0}`} icon="mdi mdi-account-check" color="#008ed3" /></Col>
        <Col xl={3} md={6}><StatCard title="Total Conversations" value={stats?.total_conversations ?? "—"} sub={`Today: ${stats?.today_conversations ?? 0}`} icon="mdi mdi-chat-processing" color="#34c38f" /></Col>
        <Col xl={3} md={6}><StatCard title="Avg Leads / Day" value={leadsAvg} sub="Last 30 days" icon="mdi mdi-trending-up" color="#f1b44c" /></Col>
        <Col xl={3} md={6}><StatCard title="Avg Conversations / Day" value={convsAvg} sub="Last 30 days" icon="mdi mdi-chart-bar" color="#50a5f1" /></Col>
      </Row>

      <Row>
        <Col xl={6}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0">Leads — Last 30 Days</h4>
                <span className="badge" style={{ background: "#008ed3", color: "#fff", fontSize: 12 }}>Total: {leadsTotal}</span>
              </div>
              {(leadsChart || []).length > 0
                ? <ReactApexChart options={leadsOptions} series={[{ name: "Leads", data: (leadsChart || []).map((d) => d.leads || 0) }]} type="area" height={280} />
                : <div className="text-center text-muted py-5"><i className="mdi mdi-chart-line font-size-36 d-block mb-2"></i>No leads data yet</div>}
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0">Conversations — Last 30 Days</h4>
                <span className="badge" style={{ background: "#34c38f", color: "#fff", fontSize: 12 }}>Total: {convsTotal}</span>
              </div>
              {(convsChart || []).length > 0
                ? <ReactApexChart options={convsOptions} series={[{ name: "Conversations", data: (convsChart || []).map((d) => d.conversations || 0) }]} type="bar" height={280} />
                : <div className="text-center text-muted py-5"><i className="mdi mdi-chart-bar font-size-36 d-block mb-2"></i>No conversation data yet</div>}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Embed Code Section */}
      <Row>
        <Col xl={12}>
          <EmbedCode botId={botId} botName={user.bot_name || "Chatbot"} />
        </Col>
      </Row>

      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <h4 className="card-title mb-4">Recent Leads</h4>
              <div className="table-responsive">
                <table className="table table-centered table-hover table-nowrap mb-0">
                  <thead className="table-light">
                    <tr><th>#</th><th>Serial</th><th>Name</th><th>Phone</th><th>Date</th><th>Webhook</th></tr>
                  </thead>
                  <tbody>
                    {!(recentLeads || []).length
                      ? <tr><td colSpan={6} className="text-center text-muted py-4">No leads yet</td></tr>
                      : (recentLeads || []).map((lead, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td><span className="badge" style={{ background: "#008ed3" }}>{lead.lead_date}#{String(lead.serial_number || i+1).padStart(3,"0")}</span></td>
                          <td>{lead.data?.name || lead.data?.Name || "—"}</td>
                          <td>{lead.data?.phone || lead.data?.Phone || lead.data?.mobile || "—"}</td>
                          <td>{lead.lead_date}</td>
                          <td><span className={`badge ${lead.webhook_sent ? "bg-success" : "bg-warning"}`}>{lead.webhook_sent ? "Sent" : "Pending"}</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(Dashboard);