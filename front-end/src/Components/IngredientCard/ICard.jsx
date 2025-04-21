import React from "react";
import { Card, Button } from "react-bootstrap";
import CircleChart from "../CircleChart/CircleChart";

const ICard = ({ chartData }) => {
  return (
    <Card
      className='shadow d-flex align-items-center justify-content-center'
      style={{
        width: "auto",
        height: "auto",
        margin: "2vw",
        padding: "2vh",
        backgroundColor: "var(--color-card)",
        border: "0",
      }}
    >
      <h6 style={{ color: "var(--color-primary)" }}>Dry Pasta</h6>
      <CircleChart data={chartData} thickness={5} gapSize={8} />
      <Button className='button'>Add</Button>
    </Card>
  );
};

export default ICard;
