import React from 'react'
import {connect} from 'react-redux';
import RouteMethod from './route';
import {Link} from 'react-router';
import GitHubButton from 'react-github-button';
import {Tooltip, OverlayTrigger} from 'react-bootstrap';

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
        <NavItem eventKey={2} href="#/pricing">Pricing</NavItem>
        {user && user._auth ? <NavItem eventKey={2} href="#/links">Links</NavItem> : null}
        {user && user._auth ? <NavItem eventKey={3} href="#/settings">Settings</NavItem> : null}
      </Nav>
      <UserNav user={user} transparent={transparent} />
    </Navbar.Collapse>
  </Navbar>;
}

export function Index() {
  return <div>
    <div className="index-page">
      <div className="container">
        <h1>A pipeline for changes</h1>
        <p>
          With Backstroke, always keep your repository's forks up to date.<br/>
          <span>Open source maintainers</span> can merge contributor's code with one click.<br/>
          <span>Contributors</span> don't have to worry about hefty merge conflicts.
        </p>
        {/* <GitHubButton type="stargazers" size="large" namespace="1egoman" repo="backstroke" /> */}

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
    </div>
    <div className="used-by">
      <div className="used-by-list">
        <span>Used by</span>
        <img src="/assets/img/github.png" alt="Github" />
        <img src="/assets/img/conda.svg" alt="Conda" />
        <img src="/assets/img/cachet.png" alt="Cachet" />
        <img src="/assets/img/logo.png" alt="Backstroke" />
      </div>
    </div>
    <div className="content">
      <div className="container">
        <div className="col-md-6 col-xs-12">
          <h2>Incorporate new changes as they happen, not in 6 months.</h2>
          <p>
            In no time, that newly forked copy of a popular project will become out of date.
            Backstroke takes away the chore of manually updating your forks and provides
            a <strong>simple</strong>, <strong>hosted bot</strong> that will propose any upstream
            updates to your fork.
          </p>
        </div>
        <div className="col-md-6 col-xs-12 img-pr">
          <img src="/assets/img/backstroke-pr.png" alt="A Backstroke pull request" />
        </div>
      </div>
      <div className="container">
        <div className="col-md-6 col-xs-12">
          <h2>How does Backstroke work?</h2>
          <p>
            Backstroke watches a Github repository via a webhook. When the repo is updated,
            Backstroke sends a pull request to all of that repository's forks.&nbsp;
            <a href="https://github.com/1egoman/backstroke#how-it-works">Read more.</a>
          </p>
        </div>
        <div className="col-md-6 col-xs-12">
        </div>
      </div>
      <div className="container">
        <div className="col-md-6 col-xs-12">
          <h2>Open source is 1000% free.</h2>
          <p>
            Backstroke is free for public Github repositories. If you want to use Backstroke with
            private repositories, there's a nominal charge of $1 per month.&nbsp;
            <a href="#/pricing">Read more about pricing.</a>
          </p>
        </div>
        <div className="col-md-6 col-xs-12">
        </div>
      </div>
      <div className="container cta">
        <h1>Give Backstroke a try for free.</h1>
        <a className="btn btn-info btn-lg btn-cta-end" href="/setup/login">Sign in with Github</a>
      </div>
      <Footer />
    </div>
  </div>;
}
Index.transparentNavBar = true;

export function Pricing() {
  return <div className="pricing-page">
    <div className="container">
      <h1>Pricing</h1>

      <div className="row">
        <div className="col-md-6">
          <div className="panel panel-default">
            <div className="panel-heading">
              Free
              <span className="pull-right">Use for free</span>
            </div>
            <ul className="list-group">
              <li className="list-group-item">Sync changes from upstream to forks</li>
              <li className="list-group-item">Sync changes between two repositories</li>
              <li className="list-group-item">Sync between arbitrary branches of each repository</li>
              <li className="list-group-item">Changes are proposed as pull requests</li>
            </ul>
            <div className="panel-footer">
              <h3 style={{color: "#333", textAlign: "center", marginBottom: 20}}>Use for free</h3>
              <a href="/setup/login" className="btn btn-default btn-block btn-lg">Sign up</a>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="panel panel-success">
            <div className="panel-heading">
              Premium
              <span className="pull-right">$1.00 per premium link per month</span>
            </div>
            <ul className="list-group">
              <li className="list-group-item">Sync changes from upstream to forks</li>
              <li className="list-group-item">Sync changes between two repositories</li>
              <li className="list-group-item">Sync between arbitrary branches of each repository</li>
              <li className="list-group-item">Changes are proposed as pull requests</li>
              <li className="list-group-item">
                <span className="label label-success">Premium</span>
                Sync changes to private repositories on Github
              </li>
              <li className="list-group-item">
                <span className="label label-success">Premium</span>
                Premium support
              </li>
              <li className="list-group-item">
                <span className="label label-success">Premium</span>
                Less than the price of a lunch per year
              </li>
            </ul>
            <div className="panel-footer">
              <OverlayTrigger placement="top" overlay={
                <Tooltip id="prorated">
                  You only pay for the time that your premium link is enabled.
                  For example, if you have a premium link enabled for half of a month,
                  you'll pay 50 cents instead of $1.00.
                </Tooltip>
              }>
                <h3 style={{color: "#333", textAlign: "center", marginBottom: 20}}>
                  $1.00 per premium link per month&nbsp;
                  <small>(prorated)</small>
                </h3>
              </OverlayTrigger>
            <a href="/setup/login" className="btn btn-success btn-block btn-lg">
              Sign up for Premium
            </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

export function Footer() {
  return <footer className="footer">
    <span>Backstroke</span>
    <ul>
      <li><a href="https://github.com/1egoman/backstroke">Backstroke is ISC licensed.</a></li>
      <li><a href="https://github.com/1egoman/backstroke"></a></li>
      <li><a href="http://rgaus.net">Maintained by Ryan Gaus. Backstroke is copyright Ryan Gaus and contributors.</a></li>
    </ul>
  </footer>;
}

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
