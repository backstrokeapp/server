import React from 'react'
import RouteMethod from './route';
import {Link} from 'react-router';

import {Navbar, Nav, NavItem} from 'react-bootstrap';

export default function App({children}) {
  return <div className="app-container">
    <MainNav />
    <div className="container">{children}</div>
  </div>
}

export function MainNav() {
  return <Navbar>
    <Navbar.Header>
      <Navbar.Brand>Backstroke</Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <NavItem eventKey={2}>
          <Link to="/repos">Repositories</Link>
        </NavItem>
        <NavItem eventKey={1} href="//github.com/1egoman/backstroke">Github</NavItem>
      </Nav>
    </Navbar.Collapse>
  </Navbar>;
}

export default App;
