import * as React from 'react';
import * as classnames from 'classnames';
import './styles.css';

export default function Button({children, color, disabled, className, onClick}) {
  return <button
    onClick={onClick}
    className={classnames('button', `button-color-${color}`, {disabled}, className)}
  >
    {children}
  </button>;
}
