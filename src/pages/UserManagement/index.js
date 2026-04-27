import React, { useEffect, useState, useCallback } from "react";
import { connect } from "react-redux";
import { Row, Col, Card, CardBody, Badge, Input, Label, Alert, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";
import { getAdminUsers, createUser, getAdminAllBots } from "../../helpers/fakebackend_helper";

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";
const getToken = () => { try { return JSON.parse(localStorage.getItem("authUser") || "{}").access || ""; } catch { return ""; } };

const patchUser = (id, data) =>
  fetch(`${API_URL}/api/admin/users/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  }).then((r) => r.json());

const removeUser = (id) =>
  fetch(`${API_URL}/api/admin/users/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then((r) => r.ok ? { success: true } : r.json());

const PLANS = ["Basic", "Pro", "Enterprise", "Custom"];
const EMPTY_FORM = { email: "", username: "", password: "", bot_ids: [], is_superuser: false, plan_name: "Basic", bot_quota: 1 };

const UserManagement = ({ setBreadcrumbItems }) => {
  const [users, setUsers] = useState([]);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ password: "", bot_ids: [], is_active: true, plan_name: "Basic", bot_quota: 1, notes: "" });
  document.title = "User Management | ChitAssist Admin";

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getAdminUsers(), getAdminAllBots()])
      .then(([u, b]) => { setUsers(Array.isArray(u) ? u : []); setBots(b.bots || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setBreadcrumbItems("User Management", [{ title: "Admin", link: "#" }, { title: "Users", link: "#" }]);
    load();
  }, []); // eslint-disable-line

  const showAlert = (msg, color = "success") => { setAlert({ msg, color }); setTimeout(() => setAlert(null), 4000); };
  const setF = useCallback((field, value) => setForm((f) => ({ ...f, [field]: value })), []);
  const setE = useCallback((field, value) => setEditForm((f) => ({ ...f, [field]: value })), []);

  const toggleBotSelect = (botId, isEdit = false) => {
    const setter = isEdit ? setE : setF;
    const current = isEdit ? editForm.bot_ids : form.bot_ids;
    if (current.includes(botId)) setter("bot_ids", current.filter((b) => b !== botId));
    else setter("bot_ids", [...current, botId]);
  };

  const handleCreate = () => {
    if (!form.email || !form.password) return showAlert("Email and password required", "danger");
    createUser(form).then((r) => {
      if (r.success) { showAlert("User created! Welcome email sent."); setCreateModal(false); setForm(EMPTY_FORM); load(); }
      else showAlert(r.error || "Failed", "danger");
    }).catch(() => showAlert("Failed", "danger"));
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      password: "",
      bot_ids: user.bots?.map((b) => b.bot_id) || [],
      is_active: user.is_active,
      plan_name: user.plan_name || "Basic",
      bot_quota: user.bot_quota || 1,
      notes: user.notes || "",
    });
    setEditModal(true);
  };

  const handleEdit = () => {
    patchUser(selectedUser.id, editForm).then((r) => {
      if (r.success) { showAlert("User updated!"); setEditModal(false); load(); }
      else showAlert(r.error || "Failed", "danger");
    }).catch(() => showAlert("Failed", "danger"));
  };

  const handleDelete = (user) => {
    if (!window.confirm(`Delete user ${user.email}?`)) return;
    removeUser(user.id).then((r) => {
      if (r.success) { showAlert("User deleted"); load(); }
      else showAlert(r.error || "Failed", "danger");
    }).catch(() => showAlert("Failed", "danger"));
  };

  const PLAN_COLORS = { Basic: "secondary", Pro: "primary", Enterprise: "danger", Custom: "warning" };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  const BotSelector = ({ selectedIds, onToggle, quota }) => (
    <div>
      <div className="d-flex flex-wrap gap-2 mt-1">
        {bots.map((b) => {
          const selected = selectedIds.includes(b.bot_id);
          const atQuota = selectedIds.length >= quota && !selected;
          return (
            <div key={b.bot_id} onClick={() => !atQuota && onToggle(b.bot_id)}
              style={{
                padding: "6px 12px", borderRadius: 8, cursor: atQuota ? "not-allowed" : "pointer",
                border: `2px solid ${selected ? b.primary_color || "#008ed3" : "#dee2e6"}`,
                background: selected ? `${b.primary_color}15` : "#fff",
                opacity: atQuota ? 0.4 : 1, fontSize: 13,
              }}>
              <i className="mdi mdi-robot-outline me-1"></i>{b.bot_name}
              {selected && <i className="mdi mdi-check ms-1 text-success"></i>}
            </div>
          );
        })}
      </div>
      <small className="text-muted mt-1 d-block">{selectedIds.length}/{quota} bots selected</small>
    </div>
  );

  return (
    <React.Fragment>
      {alert && <Alert color={alert.color} style={{ position: "fixed", top: 80, right: 20, zIndex: 9999 }}>{alert.msg}</Alert>}

      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="card-title mb-1">User Management</h4>
                  <p className="text-muted mb-0">Total: <strong>{users.length}</strong> users</p>
                </div>
                <div className="d-flex gap-2">
                  <Input type="text" placeholder="Search users..." value={search}
                    onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
                  <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
                    <i className="mdi mdi-account-plus me-1"></i>Add User
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-centered table-hover table-nowrap mb-0">
                  <thead className="table-light">
                    <tr><th>#</th><th>Email</th><th>Role</th><th>Plan</th><th>Quota</th><th>Assigned Bots</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan={8} className="text-center text-muted py-4">No users found</td></tr>
                      : filtered.map((u, i) => (
                        <tr key={u.id}>
                          <td>{i + 1}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{u.email}</div>
                            <small className="text-muted">{u.username}</small>
                          </td>
                          <td>{u.is_superuser ? <Badge color="danger">Superadmin</Badge> : <Badge color="info">Client</Badge>}</td>
                          <td><Badge color={PLAN_COLORS[u.plan_name] || "secondary"}>{u.plan_name || "Basic"}</Badge></td>
                          <td>
                            {!u.is_superuser && (
                              <span style={{ fontSize: 13 }}>
                                <strong>{u.bots?.length || 0}</strong>/{u.bot_quota || 1}
                              </span>
                            )}
                          </td>
                          <td>
                            {u.bots?.length > 0
                              ? u.bots.map((b) => <Badge key={b.bot_id} color="primary" className="me-1">{b.bot_name}</Badge>)
                              : <span className="text-muted">—</span>}
                          </td>
                          <td><Badge color={u.is_active ? "success" : "secondary"}>{u.is_active ? "Active" : "Inactive"}</Badge></td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(u)}>
                                <i className="mdi mdi-pencil"></i>
                              </button>
                              {!u.is_superuser && (
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u)}>
                                  <i className="mdi mdi-delete"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Create User Modal */}
      <Modal isOpen={createModal} toggle={() => setCreateModal(false)} size="lg">
        <ModalHeader toggle={() => setCreateModal(false)}>Add New User</ModalHeader>
        <ModalBody>
          <Row>
            <Col xl={6}><div className="mb-3"><Label>Email *</Label><Input key="c-email" value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="user@example.com" /></div></Col>
            <Col xl={6}><div className="mb-3"><Label>Username</Label><Input key="c-user" value={form.username} onChange={(e) => setF("username", e.target.value)} placeholder="Auto-generated if blank" /></div></Col>
            <Col xl={6}><div className="mb-3"><Label>Password *</Label><Input key="c-pass" type="password" value={form.password} onChange={(e) => setF("password", e.target.value)} /></div></Col>
            <Col xl={3}>
              <div className="mb-3">
                <Label>Plan</Label>
                <Input type="select" value={form.plan_name} onChange={(e) => setF("plan_name", e.target.value)}>
                  {PLANS.map((p) => <option key={p}>{p}</option>)}
                </Input>
              </div>
            </Col>
            <Col xl={3}>
              <div className="mb-3">
                <Label>Bot Quota</Label>
                <Input type="number" min={1} max={20} value={form.bot_quota}
                  onChange={(e) => setF("bot_quota", parseInt(e.target.value) || 1)} />
              </div>
            </Col>
          </Row>

          {!form.is_superuser && (
            <div className="mb-3">
              <Label>Assign Bots (max {form.bot_quota})</Label>
              <BotSelector selectedIds={form.bot_ids} onToggle={(id) => toggleBotSelect(id, false)} quota={form.bot_quota} />
            </div>
          )}

          <div className="d-flex align-items-center gap-2 p-3" style={{ background: "#f8f9fa", borderRadius: 8 }}>
            <input type="checkbox" checked={form.is_superuser} onChange={(e) => setF("is_superuser", e.target.checked)} />
            <span>Make Superadmin (can access all bots)</span>
          </div>
          <small className="text-muted d-block mt-2"><i className="mdi mdi-email-outline me-1"></i>A welcome email with credentials will be sent automatically.</small>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create User</button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={editModal} toggle={() => setEditModal(false)} size="lg">
        <ModalHeader toggle={() => setEditModal(false)}>Edit User — {selectedUser?.email}</ModalHeader>
        <ModalBody>
          <Row>
            <Col xl={6}><div className="mb-3"><Label>New Password</Label><Input key="e-pass" type="password" value={editForm.password} onChange={(e) => setE("password", e.target.value)} placeholder="Leave blank to keep current" /></div></Col>
            <Col xl={3}>
              <div className="mb-3">
                <Label>Plan</Label>
                <Input type="select" value={editForm.plan_name} onChange={(e) => setE("plan_name", e.target.value)}>
                  {PLANS.map((p) => <option key={p}>{p}</option>)}
                </Input>
              </div>
            </Col>
            <Col xl={3}>
              <div className="mb-3">
                <Label>Bot Quota</Label>
                <Input type="number" min={1} max={20} value={editForm.bot_quota}
                  onChange={(e) => setE("bot_quota", parseInt(e.target.value) || 1)} />
              </div>
            </Col>
          </Row>

          {!selectedUser?.is_superuser && (
            <div className="mb-3">
              <Label>Assigned Bots (max {editForm.bot_quota})</Label>
              <BotSelector selectedIds={editForm.bot_ids} onToggle={(id) => toggleBotSelect(id, true)} quota={editForm.bot_quota} />
            </div>
          )}

          <div className="mb-3">
            <Label>Notes</Label>
            <Input type="textarea" value={editForm.notes} onChange={(e) => setE("notes", e.target.value)} placeholder="Internal notes about this user..." rows={2} />
          </div>

          <div className="d-flex align-items-center gap-2 p-3" style={{ background: "#f8f9fa", borderRadius: 8 }}>
            <input type="checkbox" checked={editForm.is_active} onChange={(e) => setE("is_active", e.target.checked)} />
            <span>User is Active</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleEdit}>Save Changes</button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default connect(null, { setBreadcrumbItems })(UserManagement);