import PropTypes from 'prop-types'
import React from "react"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu"
import { showRightSidebarAction, toggleLeftmenu, changeSidebarType } from "../../store/actions"
import { withTranslation } from "react-i18next"

const Header = props => {
  function tToggle() {
    var body = document.body;
    body.classList.toggle("vertical-collpsed");
    body.classList.toggle("sidebar-enable");
  }

  return (
    <React.Fragment>
      <header id="page-topbar" style={{ background: "#0a0e1a", borderBottom: "1px solid #1a2035" }}>
        <div className="navbar-header">
          <div className="d-flex align-items-center">
            <div className="navbar-brand-box" style={{ background: "#0a0e1a" }}>
              <Link to="/" className="logo">
                <span className="logo-lg d-flex align-items-center gap-2">
                  <img src="https://antsdigital.in/assets/images/antslogo.png" alt="Ants Digital" height="32"
                    onError={(e) => { e.target.style.display = "none"; }} />
                </span>
                <span className="logo-sm d-flex align-items-center justify-content-center">
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#008ed3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14 }}>A</div>
                </span>
              </Link>
            </div>
            <button type="button" onClick={tToggle}
              className="btn btn-sm px-3 font-size-24 header-item waves-effect vertical-menu-btn"
              style={{ color: "#8899aa" }}>
              <i className="mdi mdi-menu"></i>
            </button>
            <div className="d-none d-sm-flex align-items-center ms-2">
              <span style={{ color: "#008ed3", fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>ChitAssist</span>
              <span style={{ color: "#445566", fontSize: 13, marginLeft: 6 }}>Dashboard</span>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <ProfileMenu />
          </div>
        </div>
      </header>
    </React.Fragment>
  )
}

Header.propTypes = {
  changeSidebarType: PropTypes.func,
  leftMenu: PropTypes.any,
  leftSideBarType: PropTypes.any,
  showRightSidebar: PropTypes.any,
  showRightSidebarAction: PropTypes.func,
  t: PropTypes.any,
  toggleLeftmenu: PropTypes.func,
}

const mapStatetoProps = state => {
  const { layoutType, showRightSidebar, leftMenu, leftSideBarType } = state.Layout
  return { layoutType, showRightSidebar, leftMenu, leftSideBarType }
}

export default connect(mapStatetoProps, {
  showRightSidebarAction, toggleLeftmenu, changeSidebarType,
})(withTranslation()(Header))