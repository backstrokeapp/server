import * as React from 'react';
import Head from './components/head';

import HeaderLogo from './components/header-logo';
import HeaderBanner from './components/header-banner';
import HeaderLoginButton from './components/header-login-button';

import HowItWorks from './components/how-it-works';
import UsedBy from './components/used-by';
import OpenSource from './components/open-source';
import Footer from './components/footer';

export default <html>
  <Head />
  <body>
    <HeaderLogo />
    <HeaderBanner />
    <HeaderLoginButton />

    <HowItWorks />
    <UsedBy />
    <OpenSource />

    <Footer />

    {/* In production, provide analytics */}
    <script src="https://cdn.ravenjs.com/3.17.0/raven.min.js" crossorigin="anonymous"></script>
    <script src="/assets/scripts/analytics.js"></script>
  </body>
</html>;
