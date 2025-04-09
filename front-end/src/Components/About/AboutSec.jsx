import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { ReactComponent as Microsvg } from "../../Assets/Illustrations/Dietmeasure.svg";
import AboutImg from "../../Assets/AboutUs.webp";

const AboutSec = () => {
  return (
    <Container
      style={{
        backgroundColor: "var(--color-bf)",
        height: "100vh",
        overflow: "auto",
      }}
    >
      <Row>
        <Col className={`col-lg-7`}>
          <p
            className={` d-flex justify-content-start align-items-center gap-2`}
            style={{
              color: "var(--color-primary)",
              fontWeight: "bolder",
            }}
          >
            <img
              src={AboutImg}
              style={{ width: "10vw", marginBottom: "2.5vh" }}
              alt='AboutUs'
            />
            About Us
          </p>
          <h2>Where Science Meets Support</h2>
          <p>
            We're more than a calorie tracker, we're your nutrition ally.
            Combining cutting-edge tech with expert dietitian guidance, we
            empower you to make informed choices, one meal at a time. Whether
            you're a busy parent, an athlete, or simply curious about micros,
            we're here to turn confusion into clarity and goals into achievments
          </p>
          <p>
            At NutriSync, we believe sustainable health is a team effort. That's
            why we've built a space where users and dietitians callaborate
            seamlessly, sharing insights, celebrating milestones, and refning
            strategies. Join a community where progress is personal, support is
            instant, and every bite brings you closer to your best{" "}
            <span style={{ color: "var(--color-secondary)" }}>self</span>.
          </p>
          <button className='button mt-4'>
            Read More <i class={`bi bi-arrow-right`}></i>
          </button>
        </Col>
        <Col className={`col-lg-5 `}>
          <Microsvg style={{ width: "30vw" }} />
        </Col>
      </Row>
    </Container>
  );
};

export default AboutSec;
