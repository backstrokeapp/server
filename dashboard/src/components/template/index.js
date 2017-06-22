import * as React from 'react';
import './styles.css';

export default function %COMPONENTUPPERCAMEL%({
  name,
}) {
  return <div className="%COMPONENTDASH%">
    {name ? `Hello ${name}` : 'Hello World!'}
  </div>;
}
