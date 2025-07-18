"use client";
import styles from '../../styles/loading.module.scss';

import React from 'react';

const CryptoLoading: React.FC = () => {
  return (
    <div className={styles['loading-overlay']}>
      <div className={styles['crypto-loader']}>
        <div className={styles['blockchain']}></div>
        <div className={styles['privacy']}></div>
      </div>
    </div>
  );
};

export default CryptoLoading;