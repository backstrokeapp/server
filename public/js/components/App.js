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
        <NavItem eventKey={3} href="#/settings">Settings</NavItem>
      </Nav>
      <UserNav user={user} />
    </Navbar.Collapse>
  </Navbar>;
}

export function Index() {
  return <div className="index-page">
    <div className="container">
      <h1>
        Backstroke<br/>
        is a Github bot<br/>
        that syncs upstream changes<br/>
        downstream to forks.
      </h1>
      <h2>(No more "This branch is 588 commits behind upstream:master.")</h2>

      <div className="row">
        <div className="button-section">
          <a href="/setup/login" className="btn btn-success btn-block btn-cta">Sign in with Github</a>
        </div>
        <div className="button-section">
          <a
            href="https://github.com/1egoman/backstroke#readme"
            className="btn btn-default btn-block btn-outline btn-outline-primary btn-cta"
          >
            Read the README
          </a>
        </div>
      </div>
    </div>
  </div>;
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
      <a href="/setup/login" className="btn btn-primary btn-outline">Login with Github</a>
    </Navbar.Form>;
  }
}

export default connect((state, props) => {
  return {user: state.user, children: props.children};
}, dispatch => new Object)(App)
