"use client";
import styles from '../../styles/loading.module.scss';

import React from 'react';

const CryptoLoading: React.FC = () => {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.cryptoLoader}>
        <div className={styles.blockchain}></div>
        <div className={styles.privacy}></div>
      </div>
    </div>
  );
};

export default CryptoLoading;