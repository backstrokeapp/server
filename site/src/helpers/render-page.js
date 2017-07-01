import { renderToStaticMarkup } from 'react-dom/server';
console.log(renderToStaticMarkup(require(process.argv[2]).default));
