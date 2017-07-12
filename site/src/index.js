import * as React from 'react';
import Head from './components/head';

import HeaderLogo from './components/header-logo';
import HeaderBanner from './components/header-banner';
import HeaderLoginButton from './components/header-login-button';

import HowItWorks from './components/how-it-works';
import UsedBy from './components/used-by';
import OpenSource from './components/open-source';

export default <html>
  <Head />
  <body>
    <HeaderLogo />
    <HeaderBanner />
    <HeaderLoginButton />

    <HowItWorks />
    <UsedBy />
    <OpenSource />
  </body>
</html>;
