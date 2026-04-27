import React, { useEffect, useState } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody } from "reactstrap";
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

const Dashboard = ({ setBreadcrumbItems }) => {
  const dispatch = useDispatch();
  const user = getAuthUser();
  const botId = user.bot_id || "margadarsi";
  const [days, setDays] = useState(30);
  document.title = `Dashboard | ${user.bot_name || "Ants Digital"}`;

  useEffect(() => {
    setBreadcrumbItems(user.bot_name || "Dashboard", [{ title: "Dashboard", link: "#" }]);
    dispatch(fetchDashboardData(botId));
  }, [botId]); // eslint-disable-line

  const { stats, leadsChart, convsChart, recentLeads, loading } = useSelector((s) => s.Dashboard);

  // Filter chart data by selected days
  const filteredLeads = (leadsChart || []).slice(-days);
  const filteredConvs = (convsChart || []).slice(-days);

  const leadsOptions = {
    chart: { type: "area", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
    colors: ["#008ed3"],
    xaxis: { categories: filteredLeads.map((d) => d.date), labels: { rotate: -45, style: { fontSize: "10px" } }, tickAmount: 10 },
    yaxis: { min: 0, labels: { formatter: (v) => Math.round(v) } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f1f1f1" },
    tooltip: { y: { formatter: (v) => `${v} leads` } },
  };

  const convsOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#34c38f"],
    xaxis: { categories: filteredConvs.map((d) => d.date), labels: { rotate: -45, style: { fontSize: "10px" } }, tickAmount: 10 },
    yaxis: { min: 0, labels: { formatter: (v) => Math.round(v) } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f1f1f1" },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "60%" } },
    tooltip: { y: { formatter: (v) => `${v} conversations` } },
  };

  const leadsTotal = filteredLeads.reduce((a, d) => a + (d.leads || 0), 0);
  const convsTotal = filteredConvs.reduce((a, d) => a + (d.conversations || 0), 0);
  const leadsAvg = filteredLeads.length ? (leadsTotal / filteredLeads.length).toFixed(1) : 0;
  const convsAvg = filteredConvs.length ? (convsTotal / filteredConvs.length).toFixed(1) : 0;

  const chatbotUrl = `https://chitassist.vercel.app/?bot_id=${botId}`;

  const DaysFilter = () => (
    <div className="d-flex gap-1">
      {[7, 30, 90].map((d) => (
        <button key={d} onClick={() => setDays(d)}
          style={{ padding: "3px 10px", borderRadius: 6, border: `1px solid ${days === d ? "#008ed3" : "#dee2e6"}`, background: days === d ? "#008ed3" : "#fff", color: days === d ? "#fff" : "#6c757d", fontSize: 12, cursor: "pointer" }}>
          {d}d
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "#008ed3" }} role="status" />
        <p className="mt-3 text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* Quick Actions Bar */}
      <Row className="mb-3">
        <Col xl={12}>
          <div className="d-flex align-items-center gap-3 p-3" style={{ background: "#f4f9fd", borderRadius: 10, border: "1px solid #e0ecf8" }}>
            <span style={{ fontSize: 13, color: "#445566", fontWeight: 600 }}>Quick Actions:</span>
            <a href={chatbotUrl} target="_blank" rel="noreferrer"
              className="btn btn-sm"
              style={{ background: "#008ed3", color: "#fff", borderRadius: 6, border: "none", fontSize: 12 }}>
              <i className="mdi mdi-open-in-new me-1"></i>Preview Bot
            </a>
            <span style={{ fontSize: 12, color: "#6c757d" }}>
              <i className="mdi mdi-link me-1"></i>
              {chatbotUrl}
            </span>
          </div>
        </Col>
      </Row>

      {/* Stats */}
      <Row>
        <Col xl={3} md={6}><StatCard title="Total Leads" value={stats?.total_leads ?? "—"} sub={`Today: ${stats?.today_leads ?? 0}`} icon="mdi mdi-account-check" color="#008ed3" /></Col>
        <Col xl={3} md={6}><StatCard title="Total Conversations" value={stats?.total_conversations ?? "—"} sub={`Today: ${stats?.today_conversations ?? 0}`} icon="mdi mdi-chat-processing" color="#34c38f" /></Col>
        <Col xl={3} md={6}><StatCard title="Avg Leads / Day" value={leadsAvg} sub={`Last ${days} days`} icon="mdi mdi-trending-up" color="#f1b44c" /></Col>
        <Col xl={3} md={6}><StatCard title="Avg Conversations / Day" value={convsAvg} sub={`Last ${days} days`} icon="mdi mdi-chart-bar" color="#50a5f1" /></Col>
      </Row>

      {/* Charts with date filter */}
      <Row>
        <Col xl={6}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0">Leads</h4>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge" style={{ background: "#008ed3", color: "#fff", fontSize: 11 }}>Total: {leadsTotal}</span>
                  <DaysFilter />
                </div>
              </div>
              {filteredLeads.length > 0
                ? <ReactApexChart options={leadsOptions} series={[{ name: "Leads", data: filteredLeads.map((d) => d.leads || 0) }]} type="area" height={260} />
                : <div className="text-center text-muted py-5"><i className="mdi mdi-chart-line font-size-36 d-block mb-2"></i>No leads data yet</div>}
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0">Conversations</h4>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge" style={{ background: "#34c38f", color: "#fff", fontSize: 11 }}>Total: {convsTotal}</span>
                  <DaysFilter />
                </div>
              </div>
              {filteredConvs.length > 0
                ? <ReactApexChart options={convsOptions} series={[{ name: "Conversations", data: filteredConvs.map((d) => d.conversations || 0) }]} type="bar" height={260} />
                : <div className="text-center text-muted py-5"><i className="mdi mdi-chart-bar font-size-36 d-block mb-2"></i>No data yet</div>}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Recent Leads */}
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