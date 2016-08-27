import React from 'react';
import {connect} from 'react-redux';
import Select from 'react-select';
import Switch from 'react-ios-switch';
import {FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap';

import RepositoryBox from 'components/RepositoryBox';
import ForkAllBox from 'components/ForkAllBox';
import BoxProperties from 'components/BoxProperties';
import AddNewBox from 'components/AddNewBox';
import enableDisableLink from 'actions/enableDisableLink';
import changeLinkName from 'actions/changeLinkName';

import linkSave from 'actions/linkSave';

export function isRepoValid(repo) {
  return (
    repo.type === 'repo' &&
    repo.provider && 
    repo.name &&
    repo.name.length > 0 &&
    repo.name.indexOf('/') !== -1 &&
    repo.branch && repo.branch.length > 0
  ) || (
    repo.type === 'fork-all' &&
    repo.provider && repo.provider.length > 0
  );
}

export function isLinkValid(link) {
  return (
    link.name && link.name.length > 0 &&
    link.to && link.to.type && link.to.provider &&
    link.from && link.from.type && link.from.provider &&
    isRepoValid(link.to) && isRepoValid(link.from)
  )
}

export function Link({
  link,
  children,

  onLinkSave,
  onLinkEnable,
  onChangeLinkName,
}) {
  if (link) {
    // fetch branches, if required
    if (link.from && link.from.branches) {
      let fromBranchOptions = link.from.branches.map(branch => {
        return {value: branch, label: branch};
      });
    }
    if (link.to && link.to.branches) {
      let toBranchOptions = link.to.branches.map(branch => {
        return {value: branch, label: branch};
      });
    }

    return <div className="link-item container">
      <header className="link-header">
        <OverlayTrigger placement="bottom" overlay={
          <Tooltip id="link-state">
            {link.enabled ? 'Disable' : 'Enable'} this link
          </Tooltip>
        }>
          <span> {/* Required to let react-bootstrap bind to the switch */}
            <Switch
              onChange={onLinkEnable.bind(null, link, !link.enabled)}
              checked={link.enabled}
              disabled={link._pending}
            />
          </span>
        </OverlayTrigger>

        {/* The name of the link */}
        <FormControl
          type="text"
          className="link-name"
          value={link.name || ""}
          onChange={onChangeLinkName}
          placeholder="Enter a link name"
        />
      </header>

      <div className="slot-container">
        <div className="slot from-slot">
          <h1>From</h1>
          <RepoWrapper
            slot="from"
            repository={link.from}
            branch={link.from && link.from.branch}
          />
        </div>
        <div className="slot to-slot">
          <h1>To</h1>
          <RepoWrapper
            slot="to"
            repository={link.to}
            branch={link.to && link.to.branch}
            from={link.from}
          />
        </div>
      </div>

      <div className="webhook-container">
        <h1>Webhook URL</h1>

        {/* The webhook url */}
        <FormControl
          type="text"
          onFocus={event => event.target.select()}
          readOnly={true}
          value={`http://backstroke.us/_${link._id}`}
        />

        <p>
          Every time this url is visited, we'll check for updates. In order to keep
          your repository up to date, you should add this url to one of the projects
          above. This is super simple: go to your project's page, click <code>Settings</code>,
          then <code>Webhooks &amp; services</code>, then in the box labeled
          <code>Payload URL</code>, paste the above url. Once you click <code>Add Webhook</code>,
          we'll make sure that your changes are synced.
        </p>
      </div>

      {
        link._saveInProgress ? 
        <button className="btn btn-primary disabled">Loading</button> :
        <button
          className="btn btn-primary"
          onClick={onLinkSave.bind(null, link)}
          disabled={!isLinkValid(link)}
        >Save</button>
      }

      {children}
    </div>;
  } else {
    return <div className="column repo">
      <span>Loading repository...</span>
      {children}
    </div>;
  }
}

export function RepoWrapper({repository, branch, from, slot}) {
  if (repository && repository.type === 'repo') {
    // A bare repository / branch combo
    return <BoxProperties repository={repository}>
      <RepositoryBox repository={repository} branch={branch} />
    </BoxProperties>;
  } else if (repository && repository.type === 'fork-all') {
    // All forks for the upstream
    return <BoxProperties repository={repository}>
      <ForkAllBox repository={repository} from={from} />
    </BoxProperties>;
  } else {
    // add a new item
    return <AddNewBox type={slot} />;
  }
}

export default connect((state, props) => {
  return {
    link: state.activeLink,
  };
}, dispatch => {
  return {
    onLinkSave(repo) {
      dispatch(linkSave(repo));
    },
    onLinkEnable(link, enabled) {
      dispatch(enableDisableLink(link, enabled));
    },
    onChangeLinkName(event) {
      dispatch(changeLinkName(event.target.value));
    },
  };
})(Link);