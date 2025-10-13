import React from "react";
import s from "./page.module.css";

const IMG3274 = "/profile/IMG_3274.png";
const backgroundImage = "/profile/background_image.svg";
const curious = "/profile/curious.png";
const group3 = "/profile/Group%203.png";
const group28 = "/profile/Group%2028.svg";
const group29 = "/profile/Group%2029.svg";
const vector1 = "/profile/Vector%201.png";

export default function ProfileTest() {
    return (
        <main className="tg-safe page-inner">
            <div className={s.profile}>
                <img className={s.IMG} alt="Img" src={IMG3274}/>

                <div className={s.group}>
                    <img className={s.curious} alt="Curious" src={curious}/>
                    <div className={s["text-wrapper"]}>Good afternoon, username!</div>
                </div>

                <div className={s["shell-sticker"]}>
                    <img className={s.vector} alt="Vector" src={vector1}/>
                    <img className={s.img} alt="Group" src={group3}/>
                    <img className={s["group-2"]} alt="Group 28" src={group28}/>
                    <img className={s["group-3"]} alt="Group 29" src={group29}/>
                </div>

                <div className={s.div}>
                    <div className={s["text-wrapper-2"]}>Account Settings</div>

                    <div className={s["group-4"]}>
                        <img
                            className={s["background-image"]}
                            alt="Background image"
                            src={backgroundImage}
                        />
                        <div className={s["text-wrapper-3"]}>Username</div>
                    </div>

                    <div className={s["group-5"]}>
                        <div className={s["background-image-2"]}/>
                        <div className={s["text-wrapper-3"]}>Language</div>
                    </div>
                </div>

                <div className={s["group-6"]}>
                    <div className={s["text-wrapper-4"]}>Other</div>

                    <div className={s["group-4"]}>
                        <div className={s["background-image-2"]}/>
                        <div className={s["text-wrapper-3"]}>What is Obi?</div>
                    </div>

                    <div className={s["group-5"]}>
                        <div className={s["background-image-2"]}/>
                        <div className={s["text-wrapper-3"]}>Log out</div>
                    </div>
                </div>
            </div>
        </main>
    );
}