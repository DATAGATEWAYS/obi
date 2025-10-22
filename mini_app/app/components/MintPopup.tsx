"use client";
import React from "react";
import styles from "./MintPopup.module.css";

export default function MintPopup({
                                      tokenId,
                                      name,
                                      description,
                                      image,
                                      onClose,
                                      onView,
                                      btn_name,
                                  }: {
    tokenId: number;
    name?: string;
    description?: string;
    image?: string;
    onClose: () => void;
    onView?: () => void;
    btn_name?: string;
}) {
    const img = image ?? `/assets/nfts/${tokenId}.png`;

    return (
        <div className={styles.mintBackdrop} onClick={onClose}>
            <div className={styles.mintCard} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.mintTitle}>{name || "You’ve got a new badge!"}</h3>
                <img className={styles.mintImg} src={img} alt={`Badge #${tokenId}`}/>
                {description && <p className={styles.mintDesc}>{description}</p>}

                <div className={styles.mintActions}>
                    <>
                        <p onClick={onClose} className={`${styles.textWrapper} ${styles.close}`}>Close</p>
                        {onView && (
                            <button className={`${styles.btn} ${styles.btnView}`} onClick={onView}>
                                <p className={styles.textWrapper}>{btn_name || "View"}</p>
                            </button>
                        )}
                    </>
                </div>
            </div>
        </div>
    );
}
