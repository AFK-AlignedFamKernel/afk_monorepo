import React from 'react';

const PageLoader = () => (
  <div className="page-loader">
    <div className="spinner" />
    <style jsx>{`
      .page-loader {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--background, #fff);
        z-index: 9999;
      }
      .spinner {
        width: 48px;
        height: 48px;
        border: 6px solid #eee;
        border-top: 6px solid #333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default PageLoader;
