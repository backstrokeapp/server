import * as React from 'react';
import './styles.css';

let switchId = 0;

export default function ToggleSwitch(props) {
  switchId += 1;
  return <div className="toggle-switch">
    <input type="checkbox" {...props} id={switchId} />
    <label htmlFor={switchId}></label>
  </div>;
}
