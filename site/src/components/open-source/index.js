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
          open source - check us out on Github.  We are greatful for the <span
            id="gratipay">donations</span> we receive each month on Gratipay.  Thanks for the
          support!
        </p>
        <div className="open-source-button-group">
          <a href="https://gratipay.com/Backstroke/" className="open-source-button">Support us on Gratipay</a>
          <a href="https://github.com/1egoman/backstroke" className="open-source-button faded">View on Github</a>
        </div>
      </div>
      <script type="text/javascript" src="/assets/scripts/load-gratipay.js"></script>
    </div>
  </div>;
}
