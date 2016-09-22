import React from 'react';
import {Tooltip, OverlayTrigger} from 'react-bootstrap';

export function Pricing() {
  return <div className="pricing-page">
    <div className="container">
      <h1>Pricing</h1>

      <div className="row">
        <div className="col-md-6">
          <div className="panel panel-default">
            <div className="panel-heading">
              Free
              <span className="pull-right">Use for free</span>
            </div>
            <ul className="list-group">
              <li className="list-group-item">Sync changes from upstream to forks</li>
              <li className="list-group-item">Sync changes between two repositories</li>
              <li className="list-group-item">Sync between arbitrary branches of each repository</li>
              <li className="list-group-item">Changes are proposed as pull requests</li>
            </ul>
            <div className="panel-footer">
              <h3 style={{color: "#333", textAlign: "center", marginBottom: 20}}>Use for free</h3>
              <a href="/setup/login" className="btn btn-default btn-block btn-lg">Sign up</a>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="panel panel-success">
            <div className="panel-heading">
              Premium
              <span className="pull-right">$1.00 per premium link per month</span>
            </div>
            <ul className="list-group">
              <li className="list-group-item">Sync changes from upstream to forks</li>
              <li className="list-group-item">Sync changes between two repositories</li>
              <li className="list-group-item">Sync between arbitrary branches of each repository</li>
              <li className="list-group-item">Changes are proposed as pull requests</li>
              <li className="list-group-item">
                <span className="label label-success">Premium</span>
                Sync changes to private repositories on Github
              </li>
              <li className="list-group-item">
                <span className="label label-success">Premium</span>
                Premium support
              </li>
              <li className="list-group-item">
                <span className="label label-success">Premium</span>
                Less than the price of a lunch per year
              </li>
            </ul>
            <div className="panel-footer">
              <OverlayTrigger placement="top" overlay={
                <Tooltip id="prorated">
                  You only pay for the time that your premium link is enabled.
                  For example, if you have a premium link enabled for half of a month,
                  you'll pay 50 cents instead of $1.00.
                </Tooltip>
              }>
                <h3 style={{color: "#333", textAlign: "center", marginBottom: 20}}>
                  $1.00 per premium link per month&nbsp;
                  <small>(prorated)</small>
                </h3>
              </OverlayTrigger>
              <a href="/setup/login?type=premium" className="btn btn-success btn-block btn-lg">
                Sign up for Premium
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
