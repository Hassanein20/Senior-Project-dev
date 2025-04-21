import { React, useState } from "react";
import Style from "./Standard.module.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import NutritionCard from "../Graph/NutritionCard";
import ICard from "../IngredientCard/ICard";

const Standard = () => {
  let Calories = 4000;
  let Left = 4000;
  let Goal = "Gain Weight";
  let CurrentWeight = 83.4;
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const data = [
    { day: "Monday", calories: 3500, protein: 120, carbs: 250, fats: 70 },
    { day: "Tuesday", calories: 3800, protein: 150, carbs: 200, fats: 80 },
    { day: "Wednesday", calories: 3200, protein: 130, carbs: 220, fats: 60 },
    { day: "Thursday", calories: 3000, protein: 140, carbs: 210, fats: 75 },
    { day: "Friday", calories: 4000, protein: 160, carbs: 260, fats: 90 },
    { day: "Saturday", calories: 4500, protein: 180, carbs: 300, fats: 100 },
    { day: "Sunday", calories: 3700, protein: 155, carbs: 240, fats: 85 },
  ];

  const [chartData] = useState([
    { value: 13, color: "#ff6384", label: "Protein" },
    { value: 74.7, color: "#36a2eb", label: "Carbs" },
    { value: 1.51, color: "#ffce56", label: "Fats" },
  ]);

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        centered
        dialogClassName='custom-modal'
      >
        <Modal.Header closeButton>
          <Modal.Title>Search Items</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Search Bar */}
          <Form.Control
            type='text'
            placeholder='Search items...'
            className='mb-3'
          />

          {/* Cards Container */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <ICard chartData={chartData} />
          </div>
        </Modal.Body>
      </Modal>

      <Container
        fluid
        className={`${Style.Screen}`}
        style={{ padding: "5vh", overflow: "auto", zIndex: "1" }}
      >
        <Row>
          <Col>
            <h2>Welcome,</h2>
          </Col>
          <Col className='d-flex justify-content-end align-items-center'>
            <p style={{ fontWeight: "bold" }}>
              {new Date().toString().slice(0, 15)}
            </p>
          </Col>
        </Row>
        <Row className='g-3'>
          <Col md={12} lg={6}>
            <Card
              className='p-3'
              style={{ backgroundColor: "var(--color-card)", width: "50%" }}
            >
              <p>
                Your Goal: <span style={{ fontWeight: "bolder" }}>{Goal}</span>
              </p>
              <p>
                Daily Calories Needed:{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  {Calories}
                </span>
              </p>
              <p>
                Calories Left:{" "}
                <span style={{ color: "var(--color-secondary)" }}>{Left}</span>
              </p>
              <p>
                Current Weight:{" "}
                <span style={{ color: "var(--color-gray)" }}>
                  {CurrentWeight}
                </span>
              </p>
            </Card>
            <Button
              className={`button`}
              style={{ margin: "2vw", width: "auto", marginLeft: "0px" }}
              onClick={handleShow}
            >
              Add Ingredients
            </Button>
          </Col>
          <Col md={12} lg={6}>
            <NutritionCard
              title='Calories'
              dataKey='calories'
              color='#8884d8'
              data={data}
              unit='kcal'
            />
          </Col>
        </Row>
        <Row></Row>
      </Container>
    </>
  );
};

export default Standard;
