import React from "react";
import { Container, Navbar, Nav, Button, Row, Col } from "react-bootstrap";
import logoImage from "../../Assets/Icon.png";
import style from "./NavBar.module.css";
import { HashLink } from "react-router-hash-link";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";

function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`${style.themetoggle} d-flex`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <i
        className={`bi-sun-fill ${
          !isDark ? "opacity-100" : "opacity-0"
        } transition-all d-flex sun`}
        style={{ color: "rgba(255, 223, 34, 1)" }}
      ></i>
      <i
        className={`bi-moon-fill position-absolute ${
          isDark ? "opacity-100" : "opacity-0"
        } transition-all d-flex`}
      ></i>
    </button>
  );
}

const NavBar = () => {
  return (
    <div>
      <Navbar
        expand='md'
        collapseOnSelect
        style={{ position: "sticky" }}
        className={`${style.navbar}`}
      >
        <Container>
          {/* Logo */}
          <Navbar.Brand as={HashLink} to='/Home'>
            <img
              src={logoImage}
              alt='Company Logo'
              width='50vw'
              className='d-inline-block align-top'
            />
          </Navbar.Brand>

          {/* Mobile Toggle Button */}
          <Navbar.Toggle
            aria-controls='main-navbar'
            className={`${style.navbarToggle} `}
          />

          {/* Navigation Items */}
          <Navbar.Collapse id='main-navbar'>
            <Nav className='mx-auto '>
              <Nav.Link
                as={HashLink}
                to='#home'
                className={`${style.navlink} ${style.active}`}
              >
                Home
              </Nav.Link>
              <Nav.Link as={HashLink} to='#about' className={style.navlink}>
                About
              </Nav.Link>
              <Nav.Link as={HashLink} to='#services' className={style.navlink}>
                Services
              </Nav.Link>
              <Nav.Link as={HashLink} to='#menu' className={style.navlink}>
                Menu
              </Nav.Link>
              <Nav.Link as={HashLink} to='#contact' className={style.navlink}>
                Contact
              </Nav.Link>
            </Nav>

            <Row className='mt-3 mt-md-0 '>
              <Col className='d-flex justify-content-center align-items-center'>
                <Button as={Link} to='/SignUp' className={`button`}>
                  Login
                </Button>
              </Col>
              <Col className='d-flex justify-content-center align-items-center'>
                <ThemeToggleButton />
              </Col>
            </Row>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
};

export default NavBar;
