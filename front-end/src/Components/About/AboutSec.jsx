import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Style from "./AboutSec.module.css";
import { ReactComponent as Microsvg } from "../../Assets/Illustrations/Dietmeasure.svg";
import AboutImg from "../../Assets/AboutUs.webp";

const AboutSec = () => {
  return (
    <>
      <Container className={`${Style.About} py-5`}>
        <Row>
          <Col className={`col-lg-7`}>
            <p
              className={`ptitle d-flex justify-content-start align-items-center gap-2`}
              style={{
                fontSize: "1.2em",
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
            <h2 className={`htitle`}>
              Our Commitment to Authenticity and Excellence
            </h2>
            <p>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eum,
              accusamus! Unde neque voluptatibus necessitatibus mollitia nulla
              iure sunt nisi ut. Fuga facilis dolorum maxime voluptas architecto
              eligendi, minus asperiores accusamus? Tempora beatae at ducimus,
              asperiores eveniet repellendus eius commodi temporibus ex quidem
              optio, quo culpa itaque! Itaque tenetur deserunt autem!
            </p>
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Earum,
              doloremque consectetur odit sed esse enim minima totam et
              distinctio ipsum hic ea eius perferendis alias?
            </p>
            <button className='button mt-4'>
              Read More <i class={`bi bi-arrow-right`}></i>
            </button>
          </Col>
          <Col className={`col-lg-5 ${Style.AboutImg}`}>
            <Microsvg style={{ width: "30vw" }} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AboutSec;
