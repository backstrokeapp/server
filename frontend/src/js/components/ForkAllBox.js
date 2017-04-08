import React from 'react';

export default function ForkAllBox({repository, upstream}) {
  return <div className="fork-box">
    <div className="icon-wrapper">
      <i className="fa fa-github" />
    </div>
    <p className="big-text">
      Propose changes
      to <strong>all forks</strong> of the
      upstream <strong>{upstream ? `${upstream.owner}/${upstream.repo}` : null}</strong>
    </p>
  </div>;
}
