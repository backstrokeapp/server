import React from 'react';
import {connect} from 'react-redux';
import RouteMethod from './route';
import {Link} from 'react-router';
import GitHubButton from 'react-github-button';
import {Navbar, Nav, NavItem} from 'react-bootstrap';

export function App({user, children}) {
  return <div className="app-container-parent">
    <MainNav user={user} transparent={children && children.type.transparentNavBar} />
    <div className="app-container">
      {children}
      <Footer />
    </div>
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
        <div className="col-md-6 col-xs-12 col-md-push-6">
          <img src="/assets/img/howitworks.png" alt="How Backstroke works" />
        </div>
        <div className="col-md-6 col-xs-12 col-md-pull-6">
          <h2>How does Backstroke work?</h2>
          <p>
            Backstroke watches a Github repository via a webhook. When the repo is updated,
            Backstroke sends a pull request to all of that repository's forks.&nbsp;
            <a href="https://github.com/1egoman/backstroke#how-it-works">Read more.</a>
          </p>
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
          <img src="/assets/img/heart.png" alt="We love open source." />
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

export function Footer() {
  return <footer className="footer">
    <div className="container">
      <span>Backstroke is maintained by <a href="http://rgaus.net">Ryan Gaus</a>.</span>
      <ul>
        <li><a href="/#/legal">Legal</a></li>
        <li><a href="https://github.com/1egoman/backstroke">Github</a></li>
        <li><a href="https://gratipay.com/Backstroke/">Gratipay</a></li>
      </ul>
    </div>
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
