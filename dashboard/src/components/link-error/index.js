import * as React from 'react';
import './styles.css';

export default function LinkError({error}) {
  return <div className="link-error-container">
    <div className="link-error">{error}</div>
  </div>;
}
