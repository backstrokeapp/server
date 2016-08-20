import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, compose, applyMiddleware} from 'redux';
import {Router, Route, hashHistory} from 'react-router';

import reducer from 'reducers/reducer';
import App from 'components/app';

let store = createStore(reducer, {}, compose(
  applyMiddleware(),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

const history = hashHistory;

// On route change, fire actions.
history.listen(event => {
  const dispatch = store.dispatch;
  const state = store.getState();
  const pathname = event.pathname;
});

render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App} />
    </Router>
  </Provider>,
  document.getElementById('root')
);
