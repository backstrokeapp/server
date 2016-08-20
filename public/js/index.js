import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, compose, applyMiddleware} from 'redux';

import pipeApp from './reducers/pipe';
import App from './components/app';

let store = createStore(pipeApp, {
  blocks: [{
    method: "GET",
    url: "http://google.com",
    headers: `Content-type: application/json`,
    body: null,
    id: 123,
  }]
}, compose(
  applyMiddleware(),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
