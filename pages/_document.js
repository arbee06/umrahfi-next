import { Html, Head, Main, NextScript } from 'next/document';
import { config, dom } from '@fortawesome/fontawesome-svg-core';

// Prevent FontAwesome from adding CSS automatically since we're importing it in _app.js
config.autoAddCss = false;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Insert the FontAwesome CSS before any other CSS */}
        <style>{dom.css()}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}