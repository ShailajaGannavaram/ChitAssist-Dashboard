import React, { useEffect } from "react";
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
  document.title = `Dashboard | ${user.bot_name || "Ants Digital"}`;

  useEffect(() => {
    setBreadcrumbItems(user.bot_name || "Dashboard", [{ title: "Dashboard", link: "#" }]);
    dispatch(fetchDashboardData(botId));
  }, [botId]); // eslint-disable-line

  const { stats, leadsChart, convsChart, recentLeads, loading } = useSelector((s) => s.Dashboard);

  // Chart options — leads
  const leadsOptions = {
    chart: { type: "area", toolbar: { show: false }, animations: { enabled: true } },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
    colors: ["#008ed3"],
    xaxis: {
      categories: (leadsChart || []).map((d) => d.date),
      labels: { rotate: -45, style: { fontSize: "10px" } },
      tickAmount: 10,
    },
    yaxis: { min: 0, labels: { formatter: (v) => Math.round(v) } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f1f1f1" },
    tooltip: { y: { formatter: (v) => `${v} leads` } },
  };

  // Chart options — conversations
  const convsOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#34c38f"],
    xaxis: {
      categories: (convsChart || []).map((d) => d.date),
      labels: { rotate: -45, style: { fontSize: "10px" } },
      tickAmount: 10,
    },
    yaxis: { min: 0, labels: { formatter: (v) => Math.round(v) } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f1f1f1" },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "60%" } },
    tooltip: { y: { formatter: (v) => `${v} conversations` } },
  };

  // Total from chart data
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
      {/* Stat Cards */}
      <Row>
        <Col xl={3} md={6}><StatCard title="Total Leads" value={stats?.total_leads ?? "—"} sub={`Today: ${stats?.today_leads ?? 0}`} icon="mdi mdi-account-check" color="#008ed3" /></Col>
        <Col xl={3} md={6}><StatCard title="Total Conversations" value={stats?.total_conversations ?? "—"} sub={`Today: ${stats?.today_conversations ?? 0}`} icon="mdi mdi-chat-processing" color="#34c38f" /></Col>
        <Col xl={3} md={6}><StatCard title="Avg Leads / Day" value={leadsAvg} sub="Last 30 days" icon="mdi mdi-trending-up" color="#f1b44c" /></Col>
        <Col xl={3} md={6}><StatCard title="Avg Conversations / Day" value={convsAvg} sub="Last 30 days" icon="mdi mdi-chart-bar" color="#50a5f1" /></Col>
      </Row>

      {/* Charts */}
      <Row>
        <Col xl={6}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0">Leads — Last 30 Days</h4>
                <span className="badge" style={{ background: "#008ed3", color: "#fff", fontSize: 12 }}>Total: {leadsTotal}</span>
              </div>
              {(leadsChart || []).length > 0 ? (
                <ReactApexChart
                  options={leadsOptions}
                  series={[{ name: "Leads", data: (leadsChart || []).map((d) => d.leads || 0) }]}
                  type="area" height={280}
                />
              ) : (
                <div className="text-center text-muted py-5"><i className="mdi mdi-chart-line font-size-36 d-block mb-2"></i>No leads data yet</div>
              )}
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
              {(convsChart || []).length > 0 ? (
                <ReactApexChart
                  options={convsOptions}
                  series={[{ name: "Conversations", data: (convsChart || []).map((d) => d.conversations || 0) }]}
                  type="bar" height={280}
                />
              ) : (
                <div className="text-center text-muted py-5"><i className="mdi mdi-chart-bar font-size-36 d-block mb-2"></i>No conversation data yet</div>
              )}
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
                    {!(recentLeads || []).length ? (
                      <tr><td colSpan={6} className="text-center text-muted py-4">No leads yet</td></tr>
                    ) : (recentLeads || []).map((lead, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td><span className="badge" style={{ background: "#008ed3" }}>{lead.lead_date}#{String(lead.serial_number || i+1).padStart(3,"0")}</span></td>
                        <td>{lead.data?.name || lead.data?.Name || lead.name || "—"}</td>
                        <td>{lead.data?.phone || lead.data?.Phone || lead.phone || "—"}</td>
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