import * as React from 'react';

export default function HowItWorks() {
  return <div className="how-it-works-container">
    <div className="how-it-works">
      <div className="how-it-works-left">
        <h1>How it works</h1>
        <p>
          Backstroke watches your repository. When it changes, and if your fork is behind, Backstroke
          creates a pull request with the differences.
        </p>
      </div>
      <div className="how-it-works-right">
        <img
          src="/assets/img/backstroke-pr.png"
          alt="Backstroke pull request"
        />
      </div>
    </div>
  </div>;
}
