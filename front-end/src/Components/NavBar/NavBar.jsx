import { React, useEffect, useState } from "react";
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
  const [Active, SetActive] = useState("Home");

  useEffect(() => {
    const HandleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) SetActive(hash);
    };

    window.addEventListener("hashchange", HandleHashChange);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            SetActive(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: "-30% 0px -60% 0px" }
    );

    const sections = Array.from(document.querySelectorAll("section[id]")).sort(
      (a, b) => a.offsetTop - b.offsetTop
    );
    sections.forEach((section) => observer.observe(section));

    const checkInitialSection = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      const active = sections.find(
        (section) =>
          section.offsetTop <= scrollPos &&
          section.offsetTop + section.offsetHeight > scrollPos
      );
      if (active) SetActive(active.id);
    };

    // Wait for page to load before checking
    window.addEventListener("load", checkInitialSection);
    checkInitialSection();

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", HandleHashChange);
      window.removeEventListener("load", checkInitialSection);
    };
  }, []);

  const scrollWithOffset = (el) => {
    const yOffset = -80; // Adjust for header height
    const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <Navbar expand='md' collapseOnSelect className={`${style.navbar}`}>
      <Container>
        {/* Logo */}
        <Navbar.Brand href='#Home'>
          <img
            src={logoImage}
            alt='Company Logo'
            width='50vw'
            className='d-inline-block align-top'
            scroll={scrollWithOffset}
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
              href='#Home'
              className={`${style.navlink} ${
                Active === "Home" ? style.active : ""
              }`}
              scroll={scrollWithOffset}
            >
              <i className='bi bi-house-heart-fill fs-5'></i> Home
            </Nav.Link>
            <Nav.Link
              href='#About'
              className={`${style.navlink} ${
                Active === "About" ? style.active : ""
              }`}
              scroll={scrollWithOffset}
            >
              <i className='bi bi-info-lg fs-5'></i> About
            </Nav.Link>
            <Nav.Link
              href='#Services'
              className={`${style.navlink} ${
                Active === "Services" ? style.active : ""
              }`}
              scroll={scrollWithOffset}
            >
              <i className='bi bi-clipboard-heart fs-5'></i> Services
            </Nav.Link>
            <Nav.Link
              href='#Menu'
              className={`${style.navlink} ${
                Active === "Menu" ? style.active : ""
              }`}
              scroll={scrollWithOffset}
            >
              <i class='bi bi-menu-down fs-5'></i> Menu
            </Nav.Link>
            <Nav.Link
              href='#Contact'
              className={`${style.navlink} ${
                Active === "Contact" ? style.active : ""
              }`}
              scroll={scrollWithOffset}
            >
              <i class='bi bi-globe-europe-africa fs-5'></i> Contact
            </Nav.Link>
          </Nav>

          <Row className='mt-3 mt-md-0 '>
            <Col className='d-flex justify-content-center align-items-center'>
              <Button
                as={Link}
                to='/SignUp'
                className={`button`}
                style={{ fontSize: "10px" }}
              >
                SignIn
              </Button>
            </Col>
            <Col className='d-flex justify-content-center align-items-center'>
              <ThemeToggleButton />
            </Col>
          </Row>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
