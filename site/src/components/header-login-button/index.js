import * as React from 'react';

export default function HeaderLoginButton({text}) {
  return <div className="header-login-section">
    <img className="header-login-button-man" role="presentational" src="/assets/img/login_button_man.png" />
    <a href="https://app.backstroke.us" className="header-login-button">
      {text || 'Login with Github'}
    </a>
  </div>;
}
