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
      <Link to="/">
        <img className="navbar-mark" src="/assets/img/logo.svg" alt="Backstroke" />
      </Link>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <NavItem eventKey={2} href="#/links">Links</NavItem>
      </Nav>
      <UserNav user={user} />
      <Nav pullRight>
        <NavItem eventKey={1} href="//github.com/1egoman/backstroke">
          Code on Github
        </NavItem>
      </Nav>
    </Navbar.Collapse>
  </Navbar>;
}

function UserNav({user}) {
  // Login status
  if (user && user._auth) {
    return <Nav pullRight>
      <NavItem eventKey={2} href="/logout" className="user-nav">
        <img src={user.picture} />
        Logout {user.user}
      </NavItem>
    </Nav>;
  } else {
    return <Navbar.Form pullRight>
      <a href="/setup/login" className="btn btn-primary">Login with Github</a>
    </Navbar.Form>;
  }
}

export default connect((state, props) => {
  return {user: state.user, children: props.children};
}, dispatch => new Object)(App)
