import React, { useEffect, useState, useCallback } from "react";
import { connect } from "react-redux";
import { Row, Col, Card, CardBody, Badge, Input, Label, Alert, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";
import { getAdminUsers, createUser, getAdminAllBots } from "../../helpers/fakebackend_helper";

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";
const getToken = () => { try { return JSON.parse(localStorage.getItem("authUser") || "{}").access || ""; } catch { return ""; } };
const patchUser = (id, data) => fetch(`${API_URL}/api/admin/users/${id}/`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(data) }).then((r) => r.json());
const removeUser = (id) => fetch(`${API_URL}/api/admin/users/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } }).then((r) => r.ok ? { success: true } : r.json());

const EMPTY_FORM = { email: "", username: "", password: "", bot_id: "", is_superuser: false };

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
  const [editForm, setEditForm] = useState({ password: "", bot_id: "", is_active: true });
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

  const showAlert = (msg, color = "success") => { setAlert({ msg, color }); setTimeout(() => setAlert(null), 3000); };

  const setF = useCallback((field, value) => setForm((f) => ({ ...f, [field]: value })), []);
  const setE = useCallback((field, value) => setEditForm((f) => ({ ...f, [field]: value })), []);

  const handleCreate = () => {
    if (!form.email || !form.password) return showAlert("Email and password required", "danger");
    createUser(form).then((r) => {
      if (r.success) { showAlert("User created!"); setCreateModal(false); setForm(EMPTY_FORM); load(); }
      else showAlert(r.error || "Failed", "danger");
    }).catch(() => showAlert("Failed", "danger"));
  };

  const openEdit = (user) => { setSelectedUser(user); setEditForm({ password: "", bot_id: user.bot?.bot_id || "", is_active: user.is_active }); setEditModal(true); };

  const handleEdit = () => {
    const data = { is_active: editForm.is_active, bot_id: editForm.bot_id };
    if (editForm.password) data.password = editForm.password;
    patchUser(selectedUser.id, data).then((r) => {
      if (r.success) { showAlert("User updated!"); setEditModal(false); load(); }
      else showAlert(r.error || "Failed", "danger");
    }).catch(() => showAlert("Failed", "danger"));
  };

  const handleDelete = (user) => {
    if (!window.confirm(`Delete user ${user.email}?`)) return;
    removeUser(user.id).then((r) => { if (r.success) { showAlert("User deleted"); load(); } else showAlert(r.error || "Failed", "danger"); }).catch(() => showAlert("Failed", "danger"));
  };

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  return (
    <React.Fragment>
      {alert && <Alert color={alert.color} style={{ position: "fixed", top: 80, right: 20, zIndex: 9999 }}>{alert.msg}</Alert>}
      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div><h4 className="card-title mb-1">User Management</h4><p className="text-muted mb-0">Total: <strong>{users.length}</strong> users</p></div>
                <div className="d-flex gap-2">
                  <Input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
                  <button className="btn btn-primary" onClick={() => setCreateModal(true)}><i className="mdi mdi-account-plus me-1"></i>Add User</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-centered table-hover table-nowrap mb-0">
                  <thead className="table-light"><tr><th>#</th><th>Email</th><th>Username</th><th>Role</th><th>Assigned Bot</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.length === 0 ? <tr><td colSpan={8} className="text-center text-muted py-4">No users found</td></tr>
                      : filtered.map((u, i) => (
                        <tr key={u.id}>
                          <td>{i + 1}</td><td>{u.email}</td><td>{u.username}</td>
                          <td>{u.is_superuser ? <Badge color="danger">Superadmin</Badge> : <Badge color="info">Client</Badge>}</td>
                          <td>{u.bot ? <Badge color="primary">{u.bot.bot_name}</Badge> : <span className="text-muted">—</span>}</td>
                          <td><Badge color={u.is_active ? "success" : "secondary"}>{u.is_active ? "Active" : "Inactive"}</Badge></td>
                          <td style={{ fontSize: 12 }}>{new Date(u.date_joined).toLocaleDateString("en-IN")}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(u)}><i className="mdi mdi-pencil"></i></button>
                              {!u.is_superuser && <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u)}><i className="mdi mdi-delete"></i></button>}
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

      <Modal isOpen={createModal} toggle={() => setCreateModal(false)}>
        <ModalHeader toggle={() => setCreateModal(false)}>Add New User</ModalHeader>
        <ModalBody>
          <div className="mb-3"><Label>Email *</Label><Input key="create-email" value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="user@example.com" /></div>
          <div className="mb-3"><Label>Username</Label><Input key="create-username" value={form.username} onChange={(e) => setF("username", e.target.value)} placeholder="Auto-generated if blank" /></div>
          <div className="mb-3"><Label>Password *</Label><Input key="create-password" type="password" value={form.password} onChange={(e) => setF("password", e.target.value)} /></div>
          <div className="mb-3">
            <Label>Assign to Bot</Label>
            <Input type="select" value={form.bot_id} onChange={(e) => setF("bot_id", e.target.value)} disabled={form.is_superuser}>
              <option value="">— Select Bot —</option>
              {bots.map((b) => <option key={b.bot_id} value={b.bot_id}>{b.bot_name}</option>)}
            </Input>
          </div>
          <div className="d-flex align-items-center gap-2 p-3" style={{ background: "#f8f9fa", borderRadius: 8 }}>
            <input type="checkbox" checked={form.is_superuser} onChange={(e) => setF("is_superuser", e.target.checked)} />
            <span>Make Superadmin (can access all bots)</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create User</button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={editModal} toggle={() => setEditModal(false)}>
        <ModalHeader toggle={() => setEditModal(false)}>Edit User — {selectedUser?.email}</ModalHeader>
        <ModalBody>
          <div className="mb-3"><Label>New Password</Label><Input key="edit-password" type="password" value={editForm.password} onChange={(e) => setE("password", e.target.value)} placeholder="Leave blank to keep current" /></div>
          {!selectedUser?.is_superuser && (
            <div className="mb-3">
              <Label>Assigned Bot</Label>
              <Input type="select" value={editForm.bot_id} onChange={(e) => setE("bot_id", e.target.value)}>
                <option value="">— No Bot —</option>
                {bots.map((b) => <option key={b.bot_id} value={b.bot_id}>{b.bot_name}</option>)}
              </Input>
            </div>
          )}
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