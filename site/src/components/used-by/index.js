import * as React from 'react';

export default function UsedBy() {
  return <div className="used-by">
    <h1>Who's using Backstroke?</h1>

    <div className="used-by-grid">
      <div className="used-by-grid-row">
        <div className="used-by-grid-image-wrapper">
          <img src="/assets/img/conda.svg" alt="Conda" />
        </div>
        <div className="used-by-grid-image-wrapper">
          <img src="/assets/img/cachet.png" alt="Conda" />
        </div>
      </div>
      <div className="used-by-grid-row">
        <span>Create React App</span>
        <a href="https://github.com/backstroke-bot?tab=overview&from=2017-05-01&to=2017-05-31&utf8=%E2%9C%93">and more...</a>
      </div>
    </div>
  </div>;
}
