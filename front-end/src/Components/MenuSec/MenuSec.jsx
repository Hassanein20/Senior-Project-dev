import React, { useState } from "react";
import { Card, Container, Row } from "react-bootstrap";
import Style from "./MenuSec.module.css";
import CircleChart from "../CircleChart/CircleChart";

const MenuSec = () => {
  const [chartData] = useState([
    { value: 23.09, color: "#ff6384", label: "Protein" },
    { value: 0, color: "#36a2eb", label: "Carbs" },
    { value: 1.24, color: "#ffce56", label: "Fats" },
  ]);

  return (
    <Container fluid className={`${Style.Screen}`}>
      <Row className={` justify-content-center`}>
        <h2
          className={`d-inline-block`}
          style={{
            width: "auto",
            marginTop: "2vh",
            color: "var(--color-primary)",
            borderBottom: "solid var(--color-secondary) 2px",
          }}
        >
          Menu
        </h2>
      </Row>
      <Row>
        <Card
          className='shadow d-flex align-items-center justify-content-center'
          style={{
            width: "30vw",
            margin: "2vw",
            padding: "2vh",
            backgroundColor: "var(--color-card)",
          }}
        >
          <h6 style={{ color: "var(--color-primary)" }}>
            Skinless Chicken Breast
          </h6>
          <CircleChart data={chartData} thickness={5} gapSize={8} />
        </Card>
      </Row>
    </Container>
  );
};

export default MenuSec;
