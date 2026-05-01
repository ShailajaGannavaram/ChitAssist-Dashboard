import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import { Row, Col, Card, CardBody, Modal, ModalHeader, ModalBody, Input, Label, Alert } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import { setBreadcrumbItems, fetchDashboardData } from "../../store/actions";

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const getToken = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}").access || ""; } catch { return ""; }
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

const BotCard = ({ bot, onSelect }) => (
  <Card onClick={() => onSelect(bot)} style={{ cursor: "pointer", border: `2px solid ${bot.primary_color || "#008ed3"}22`, borderRadius: 12, transition: "all 0.2s" }}
    className="h-100">
    <CardBody>
      <div className="d-flex align-items-center gap-3 mb-3">
        <div style={{ width: 44, height: 44, borderRadius: 10, background: bot.primary_color || "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {bot.logo_url
            ? <img src={bot.logo_url} alt="" style={{ height: 28, filter: "brightness(0) invert(1)" }} onError={(e) => e.target.style.display = "none"} />
            : <i className="mdi mdi-robot" style={{ color: "#fff", fontSize: 22 }}></i>}
        </div>
        <div>
          <h6 className="mb-0">{bot.bot_name}</h6>
          <small className="text-muted">{bot.bot_id}</small>
        </div>
        {bot.is_active === false && <span className="badge bg-secondary ms-auto" style={{ fontSize: 10 }}>Inactive</span>}
      </div>
      <button className="btn btn-sm w-100" style={{ background: bot.primary_color || "#008ed3", color: "#fff", border: "none", borderRadius: 8 }}>
        Open Dashboard →
      </button>
    </CardBody>
  </Card>
);

const Dashboard = ({ setBreadcrumbItems }) => {
  const dispatch = useDispatch();
  const user = getAuthUser();
  const allUserBots = user.all_user_bots || [];
  const hasManyBots = allUserBots.length > 1;

  // If user has multiple bots, start with null (show selector)
  // If user has exactly 1 bot, start with that bot directly
  const [activeBotId, setActiveBotId] = useState(
    allUserBots.length === 1 ? allUserBots[0].bot_id : (allUserBots.length === 0 ? user.bot_id : null)
  );
  const [days, setDays] = useState(30);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ bot_id: "", bot_name: "", company_name: "", tagline: "", welcome_message: "Hello! How can I help you today?", primary_color: "#556ee6", secondary_color: "#34c38f", logo_url: "" });
  const [creating, setCreating] = useState(false);
  const [createAlert, setCreateAlert] = useState(null);

  const activeBot = allUserBots.find((b) => b.bot_id === activeBotId) || (activeBotId ? { bot_id: activeBotId, bot_name: user.bot_name } : null);

  document.title = activeBot ? `${activeBot.bot_name} | Dashboard` : "Dashboard | Ants Digital";

  useEffect(() => {
    if (activeBotId) {
      setBreadcrumbItems(activeBot?.bot_name || "Dashboard", [{ title: "Dashboard", link: "#" }]);
      dispatch(fetchDashboardData(activeBotId));
    } else {
      setBreadcrumbItems("My Bots", [{ title: "Dashboard", link: "#" }]);
    }
  }, [activeBotId]); // eslint-disable-line

  const { stats, leadsChart, convsChart, recentLeads, loading } = useSelector((s) => s.Dashboard);

  const filteredLeads = (leadsChart || []).slice(-days);
  const filteredConvs = (convsChart || []).slice(-days);
  const leadsTotal = filteredLeads.reduce((a, d) => a + (d.leads || 0), 0);
  const convsTotal = filteredConvs.reduce((a, d) => a + (d.conversations || 0), 0);
  const leadsAvg = filteredLeads.length ? (leadsTotal / filteredLeads.length).toFixed(1) : 0;
  const convsAvg = filteredConvs.length ? (convsTotal / filteredConvs.length).toFixed(1) : 0;

  const chatbotUrl = activeBotId ? `https://chitassist.vercel.app/?bot_id=${activeBotId}` : "";

  const botsUsed = allUserBots.length;
  const botQuota = user.bot_quota || 1;
  const canCreateMore = botsUsed < botQuota;

  const DaysFilter = () => (
    <div className="d-flex gap-1">
      {[7, 30, 90].map((d) => (
        <button key={d} onClick={() => setDays(d)} style={{
          padding: "3px 10px", borderRadius: 6,
          border: `1px solid ${days === d ? "#008ed3" : "#dee2e6"}`,
          background: days === d ? "#008ed3" : "#fff",
          color: days === d ? "#fff" : "#6c757d",
          fontSize: 12, cursor: "pointer"
        }}>{d}d</button>
      ))}
    </div>
  );

  const setForm = useCallback((field, value) => setCreateForm((f) => ({ ...f, [field]: value })), []);

  const handleCreateBot = async () => {
    if (!createForm.bot_id) return setCreateAlert({ msg: "Bot ID is required", color: "danger" });
    if (!createForm.bot_name) return setCreateAlert({ msg: "Bot Name is required", color: "danger" });
    setCreating(true); setCreateAlert(null);
    try {
      const res = await fetch(`${API_URL}/api/client/bots/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCreateAlert({ msg: `Bot "${data.bot_name}" created! Please log out and log back in to see it.`, color: "success" });
        setCreateForm({ bot_id: "", bot_name: "", company_name: "", tagline: "", welcome_message: "Hello! How can I help you today?", primary_color: "#556ee6", secondary_color: "#34c38f", logo_url: "" });
        setTimeout(() => setCreateModal(false), 2000);
      } else {
        setCreateAlert({ msg: data.error || "Failed to create bot", color: "danger" });
      }
    } catch {
      setCreateAlert({ msg: "Could not connect to server", color: "danger" });
    } finally {
      setCreating(false);
    }
  };

  const leadsChartOptions = {
    chart: { type: "area", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
    colors: [activeBot?.primary_color || "#008ed3"],
    xaxis: { categories: filteredLeads.map((d) => d.date), labels: { rotate: -45, style: { fontSize: "10px" } }, tickAmount: 10 },
    yaxis: { min: 0, labels: { formatter: (v) => Math.round(v) } },
    dataLabels: { enabled: false }, grid: { borderColor: "#f1f1f1" },
    tooltip: { y: { formatter: (v) => `${v} leads` } },
  };

  const convsChartOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#34c38f"],
    xaxis: { categories: filteredConvs.map((d) => d.date), labels: { rotate: -45, style: { fontSize: "10px" } }, tickAmount: 10 },
    yaxis: { min: 0, labels: { formatter: (v) => Math.round(v) } },
    dataLabels: { enabled: false }, grid: { borderColor: "#f1f1f1" },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "60%" } },
    tooltip: { y: { formatter: (v) => `${v} conversations` } },
  };

  // ── MULTI-BOT SELECTOR VIEW ───────────────────────────────────────────────
  if (!activeBotId) {
    return (
      <React.Fragment>
        <Row className="mb-3">
          <Col xl={12}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1">Welcome, {user.username}!</h4>
                <p className="text-muted mb-0">You have <strong>{botsUsed}</strong> bot{botsUsed !== 1 ? "s" : ""} — select one to view its dashboard.</p>
              </div>
              {canCreateMore && (
                <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
                  <i className="mdi mdi-plus me-1"></i>Create New Bot ({botsUsed}/{botQuota} used)
                </button>
              )}
              {!canCreateMore && (
                <a href="/my-plan" className="btn btn-outline-warning">
                  <i className="mdi mdi-crown me-1"></i>Upgrade to add more bots
                </a>
              )}
            </div>
          </Col>
        </Row>
        <Row>
          {allUserBots.map((bot) => (
            <Col xl={3} md={6} key={bot.bot_id} className="mb-4">
              <BotCard bot={bot} onSelect={(b) => setActiveBotId(b.bot_id)} />
            </Col>
          ))}
          {allUserBots.length === 0 && (
            <Col xl={12}>
              <Card><CardBody className="text-center py-5 text-muted">
                <i className="mdi mdi-robot-confused font-size-48 d-block mb-3"></i>
                <p>No bots assigned yet. Contact your administrator.</p>
              </CardBody></Card>
            </Col>
          )}
        </Row>

        {/* Create Bot Modal */}
        <Modal isOpen={createModal} toggle={() => setCreateModal(false)} size="lg">
          <ModalHeader toggle={() => setCreateModal(false)}>Create New Bot</ModalHeader>
          <ModalBody>
            {createAlert && <Alert color={createAlert.color}>{createAlert.msg}</Alert>}
            <Row>
              <Col xl={6}><div className="mb-3"><Label>Bot ID * <small className="text-muted">(lowercase, no spaces)</small></Label>
                <Input key="bot_id" value={createForm.bot_id} placeholder="e.g. mycompany_bot"
                  onChange={(e) => setForm("bot_id", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} /></div></Col>
              <Col xl={6}><div className="mb-3"><Label>Bot Name *</Label>
                <Input key="bot_name" value={createForm.bot_name} placeholder="e.g. MyCompany Assistant"
                  onChange={(e) => setForm("bot_name", e.target.value)} /></div></Col>
              <Col xl={6}><div className="mb-3"><Label>Company Name</Label>
                <Input key="company" value={createForm.company_name}
                  onChange={(e) => setForm("company_name", e.target.value)} /></div></Col>
              <Col xl={6}><div className="mb-3"><Label>Tagline</Label>
                <Input key="tagline" value={createForm.tagline}
                  onChange={(e) => setForm("tagline", e.target.value)} /></div></Col>
              <Col xl={12}><div className="mb-3"><Label>Welcome Message</Label>
                <Input type="textarea" key="welcome" value={createForm.welcome_message}
                  onChange={(e) => setForm("welcome_message", e.target.value)} /></div></Col>
              <Col xl={6}><div className="mb-3"><Label>Primary Color</Label>
                <div className="d-flex gap-2">
                  <Input type="color" value={createForm.primary_color} onChange={(e) => setForm("primary_color", e.target.value)} style={{ width: 50, height: 38 }} />
                  <Input value={createForm.primary_color} onChange={(e) => setForm("primary_color", e.target.value)} />
                </div></div></Col>
              <Col xl={6}><div className="mb-3"><Label>Logo URL</Label>
                <Input key="logo" value={createForm.logo_url} placeholder="https://..."
                  onChange={(e) => setForm("logo_url", e.target.value)} /></div></Col>
            </Row>
          </ModalBody>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateBot} disabled={creating}>
              {creating ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : "Create Bot"}
            </button>
          </div>
        </Modal>
      </React.Fragment>
    );
  }

  // ── SINGLE BOT DASHBOARD ─────────────────────────────────────────────────
  return (
    <React.Fragment>
      {/* Top bar */}
      <Row className="mb-3">
        <Col xl={12}>
          <div className="d-flex align-items-center gap-3 p-3" style={{ background: "#f4f9fd", borderRadius: 10, border: "1px solid #e0ecf8" }}>
            {hasManyBots && (
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setActiveBotId(null)}>
                <i className="mdi mdi-arrow-left me-1"></i>All Bots
              </button>
            )}
            <div style={{ width: 36, height: 36, borderRadius: 8, background: activeBot?.primary_color || "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {activeBot?.logo_url
                ? <img src={activeBot.logo_url} alt="" style={{ height: 22, filter: "brightness(0) invert(1)" }} onError={(e) => e.target.style.display = "none"} />
                : <i className="mdi mdi-robot" style={{ color: "#fff", fontSize: 16 }}></i>}
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{activeBot?.bot_name || user.bot_name}</span>
              <span style={{ color: "#6c757d", fontSize: 12, marginLeft: 8 }}>{activeBotId}</span>
            </div>
            <div className="ms-auto d-flex gap-2">
              {canCreateMore && (
                <button className="btn btn-sm btn-outline-primary" onClick={() => setCreateModal(true)}>
                  <i className="mdi mdi-plus me-1"></i>New Bot
                </button>
              )}
              <a href={chatbotUrl} target="_blank" rel="noreferrer" className="btn btn-sm"
                style={{ background: activeBot?.primary_color || "#008ed3", color: "#fff", border: "none" }}>
                <i className="mdi mdi-open-in-new me-1"></i>Preview Bot
              </a>
            </div>
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#008ed3" }} role="status" />
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <Row>
            <Col xl={3} md={6}><StatCard title="Total Leads" value={stats?.total_leads ?? "—"} sub={`Today: ${stats?.today_leads ?? 0}`} icon="mdi mdi-account-check" color="#008ed3" /></Col>
            <Col xl={3} md={6}><StatCard title="Total Conversations" value={stats?.total_conversations ?? "—"} sub={`Today: ${stats?.today_conversations ?? 0}`} icon="mdi mdi-chat-processing" color="#34c38f" /></Col>
            <Col xl={3} md={6}><StatCard title="Avg Leads / Day" value={leadsAvg} sub={`Last ${days} days`} icon="mdi mdi-trending-up" color="#f1b44c" /></Col>
            <Col xl={3} md={6}><StatCard title="Avg Conversations / Day" value={convsAvg} sub={`Last ${days} days`} icon="mdi mdi-chart-bar" color="#50a5f1" /></Col>
          </Row>

          <Row>
            <Col xl={6}>
              <Card><CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title mb-0">Leads</h4>
                  <div className="d-flex gap-2 align-items-center">
                    <span className="badge" style={{ background: "#008ed3", color: "#fff", fontSize: 11 }}>Total: {leadsTotal}</span>
                    <DaysFilter />
                  </div>
                </div>
                {filteredLeads.length > 0
                  ? <ReactApexChart options={leadsChartOptions} series={[{ name: "Leads", data: filteredLeads.map((d) => d.leads || 0) }]} type="area" height={260} />
                  : <div className="text-center text-muted py-5"><i className="mdi mdi-chart-line font-size-36 d-block mb-2"></i>No leads data yet</div>}
              </CardBody></Card>
            </Col>
            <Col xl={6}>
              <Card><CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="card-title mb-0">Conversations</h4>
                  <div className="d-flex gap-2 align-items-center">
                    <span className="badge" style={{ background: "#34c38f", color: "#fff", fontSize: 11 }}>Total: {convsTotal}</span>
                    <DaysFilter />
                  </div>
                </div>
                {filteredConvs.length > 0
                  ? <ReactApexChart options={convsChartOptions} series={[{ name: "Conversations", data: filteredConvs.map((d) => d.conversations || 0) }]} type="bar" height={260} />
                  : <div className="text-center text-muted py-5"><i className="mdi mdi-chart-bar font-size-36 d-block mb-2"></i>No data yet</div>}
              </CardBody></Card>
            </Col>
          </Row>

          <Row>
            <Col xl={12}>
              <Card><CardBody>
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
              </CardBody></Card>
            </Col>
          </Row>
        </>
      )}

      {/* Create Bot Modal (also accessible from single bot view) */}
      <Modal isOpen={createModal} toggle={() => setCreateModal(false)} size="lg">
        <ModalHeader toggle={() => setCreateModal(false)}>Create New Bot ({botsUsed}/{botQuota} used)</ModalHeader>
        <ModalBody>
          {createAlert && <Alert color={createAlert.color}>{createAlert.msg}</Alert>}
          <Row>
            <Col xl={6}><div className="mb-3"><Label>Bot ID *</Label>
              <Input key="bid" value={createForm.bot_id} placeholder="e.g. mycompany_bot"
                onChange={(e) => setForm("bot_id", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} /></div></Col>
            <Col xl={6}><div className="mb-3"><Label>Bot Name *</Label>
              <Input key="bname" value={createForm.bot_name} onChange={(e) => setForm("bot_name", e.target.value)} /></div></Col>
            <Col xl={6}><div className="mb-3"><Label>Company Name</Label>
              <Input key="bco" value={createForm.company_name} onChange={(e) => setForm("company_name", e.target.value)} /></div></Col>
            <Col xl={6}><div className="mb-3"><Label>Primary Color</Label>
              <div className="d-flex gap-2">
                <Input type="color" value={createForm.primary_color} onChange={(e) => setForm("primary_color", e.target.value)} style={{ width: 50, height: 38 }} />
                <Input value={createForm.primary_color} onChange={(e) => setForm("primary_color", e.target.value)} />
              </div></div></Col>
            <Col xl={12}><div className="mb-3"><Label>Welcome Message</Label>
              <Input type="textarea" value={createForm.welcome_message} onChange={(e) => setForm("welcome_message", e.target.value)} /></div></Col>
          </Row>
        </ModalBody>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreateBot} disabled={creating}>
            {creating ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : "Create Bot"}
          </button>
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(Dashboard);