import React from "react";
import { Container, Navbar, Nav, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import logoImage from "../../Assets/Icon.png";
import style from "./NavBar.module.css";

const NavBar = () => {
  return (
    <div>
      <Navbar expand='md' collapseOnSelect className={`${style.navbar}`}>
        <Container>
          {/* Brand Logo with proper alt text */}
          <Navbar.Brand as={Link} to='/Home'>
            <img
              src={logoImage}
              alt='Company Logo'
              width='50vw'
              className='d-inline-block align-top'
            />
          </Navbar.Brand>

          {/* Mobile Toggle Button */}
          <Navbar.Toggle aria-controls='main-navbar' />

          {/* Navigation Items */}
          <Navbar.Collapse id='main-navbar'>
            <Nav className='mx-auto '>
              <Nav.Link as={Link} to='#home' className={style.navlink}>
                Home
              </Nav.Link>
              <Nav.Link as={Link} to='#about' className={style.navlink}>
                About
              </Nav.Link>
              <Nav.Link as={Link} to='#services' className={style.navlink}>
                Services
              </Nav.Link>
              <Nav.Link as={Link} to='#menu' className={style.navlink}>
                Menu
              </Nav.Link>
              <Nav.Link as={Link} to='#contact' className={style.navlink}>
                Contact
              </Nav.Link>
            </Nav>

            <Button variant='primary' className='ms-md-3'>
              Login
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
};

export default NavBar;
