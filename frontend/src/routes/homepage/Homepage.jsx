import { Link } from "react-router-dom";
import "./homepage.css";
import { TypeAnimation } from "react-type-animation";
import { useState } from "react";

const Homepage = () => {
  const [typingStatus, setTypingStatus] = useState("human1");

  return (
    <div className="homepage">
      <img src="/orbital.png" alt="" className="orbital" />
      <div className="left">
        <h1>Aura</h1>
        <h2>Your companion on the journey to healing</h2>
        <h3>
          Share your thoughts and feelings in a safe space. Aura listens, understands, 
          and offers thoughtful guidance to help you navigate life's challenges.
        </h3>
        <Link to="/dashboard">Begin Healing</Link>
      </div>
      <div className="right">
        <div className="imgContainer">
          <div className="bgContainer">
            <div className="bg"></div>
          </div>
          <img src="/bot.png" alt="" className="bot" />
          <div className="chat">
            <img
              src={
                typingStatus === "human1"
                  ? "/human1.jpeg"
                  : typingStatus === "human2"
                  ? "/human2.jpeg"
                  : "bot.png"
              }
              alt=""
            />
            <TypeAnimation
              sequence={[
                "Alex: I've been feeling really overwhelmed lately...",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                "Aura: I understand how challenging that can feel. Let's take a moment to breathe together.",
                2000,
                () => {
                  setTypingStatus("human2");
                },
                "Rubina: I don't know how to handle all this stress.",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                "Aura: You're not alone in this. Let's explore some gentle ways to ease your mind.",
                2000,
                () => {
                  setTypingStatus("human1");
                },
              ]}
              wrapper="span"
              repeat={Infinity}
              cursor={true}
              omitDeletionAnimation={true}
            />
          </div>
        </div>
      </div>
      <div className="terms">
        <img src="/logo.png" alt="" />
        <div className="links">
          <Link to="/">Terms of Service</Link>
          <span>|</span>
          <Link to="/">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
