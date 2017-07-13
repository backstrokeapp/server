import * as React from 'react';

export default function Footer() {
  return <div className="footer-container">
    <div className="footer">
      <div className="footer-brand">
        <img className="footer-logo" src="/assets/img/logo_footer.png" role="presentational" />
        <div className="footer-logo-label">Backstroke</div>
      </div>
      <ul className="footer-list">
        <li><a href="https://github.com/1egoman/backstroke">Github</a></li>
        <li><a href="https://github.com/backstroke-bot">Bot</a></li>
        <li><a href="https://gratipay.com/Backstroke">Gratipay</a></li>
        <li><a href="https://app.backstroke.us">Dashboard</a></li>
      </ul>
    </div>
  </div>;
}
