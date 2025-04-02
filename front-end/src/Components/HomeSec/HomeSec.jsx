import React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import style from "./HomeSec.module.css";
const HomeSec = () => {
  return (
    <div>
      <Container fluid className={`${style.Home}`}>
        <Row>
          <Col className='col-lg-6 col-md-6 col-12'></Col>
          <div className='w-95'>
            <h6
              className='fs-4'
              style={{
                color: "var(--color-primary)",
                textShadow: "0px 5px 5px black",
              }}
            >
              Welcome To The Best Nutrition Web App
            </h6>
            <h2
              className='fs-1'
              style={{ color: "white", textShadow: "0px 5px 5px black" }}
            >
              Acheive Your Goals
            </h2>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugiat
              sequi veritatis beatae. Earum molestiae vitae neque ea. Vero,
              harum asperiores. Veritatis porro voluptatibus at voluptates
              deserunt ipsam ratione blanditiis a accusamus odio dolor optio
              exercitationem facilis repellat ipsa corporis atque, eum
              repudiandae quo impedit! Dolore molestias quo, hic soluta porro
              quos ullam. Vel cupiditate consectetur, tempora molestiae sed id
              quisquam asperiores nemo at quo in ducimus, blanditiis corrupti
              obcaecati et ea odio officia aperiam iusto enim voluptates quae
              voluptatum autem! Harum quidem libero quod possimus repellat, id
              autem reiciendis minima. Quas incidunt ad dolores? Necessitatibus
              asperiores deserunt commodi accusamus atque!
            </p>
            <Button className='mt-4 button'>Lets Start!</Button>
          </div>
        </Row>
      </Container>
    </div>
  );
};

export default HomeSec;
