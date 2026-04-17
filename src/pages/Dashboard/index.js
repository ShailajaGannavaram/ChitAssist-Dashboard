import React, { useEffect } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import { setBreadcrumbItems, fetchDashboardData } from "../../store/actions";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const StatCard = ({ title, value, icon, color }) => (
  <Card className="mini-stats-wid">
    <CardBody>
      <div className="d-flex">
        <div className="flex-grow-1">
          <p className="text-muted fw-medium mb-2">{title}</p>
          <h4 className="mb-0">{value ?? "—"}</h4>
        </div>
        <div className="mini-stat-icon avatar-sm rounded-circle align-self-center" style={{ background: color }}>
          <span className="avatar-title rounded-circle" style={{ background: color }}>
            <i className={`${icon} font-size-24`} style={{ color: "#fff" }}></i>
          </span>
        </div>
      </div>
    </CardBody>
  </Card>
);

const Dashboard = (props) => {
  const dispatch = useDispatch();
  const user = getAuthUser();
  const botId = user.bot_id || "margadarsi";

  document.title = `${user.bot_name || "Dashboard"} | ChitAssist`;

  useEffect(() => {
    props.setBreadcrumbItems(user.bot_name || "Dashboard", [{ title: "Dashboard", link: "#" }]);
    dispatch(fetchDashboardData(botId));
  }, [botId]);

  const { stats, leadsChart, convsChart, recentLeads, loading } = useSelector((s) => s.Dashboard);

  const chartOptions = (data, color, label) => ({
    options: {
      chart: { toolbar: { show: false }, sparkline: { enabled: false } },
      colors: [color],
      xaxis: { categories: (data || []).map((d) => d.date || d.label || ""), labels: { style: { fontSize: "11px" } } },
      stroke: { curve: "smooth", width: 2 },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
      dataLabels: { enabled: false },
      tooltip: { x: { format: "dd MMM" } },
      grid: { borderColor: "#f1f1f1" },
    },
    series: [{ name: label, data: (data || []).map((d) => d.count || d.value || 0) }],
  });

  const leadsChartData = chartOptions(leadsChart, "#556ee6", "Leads");
  const convsChartData = chartOptions(convsChart, "#34c38f", "Conversations");

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3 text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* Stat Cards */}
      <Row>
        <Col md={3}><StatCard title="Total Leads" value={stats?.total_leads} icon="mdi mdi-account-check" color="#556ee6" /></Col>
        <Col md={3}><StatCard title="Total Conversations" value={stats?.total_conversations} icon="mdi mdi-chat-processing" color="#34c38f" /></Col>
        <Col md={3}><StatCard title="Today's Leads" value={stats?.today_leads} icon="mdi mdi-account-plus" color="#f46a6a" /></Col>
        <Col md={3}><StatCard title="Today's Conversations" value={stats?.today_conversations} icon="mdi mdi-message-plus" color="#f1b44c" /></Col>
      </Row>

      {/* Charts */}
      <Row>
        <Col xl={6}>
          <Card>
            <CardBody>
              <h4 className="card-title mb-4">Leads Over Time</h4>
              <ReactApexChart options={leadsChartData.options} series={leadsChartData.series} type="area" height={260} />
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card>
            <CardBody>
              <h4 className="card-title mb-4">Conversations Over Time</h4>
              <ReactApexChart options={convsChartData.options} series={convsChartData.series} type="area" height={260} />
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Recent Leads Table */}
      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <h4 className="card-title mb-4">Recent Leads</h4>
              <div className="table-responsive">
                <table className="table table-centered table-hover table-nowrap mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Serial</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentLeads || []).length === 0 ? (
                      <tr><td colSpan={5} className="text-center text-muted py-3">No leads yet</td></tr>
                    ) : (
                      (recentLeads || []).map((lead, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td><span className="badge bg-primary">{lead.lead_date}#{String(lead.serial_number).padStart(3,"0")}</span></td>
                          <td>{lead.data?.name || lead.data?.Name || "—"}</td>
                          <td>{lead.data?.phone || lead.data?.Phone || lead.data?.mobile || "—"}</td>
                          <td>{lead.lead_date}</td>
                        </tr>
                      ))
                    )}
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