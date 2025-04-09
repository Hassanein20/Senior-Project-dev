import React from "react";
import { Button, Container, Row } from "react-bootstrap";
import style from "./HomeSec.module.css";
import { Link } from "react-router-dom";
const HomeSec = () => {
  return (
    <div>
      <Container
        fluid
        className={`${style.Home}`}
        style={{ overflow: "auto", scrollbarWidth: "none" }}
      >
        <Row>
          <div
            className='w-50 justify-content-start'
            style={{
              marginTop: "7vh",
              marginLeft: "3vw",
            }}
          >
            <h6
              style={{
                color: "var(--color-primary)",
                textShadow: "0px 5px 5px black",
              }}
            >
              Your Journey to Better Health Starts Here
            </h6>
            <h2
              style={{
                textShadow: "0px 5px 5px black",
                color: "var(--color-secondary)",
                padding: "2vh",
              }}
            >
              Track Smarter. Eat Better. Acheive Your Goals.
            </h2>
            <p
              style={{
                color: "var(--color-white)",
                textShadow: "0px 5px 5px black",
                paddingLeft: "2vw",
              }}
            >
              Whether you're aiming to lose weight, build muscles, or explore
              diet like KETO or VEGAN, our platform calculates your exact
              calorie needs and simplifies tracking with instant micronutrient
              insights. Log meals effortlessly, visualize progress with daily
              graphs, and get personalized advice from certified dietitians.
              Start today - your goals are just a click away.
            </p>
          </div>
        </Row>
        <Button
          className='button'
          style={{ marginTop: "5vh", marginLeft: "5vw", marginBottom: "2vh" }}
          as={Link}
          to='/SignUp/GettingInfo'
        >
          Lets Start!
        </Button>
      </Container>
    </div>
  );
};

export default HomeSec;
