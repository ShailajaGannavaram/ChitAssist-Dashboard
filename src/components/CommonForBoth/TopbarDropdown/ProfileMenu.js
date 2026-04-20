import React, { useState } from "react"
import PropTypes from 'prop-types'
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap"
import { withTranslation } from "react-i18next"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import withRouter from "components/Common/withRouter"

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const ProfileMenu = props => {
  const [menu, setMenu] = useState(false)
  const user = getAuthUser()

  return (
    <React.Fragment>
      <Dropdown isOpen={menu} toggle={() => setMenu(!menu)} className="d-inline-block">
        <DropdownToggle className="btn header-item waves-effect" tag="button"
          style={{ color: "#ccd6e0", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14 }}>
            {(user.email || "U")[0].toUpperCase()}
          </div>
          <div className="d-none d-xl-flex flex-column align-items-start">
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{user.username || user.email?.split("@")[0] || "User"}</span>
            <span style={{ fontSize: 11, color: "#008ed3", lineHeight: 1.2 }}>{user.is_superuser ? "Superadmin" : "Client"}</span>
          </div>
          <i className="mdi mdi-chevron-down ms-1" style={{ fontSize: 16, color: "#8899aa" }}></i>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end" style={{ minWidth: 200, border: "1px solid #e9ecef" }}>
          <div className="px-3 py-2 border-bottom">
            <p className="mb-0 fw-semibold" style={{ fontSize: 13 }}>{user.email}</p>
            <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{user.bot_name || "Admin"}</p>
          </div>
          <div className="dropdown-divider" />
          <Link to="/logout" className="dropdown-item text-danger">
            <i className="mdi mdi-power font-size-17 align-middle me-1 text-danger" />
            <span>Logout</span>
          </Link>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  )
}

ProfileMenu.propTypes = { success: PropTypes.any, t: PropTypes.any }
const mapStatetoProps = state => { const { error, success } = state.Profile; return { error, success } }
export default withRouter(connect(mapStatetoProps, {})(withTranslation()(ProfileMenu)))