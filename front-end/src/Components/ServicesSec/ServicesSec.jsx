import React from "react";
import { Container, Row } from "react-bootstrap";
import style from "./ServicesSec.module.css";
import Tracking from "../../Assets/Tracking.png";

const ServicesSec = () => {
  return (
    <>
      <Container
        fluid
        className={`${style.Screen}`}
        style={{ overflow: "auto", paddingTop: "8vh" }}
      >
        <Row className='justify-content-end'>
          <div className={`${style.Content}`}>
            <h6
              style={{
                color: "var(--color-primary)",
                fontWeight: "bolder",
                borderBottom: "solid var(--color-secondary) 2px",
                marginBottom: "2vh",
              }}
              className='d-inline-block'
            >
              Our Services
            </h6>
          </div>
        </Row>
        <Row className='justify-content-end'>
          <div className={`${style.Content}`}>
            <h3 style={{ color: "var(--color-secondary)" }}>
              Tools Designed for Your Success
            </h3>
          </div>
        </Row>
        <Row className={`d-flex justify-content-end ${style.image}`}>
          <img src={Tracking} alt='Traking' style={{ width: "30vw" }} />
        </Row>
      </Container>
    </>
  );
};

export default ServicesSec;
