import React from 'react';
import {connect} from 'react-redux';
import Select from 'react-select';
import Switch from 'react-ios-switch';
import {InputGroup, FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap';
import Collapse, {Panel} from 'rc-collapse';
import {push} from 'react-router-redux';

import RepositoryBox from 'components/RepositoryBox';
import ForkAllBox from 'components/ForkAllBox';
import BoxProperties from 'components/BoxProperties';
import AddNewBox from 'components/AddNewBox';
import enableDisableLink from 'actions/enableDisableLink';
import changeLinkName from 'actions/changeLinkName';
import isDeletingLink from 'actions/isDeletingLink';
import deleteLink from 'actions/deleteLink';
import changePushUsers from 'actions/changePushUsers';

import linkSave from 'actions/linkSave';

export function isRepoValid(repo, type) {
  return (
    repo.type === 'repo' &&
    repo.provider && 
    repo.name &&
    repo.name.length > 0 &&
    repo.name.indexOf('/') !== -1 &&
    repo.branch && repo.branch.length > 0 &&
    repo.branches.length > 0 && // must have al teast 1 branch
    (type === 'to' ? repo.fork : true) // to must be a fork
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
    isRepoValid(link.to, 'to') && isRepoValid(link.from, 'from')
  )
}

export function Link({
  link,
  user,
  children,

  onLinkSave,
  onLinkEnable,
  onChangeLinkName,
  onDeleteLink,
  onIsDeletingLink,
  onChangePushUsers,
  onBackToLinkList,
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
      <div className="action-button-container action-button-header">
        <button className="btn btn-default" onClick={onBackToLinkList}>&larr; Back</button>

        {
          link._deleting ?
          <button
            className="btn btn-danger"
            onClick={onDeleteLink.bind(null, link._id)}
          >Are you sure?</button> :
          <button className="btn btn-danger" onClick={onIsDeletingLink}>Delete Link</button>
        }
      </div>

      <header className="link-header">
        <span>
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
        </span>

        {/* The name of the link */}
        <FormControl
          type="text"
          className="link-name"
          value={link.name || ""}
          onChange={onChangeLinkName}
          placeholder="Enter a link name"
        />
      </header>

      {/* Errors in the save process */}
      {link._saveError ? <span className="text-danger">{link._saveError}</span> : null}

      <div className="slot-container">
        <div className="slot from-slot">
          <h1>Upstream</h1>
          <RepoWrapper
            slot="from"
            repository={link.from}
            branch={link.from && link.from.branch}
          />
        </div>
        <div className="slot to-slot">
          <h1>Fork</h1>
          <RepoWrapper
            slot="to"
            repository={link.to}
            branch={link.to && link.to.branch}
            from={link.from}

            dim={!(link.from && link.from.branch)}
          />
        </div>
      </div>

      <Collapse>
        <Panel header="Webhook" className="webhook-container">
          {/* The webhook url */}
          <InputGroup>
            <InputGroup.Addon>Webhook URL</InputGroup.Addon>
            <FormControl
              type="text"
              onFocus={event => event.target.select()}
              readOnly={true}
              value={`${process.env.BACKSTROKE_SERVER}/_${link._id}`}
            />
          </InputGroup>

          <h3>What is this?</h3>
          <p>
            This is the URL that Backstroke adds as a webhook to your repositories. Coincidently, if
            you want to programmatically trigger Backstroke to look for changes (if you haven't
            pushed to your fork in a while), you can query this endpoint either manually or in a
            script.
          </p>
          <code>curl -X POST {process.env.BACKSTROKE_SERVER}/_{link._id}</code>
        </Panel>
      </Collapse>

      <div style={{float: 'right'}}>
        {
          link._saveInProgress ? 
          <button className="btn btn-primary btn-lg disabled">Loading</button> :
          <button
            className="btn btn-lg btn-primary"
            onClick={onLinkSave.bind(null, link)}
            disabled={!isLinkValid(link)}
          >Save</button>
        }
      </div>

      {children}
    </div>;
  } else if (user && !user._auth) {
    return <UserNotAuthenticated />;
  } else {
    return <div className="loading container">
      <span>Loading link...</span>
      {children}
    </div>;
  }
}

export function RepoWrapper({repository, branch, from, slot, dim}) {
  if (repository && repository.type === 'repo') {
    // A bare repository / branch combo
    return <BoxProperties repository={repository}>
      <RepositoryBox repository={repository} branch={branch} type={slot} />
    </BoxProperties>;
  } else if (repository && repository.type === 'fork-all') {
    // All forks for the upstream
    return <BoxProperties repository={repository}>
      <ForkAllBox repository={repository} from={from} />
    </BoxProperties>;
  } else {
    // add a new item
    return <AddNewBox type={slot} dim={dim} />;
  }
}

export default connect((state, props) => {
  return {
    link: state.activeLink,
    user: state.user,
  };
}, dispatch => {
  return {
    onLinkSave(link) {
      link.enabled = true;
      dispatch(linkSave(link));
    },
    onLinkEnable(link, enabled) {
      dispatch(enableDisableLink(link, enabled));
    },
    onChangeLinkName(event) {
      dispatch(changeLinkName(event.target.value));
    },
    onIsDeletingLink() {
      dispatch(isDeletingLink());
    },
    onDeleteLink(linkId) {
      dispatch(deleteLink(linkId));
    },
    onChangePushUsers(event) {
      dispatch(changePushUsers(event.target.value));
    },
    onBackToLinkList() {
      dispatch(push('/links'));
    },
  };
})(Link);
