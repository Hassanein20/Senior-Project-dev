import React from "react";
import { Button, Container, Row } from "react-bootstrap";
import style from "./HomeSec.module.css";
const HomeSec = () => {
  return (
    <div>
      <Container fluid className={`${style.Home}`}>
        <Row>
          <div
            className='w-50 justify-content-start'
            style={{
              marginTop: "10vh",
              marginLeft: "5vw",
            }}
          >
            <h6
              style={{
                color: "var(--color-primary)",
                textShadow: "0px 5px 5px black",
                fontSize: "2vw",
              }}
            >
              The Best Nutrition Web App
            </h6>
            <h2
              style={{
                textShadow: "0px 5px 5px black",
                fontSize: "5vw",
                color: "var(--color-white)",
              }}
            >
              Acheive Your Goals
            </h2>
            <p
              style={{
                color: "var(--color-white)",
                textShadow: "0px 5px 5px black",
              }}
            >
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Perferendis dicta, consequuntur sed commodi alias repudiandae id
              aut quia dolorem, atque, impedit molestiae quis unde ut? Quos
              quibusdam nisi, mollitia omnis harum fugiat id nemo laboriosam
              deleniti saepe ratione corrupti! Ex amet quos eum fuga voluptatem
              voluptatibus officiis deserunt blanditiis debitis?
            </p>
            <Button className='mt-4 button'>Lets Start!</Button>
          </div>
        </Row>
      </Container>
    </div>
  );
};

export default HomeSec;
