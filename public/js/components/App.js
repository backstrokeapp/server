import React from 'react'
import {connect} from 'react-redux';
import RouteMethod from './route';
import {Link} from 'react-router';

import {Navbar, Nav, NavItem} from 'react-bootstrap';

export function App({user, children}) {
  return <div className="app-container-parent">
    <MainNav user={user} />
    <div className="app-container">{children}</div>
  </div>
}

export function MainNav({user}) {
  return <Navbar>
    <Navbar.Header>
      <img className="navbar-mark" src="/assets/img/logo.svg" alt="Backstroke" />
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <NavItem eventKey={2} href="#/links">Links</NavItem>
      </Nav>
      <Nav pullRight>
        <NavItem eventKey={1} href="//github.com/1egoman/backstroke">
          Code on Github
        </NavItem>
        <UserNav user={user} />
      </Nav>
    </Navbar.Collapse>
  </Navbar>;
}

function UserNav({user}) {
  // Login status
  if (user && user._auth) {
    return <NavItem eventKey={2} href="/logout" className="user-nav">
      <img src={user.picture} />
      Logout {user.user}
    </NavItem>;
  } else {
    return <NavItem eventKey={2} href="/setup/login">
      Login
    </NavItem>;
  }
}

export default connect((state, props) => {
  return {user: state.user, children: props.children};
}, dispatch => new Object)(App)
