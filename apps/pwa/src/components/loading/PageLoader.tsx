import React from 'react';
import CryptoLoading from '../small/crypto-loading';

const PageLoader = () => (
    <div className="page-loader">
        {/* <div className="spinner" /> */}
        <CryptoLoading />
    </div>
);

export default PageLoader;
