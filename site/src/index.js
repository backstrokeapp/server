import * as React from 'react';
import Head from './components/head';

import HeaderBanner from './components/header-banner';
import HeaderLoginButton from './components/header-login-button';

export default <html>
  <Head title="foo" />
  <body>
    <img src="/assets/img/logo.png" alt="Backstroke" />

    <HeaderBanner />
    <HeaderLoginButton />
  </body>
</html>;
