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
                                      mode = "default",
                                      primaryLabel = "Great!",
                                      onPrimary,
                                  }: {
    tokenId: number;
    name?: string;
    description?: string;
    image?: string;
    onClose: () => void;
    onView?: () => void;
    btn_name?: string;
    mode?: "default" | "single";
    primaryLabel?: string;
    onPrimary?: () => void;
}) {
    return (
        <div className={styles.mintBackdrop} onClick={onClose}>
            <div className={styles.mintCard} onClick={(e) => e.stopPropagation()}>
                <button type="button" className={styles.closeX} aria-label="Close" onClick={onClose}>✕</button>

                <h3 className={styles.mintTitle}>{name || "You’ve got a new badge!"}</h3>
                <img className={styles.mintImg} src={image} alt={`Badge #${tokenId}`}/>
                {description && <p className={styles.mintDesc}>{description}</p>}

                <div className={styles.mintActions}>
                    {mode === "single" ? (
                        <button className={`${styles.btn} ${styles.btnView}`} onClick={onPrimary ?? onClose}>
                            <p className={styles.textWrapper}>{primaryLabel}</p>
                        </button>
                    ) : (
                        <>
                            <p className={styles.textWrapper}>
                                <span className={styles.close} onClick={onClose}>Close</span>
                            </p>
                            {onView && (
                                <button className={`${styles.btn} ${styles.btnView}`} onClick={onView}>
                                    <p className={styles.textWrapper}>{btn_name || "View"}</p>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
