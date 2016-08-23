import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, compose, applyMiddleware} from 'redux';
import {Router, Route, hashHistory} from 'react-router';
import reduxThunk from 'redux-thunk';
import {routerMiddleware} from 'react-router-redux';

import reducer from 'reducers/reducer';
import App from 'components/App';
import Link from 'components/Link';
import LinkList from 'components/LinkList';

import fetchUser from 'actions/fetchUser';
import fetchLink from 'actions/fetchLink';
import fetchLinks from 'actions/fetchLinks';

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
    dispatch(fetchLink({_id: match[1]}));
  }
});

// Render it all.
render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <Route path="/links" component={LinkList} />
        <Route path="/links/:linkId" component={Link} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('root')
);
