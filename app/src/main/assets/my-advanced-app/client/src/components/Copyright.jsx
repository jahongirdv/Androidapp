import React from 'react';
export default function Copyright({
  appName,
  year = new Date().getFullYear(),
}) {
  return (
    <div className="text-center">
      <p>
        {appName} © {year}
        <br />
        Built with ❤️ by{' '}
        <a
          className="dark:text-primary text-primary"
          href="https://sarawebs.com"
          target="_blank"
          rel="noopener"
        >
          SaraWebs
        </a>
      </p>
    </div>
  );
}
