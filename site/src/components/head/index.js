import * as React from 'react';

export default function Head({title}) {
  return <head>
    <title>{title || 'Backstroke | Sync changes upstream from forks on Github'}</title>
    <link rel="stylesheet" href="/styles.css" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>;
}
