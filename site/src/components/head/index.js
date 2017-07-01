import * as React from 'react';

export default function Head({title}) {
  return <head>
    <title>{title || 'Backstroke | Sync changes upstream from forks on Github'}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>;
}
