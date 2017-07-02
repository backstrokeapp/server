import * as React from 'react';

export default function HeaderBanner(props) {
  return <div className="header-banner-container">
    <div className="header-banner">
      <h1 className="header-banner-header">Incorporate new changes as they happen,<br/>not in 6 months.</h1>
      <ul className="header-banner-body">
        <li>With Backstroke, always keep your repository's forks up to date.</li>
        <li><strong>Open source maintainers</strong> can merge contributor's code with one click.</li>
        <li><strong>Contributors</strong> don't have to worry about hefty merge conflicts.</li>
      </ul>
    </div>
  </div>;
}
