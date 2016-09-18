import React from 'react'
import {connect} from 'react-redux';
import RouteMethod from './route';
import {Link} from 'react-router';

import {Navbar, Nav, NavItem} from 'react-bootstrap';

export function App({user, children}) {
  return <div className="app-container-parent">
    <MainNav user={user} transparent={children.type.transparentNavBar} />
    <div className="app-container">{children}</div>
  </div>
}

export function MainNav({user, transparent}) {
  return <Navbar className={transparent ? "navbar-inverse" : null}>
    <Navbar.Header>
      <Link to="/">
        {
          transparent ?
          <img className="navbar-mark" src="/assets/img/inverse.png" alt="Backstroke" />:
          <img className="navbar-mark" src="/assets/img/logo.png" alt="Backstroke" />
        }
      </Link>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <NavItem eventKey={2} href="#/links">Links</NavItem>
        <NavItem eventKey={3} href="#/settings">Settings</NavItem>
      </Nav>
      <UserNav user={user} transparent={transparent} />
    </Navbar.Collapse>
  </Navbar>;
}

export function Index() {
  return <div className="index-page">
    <div className="container">
      <h1>A pipeline for changes</h1>
      <p>
        With Backstroke, always keep your repository's forks up to date.<br/>
        <span>Open source maintainers</span> can merge contributor's code with one click.<br/>
        <span>Contributors</span> don't have to worry about hefty merge conflicts.
      </p>

      <div className="row">
        <div className="button-section">
          <a href="/setup/login" className="btn btn-success btn-block btn-cta">Sign in with Github</a>
        </div>
        <div className="button-section">
          <a
            href="https://github.com/1egoman/backstroke#readme"
            className="btn btn-default btn-block btn-outline btn-outline-primary btn-cta"
          >
            To the README
          </a>
        </div>
      </div>
    </div>
  </div>;
}
Index.transparentNavBar = true;

function UserNav({user, transparent}) {
  // Login status
  if (user && user._auth) {
    return <Nav pullRight>
      <NavItem eventKey={2} href="/logout" className="user-nav">
        <img src={user.picture} />
        Logout {user.user}
      </NavItem>
    </Nav>;
  } else if (!transparent) {
    return <Navbar.Form pullRight>
      <a href="/setup/login" className="btn btn-primary btn-outline">Login with Github</a>
    </Navbar.Form>;
  } else {
    return null;
  }
}

export default connect((state, props) => {
  return {user: state.user, children: props.children};
}, dispatch => new Object)(App)
