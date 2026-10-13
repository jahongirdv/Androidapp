import React from 'react';

export default function Footer({ left, right, children, className }) {
  return (
    <footer className={className + ' ' + 'dark:text-white'}>
      {left && <div>{left}</div>}
      {children}
      {right && <div>{right}</div>}
    </footer>
  );
}
