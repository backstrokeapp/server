import * as React from 'react';
import Head from './components/head';

import HeaderLogo from './components/header-logo';
import HeaderBanner from './components/header-banner';
import HeaderLoginButton from './components/header-login-button';

import HowItWorks from './components/how-it-works';
import UsedBy from './components/used-by';

export default <html>
  <Head title="foo" />
  <body>
    <HeaderLogo />
    <HeaderBanner />
    <HeaderLoginButton />

    <HowItWorks />
    <UsedBy />
  </body>
</html>;
