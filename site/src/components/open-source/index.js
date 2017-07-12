import * as React from 'react';
import Script from '../script';

export default function OpenSource() {
  return <div className="open-source-container">
    <div className="open-source">
      <div className="open-source-left">
        <img
          src="/assets/img/heart.png"
          alt="Backstroke <3 Open Source"
        />
      </div>
      <div className="open-source-right">
        <h1>Open Source</h1>
        <p>
          Backstroke is built to work on open source projects. In addition, Backstroke itself is
          open source - <a href="https://github.com/1egoman/backstroke">check us out on Github</a>.
          We are greatful for the <span id="gratipay">donations</span> we receive each month on Gratipay.
          Thanks for the support!
        </p>
      </div>
      <script type="text/javascript" src="/assets/scripts/load-gratipay.js"></script>
    </div>
  </div>;
}
