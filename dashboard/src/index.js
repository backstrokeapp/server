import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import App from './components/app/index';

import './styles.css';

import thunk from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import {Provider} from 'react-redux';

import createRouter from '@density/conduit';
import userSet from './actions/user/set';
import routeTransitionLinkList from './actions/route-transition/link-list';
import routeTransitionLinkDetail from './actions/route-transition/link-detail';

import activePage from './reducers/active-page';
import links from './reducers/links';
import user from './reducers/user';

const reducer = combineReducers({
  activePage,
  links,
  user,
})

const store = createStore(reducer, {}, compose(
  applyMiddleware(thunk),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

fetch('https://api.backstroke.us/v1/whoami', {
  credentials: 'include',
}).then(resp => {
  if (resp.ok) {
    return resp.json().then(data => {
      store.dispatch(userSet(data));
    });
  } else {
    // User isn't logged in, send them to the login page.
    window.location.href = 'https://api.backstroke.us/setup/login';
  }
});

// Add a router. This handles the transition between the list page and the detail page.
const router = createRouter(store);
router.addRoute('links', () => routeTransitionLinkList());
router.addRoute('links/:id', id => routeTransitionLinkDetail(id));

if (window.location.hash === '') {
  // Dispatch a route transition.
  window.location.hash = '#/links';
} else {
  // Handle the existing state of the page.
  router.handle();
}

// ReactDOM.render(<LinkList />, document.getElementById('root'));
ReactDOM.render(<Provider store={store}>
  <App />
</Provider>, document.getElementById('root'));
registerServiceWorker();
