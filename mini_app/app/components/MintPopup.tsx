"use client";

import React from "react";
import styles from "./MintPopup.module.css";

export default function MintPopup({
                                      tokenId,
                                      onClose,
                                      onView,
                                  }: { tokenId: number; onClose: () => void; onView?: () => void }) {
    const img = `/assets/nfts/${tokenId}.png`;
    return (
        <div className={styles.mintBackdrop} onClick={onClose}>
            <div className={styles.mintCard} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.mintTitle}>You’ve got a new badge!</h3>
                <img className={styles.mintImg} src={img} alt={`Badge #${tokenId}`}/>
                <div className={styles.mintActions}>
                    <button className={`${styles.btn} ${styles.btnClose}`} onClick={onClose}>
                        <p className={styles.textWrapper}>Close</p>
                    </button>

                    {onView && (
                        <button className={`${styles.btn} ${styles.btnView}`} onClick={onView}>
                            <p className={styles.textWrapper}>View</p>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}