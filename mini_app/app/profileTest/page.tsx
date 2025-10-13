import React from "react";
const IMG3274 = "/assets/profile/IMG-3274.png";
const backgroundImage = "/assets/profile/background-image.svg";
const curious = "/assets/profile/curious.png";
const group3 = "/assets/profile/group-3.png";
const group28 = "/assets/profile/group-28.svg";
const group29 = "/assets/profile/group-29.svg";
const vector1 = "/assets/profile/vector-1.svg";
import s from "./page.module.css";


export default function ProfileTest() {
  return (
    <div className="profile">
      <img className={s.IMG} alt="Img" src={IMG3274} />

      <div className={s.group}>
        <img className={s.curious} alt="Curious" src={curious} />

        <div className={s["text-wrapper"]}>Good afternoon, username!</div>
      </div>

      <div className={s["shell-sticker"]}>
        <img className={s.vector} alt="Vector" src={vector1} />

        <img className={s.img} alt="Group" src={group3} />

        <img className={s["group-2"]} alt="Group" src={group28} />

        <img className={s["group-3"]} alt="Group" src={group29} />
      </div>

      <div className="div">
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
          <div className={s["background-image-2"]} />

          <div className={s["text-wrapper-3"]}>Language</div>
        </div>
      </div>

      <div className={s["group-6"]}>
        <div className={s["text-wrapper-4"]}>Other</div>

        <div className="group-4">
          <div className={s["background-image-2"]} />

          <div className={s["text-wrapper-3"]}>What is Obi?</div>
        </div>

        <div className={s["group-5"]}>
          <div className={s["background-image-2"]} />

          <div className={s["text-wrapper-3"]}>Log out</div>
        </div>
      </div>
    </div>
  );
}