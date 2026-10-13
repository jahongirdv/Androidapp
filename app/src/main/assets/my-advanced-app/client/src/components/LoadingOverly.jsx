import React from 'react';

export default function LoadingOverlay() {
  return (
    <div className="global-loading-backdrop">
      <div className="global-loading-col">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    </div>
  );
}
