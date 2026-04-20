import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef } from "react"
import SimpleBar from "simplebar-react"
import MetisMenu from "metismenujs"
import withRouter from "components/Common/withRouter"
import { Link } from "react-router-dom"
import { withTranslation } from "react-i18next"

const getAuthUser = () => {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; }
};

const SidebarContent = props => {
  const ref = useRef()
  const user = getAuthUser()
  const isSuperuser = user.is_superuser === true

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active")
    const parent = item.parentElement
    const parent2El = parent.childNodes[1]
    if (parent2El && parent2El.id !== "side-menu") parent2El.classList.add("mm-show")
    if (parent) {
      parent.classList.add("mm-active")
      const parent2 = parent.parentElement
      if (parent2) {
        parent2.classList.add("mm-show")
        const parent3 = parent2.parentElement
        if (parent3) {
          parent3.classList.add("mm-active")
          parent3.childNodes[0].classList.add("mm-active")
          const parent4 = parent3.parentElement
          if (parent4) {
            parent4.classList.add("mm-show")
            const parent5 = parent4.parentElement
            if (parent5) { parent5.classList.add("mm-show"); parent5.childNodes[0].classList.add("mm-active") }
          }
        }
      }
      scrollElement(item); return false
    }
    scrollElement(item); return false
  }, [])

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i]; const parent = items[i].parentElement
      if (item && item.classList.contains("active")) item.classList.remove("active")
      if (parent) {
        const parent2El = parent.childNodes && parent.childNodes.lenght && parent.childNodes[1] ? parent.childNodes[1] : null
        if (parent2El && parent2El.id !== "side-menu") parent2El.classList.remove("mm-show")
        parent.classList.remove("mm-active")
        const parent2 = parent.parentElement
        if (parent2) {
          parent2.classList.remove("mm-show")
          const parent3 = parent2.parentElement
          if (parent3) {
            parent3.classList.remove("mm-active"); parent3.childNodes[0].classList.remove("mm-active")
            const parent4 = parent3.parentElement
            if (parent4) {
              parent4.classList.remove("mm-show")
              const parent5 = parent4.parentElement
              if (parent5) { parent5.classList.remove("mm-show"); parent5.childNodes[0].classList.remove("mm-active") }
            }
          }
        }
      }
    }
  }

  const activeMenu = useCallback(() => {
    const pathName = process.env.PUBLIC_URL + props.router.location.pathname
    let matchingMenuItem = null
    const ul = document.getElementById("side-menu")
    const items = ul.getElementsByTagName("a")
    removeActivation(items)
    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) { matchingMenuItem = items[i]; break }
    }
    if (matchingMenuItem) activateParentDropdown(matchingMenuItem)
  }, [props.router.location.pathname, activateParentDropdown])

  useEffect(() => { ref.current.recalculate() }, [])
  useEffect(() => { new MetisMenu("#side-menu") }, [])
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); activeMenu() }, [activeMenu])

  function scrollElement(item) {
    if (item) { const cur = item.offsetTop; if (cur > window.innerHeight) ref.current.getScrollElement().scrollTop = cur - 300 }
  }

  return (
    <React.Fragment>
      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            {isSuperuser ? (
              <>
                <li className="menu-title">Admin Panel</li>
                <li><Link to="/admin-bots" className="waves-effect"><i className="mdi mdi-view-grid-outline"></i><span>All Bots</span></Link></li>
                <li><Link to="/create-bot" className="waves-effect"><i className="mdi mdi-robot-outline"></i><span>Create Bot</span></Link></li>
                <li><Link to="/users" className="waves-effect"><i className="mdi mdi-account-group"></i><span>User Management</span></Link></li>
              </>
            ) : (
              <>
                <li className="menu-title">Main</li>
                <li><Link to="/dashboard" className="waves-effect"><i className="mdi mdi-view-dashboard"></i><span>Dashboard</span></Link></li>
                <li className="menu-title">Bot Data</li>
                <li><Link to="/leads" className="waves-effect"><i className="mdi mdi-account-check"></i><span>Leads</span></Link></li>
                <li><Link to="/conversations" className="waves-effect"><i className="mdi mdi-chat-processing-outline"></i><span>Conversations</span></Link></li>
                <li className="menu-title">Settings</li>
                <li><Link to="/bot-config" className="waves-effect"><i className="mdi mdi-cog-outline"></i><span>Bot Configuration</span></Link></li>
              </>
            )}
            <li className="menu-title">Account</li>
            <li><Link to="/logout" className="waves-effect"><i className="mdi mdi-logout"></i><span>Logout</span></Link></li>
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  )
}

SidebarContent.propTypes = { location: PropTypes.object, t: PropTypes.any }
export default withRouter(withTranslation()(SidebarContent))