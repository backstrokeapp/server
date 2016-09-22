import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, compose, applyMiddleware} from 'redux';
import {Router, Route, IndexRoute, hashHistory} from 'react-router';
import reduxThunk from 'redux-thunk';
import {routerMiddleware} from 'react-router-redux';

import reducer from 'reducers/reducer';
import App, {Index} from 'components/App';
import {Pricing} from 'components/Pricing';
import Link from 'components/Link';
import LinkList from 'components/LinkList';
import ManageSettings from 'components/ManageSettings';

import fetchUser from 'actions/fetchUser';
import fetchLink from 'actions/fetchLink';
import fetchLinks from 'actions/fetchLinks';
import fetchSettings from 'actions/fetchSettings';

// Setup Mixpanel.
process.env.USE_MIXPANEL && mixpanel.track("Page view");

// Which history store to use?
const history = hashHistory;

// Configure Store
let store = createStore(reducer, {}, compose(
  applyMiddleware(reduxThunk, routerMiddleware(history)),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

// On route change, fire actions.
history.listen(event => {
  const dispatch = store.dispatch;
  const state = store.getState();
  const pathname = event.pathname;

  // fetch the user if the user hasn't been fetched already
  if (state.user === null) {
    dispatch(fetchUser());
  }
  let match;

  // /links
  // Get a list of all links that the user has configured.
  if (match = pathname.indexOf('/links') === 0) {
    dispatch(fetchLinks());
  }

  // /links/:linkId
  // When navigating to a new link's page, fetch its details
  if (match = pathname.match(/^\/links\/(.+)\/?$/)) {
    // only fetch the link if it has changed
    // this is because links that are being created (but not saved) need to persist in memory.
    // See https://github.com/1egoman/backstroke/issues/22
    if (!(state.activeLink && match[1] === state.activeLink._id)) {
      dispatch(fetchLink({_id: match[1]}));
    }
  }

  // /links/:linkId
  // When navigating to a new link's page, fetch its details
  if (match = pathname.indexOf('/settings') === 0) {
    dispatch(fetchSettings());
  }

});

// Render it all.
render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <IndexRoute component={Index} />
        <Route path="/links" component={LinkList} />
        <Route path="/links/:linkId" component={Link} />
        <Route path="/settings" component={ManageSettings} />
        <Route path="/pricing" component={Pricing} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('root')
);
