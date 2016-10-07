import React from 'react';
import {connect} from 'react-redux';
import {changeMethod, changeUrl, changeHeaders, changeBody, changeTag} from '../actions/blocks';
import {
  DropdownButton,
  MenuItem,
  ButtonGroup,
  FormControl,
} from 'react-bootstrap';

// render a route block
export function routeMethod({
  block,

  changeMethod,
  changeUrl,
  changeTag,
}) {
  return <div className="panel panel-default panel-route-method">
    <div className="panel-heading">
      <div className="row">
        {/* Request method */}
        <DropdownButton title={block.method} id="request-method-button">
          {(() => {
            return ["GET", "POST", "PUT", "DELETE"].map(method => {
              return <MenuItem
                eventKey={method} key={method}
                onClick={changeMethod.bind(this, block, method)}
              >
                {method}
              </MenuItem>
            });
          })()}
        </DropdownButton>

        {/* Request url */}
        <FormControl
          type="text"
          onChange={changeUrl.bind(this, block)}
          value={block.url}
          placeholder="http://example.com/path?foo=bar"
        />

        {/* Request tag */}
        <FormControl
          type="text"
          onChange={changeTag.bind(this, block)}
          value={block.tag}
          placeholder="Route tag"
        />
      </div>
    </div>
    <div className="panel-body">
      <div className="row">
        <div className="route-method-headers">
          <h4>Headers</h4>
          <FormControl
            componentClass="textarea"
            placeholder="Content-type: application/json"
          />
        </div>
        {(() => {
          if (block.method !== "GET") {
            return <div className="route-method-body">
              <h4>Body</h4>
              <FormControl
                componentClass="textarea"
                placeholder="Field: value"
                value={block.body}
              />
            </div>;
          } else {
            return <div className="route-method-body">
              <h4>Body</h4>
              <code>No request body in a get request.</code>
            </div>;
          }
        })()}
      </div>
    </div>
  </div>;
}

export default connect((state, props) => {
  return {
    block: state.blocks[0],
  };
}, (dispatch, props) => {
  return {
    changeMethod(block, newMethod) {
      dispatch(changeMethod(block, newMethod));
    },
    changeUrl(block, event) {
      dispatch(changeUrl(block, event.target.value));
    },
    changeTag(block, event) {
      dispatch(changeTag(block, event.target.value));
    },
  };
})(routeMethod);
