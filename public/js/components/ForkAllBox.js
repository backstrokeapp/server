import React from 'react';

export default function ForkAllBox({repository, upstream}) {
  return <div className="fork-box">
    <div className="icon-wrapper">
      <i className={'fa fa-'+repository.provider} />
    </div>
    <p className="big-text">
      Propose changes
      to <strong>all forks</strong> of the
      upstream <strong>{upstream ? upstream.name : null}</strong>
    </p>
  </div>;
}
