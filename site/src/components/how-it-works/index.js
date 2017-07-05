import * as React from 'react';

export default function HowItWorks() {
  return <div className="how-it-works">
    <h1>How it works</h1>
    <p>
      Backstroke watches your repository. When it changes, we check to see
      if your fork is behind - if it is, Backstroke creates a pull request with the
      differences.
    </p>
    <img
      src="/assets/img/backstroke-pr.png"
      alt="Backstroke pull request"
    />
  </div>;
}
