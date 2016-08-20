import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, compose, applyMiddleware} from 'redux';
import {Router, Route, hashHistory} from 'react-router';
import reduxThunk from 'redux-thunk';

import reducer from 'reducers/reducer';
import App from 'components/app';
import fetchUser from 'actions/fetchUser';
import fetchRepo from 'actions/fetchRepo';

let store = createStore(reducer, {}, compose(
  applyMiddleware(reduxThunk),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

const history = hashHistory;

// On route change, fire actions.
history.listen(event => {
  const dispatch = store.dispatch;
  const state = store.getState();
  const pathname = event.pathname;

  // fetch the user if the user hasn't been fetched already
  if (state.user === null) {
    dispatch(fetchUser());
  }

  // /repo/:provider/:user/:repo
  // When navigating to a new repo's page, fetch its details
  let match;
  if (match = pathname.match(/^\/repo\/(github)\/(.+)\/(.+)\/?$/)) {
    dispatch(fetchRepo(match[1], match[2], match[3]));
  }
});

render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App} />
      <Route path="/repo/:provider/:user/:repo" component={App} />
    </Router>
  </Provider>,
  document.getElementById('root')
);
