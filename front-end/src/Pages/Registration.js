import React, { useState } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Container,
  Card,
  Button,
  Row,
  Col,
  FloatingLabel,
} from "react-bootstrap";

const Registration = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const emailSchema = z.string().email({ message: "Invalid email address" });
  const passwordSchema = z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear errors when user starts typing
    setErrors({
      ...errors,
      [name]: "",
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    try {
      emailSchema.parse(formData.email);
    } catch (err) {
      newErrors.email = err.errors[0].message;
      isValid = false;
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (err) {
      newErrors.password = err.errors[0].message;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      navigate("/SignUp/GettingInfo");
    }
  };

  return (
    <div className='RegistrationContainer d-flex align-items-center'>
      <Container>
        <Row className='justify-content-center'>
          <Col md={6} lg={5} xl={4}>
            <Card
              className='p-4 shadow'
              style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
            >
              <Form onSubmit={handleSubmit}>
                <h3 className='text-center mb-4'>Sign UP</h3>

                <FloatingLabel
                  controlId='emailInput'
                  label='Email'
                  className='mb-3'
                >
                  <Form.Control
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder=' '
                  />
                </FloatingLabel>
                <Form.Control.Feedback type='invalid'>
                  {errors.email}
                </Form.Control.Feedback>

                <FloatingLabel
                  className='mb-4'
                  controlId='passwordinput'
                  label='Password'
                >
                  <Form.Control
                    type='password'
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    placeholder=' '
                  />
                  <Form.Control.Feedback type='invalid' className='d-block'>
                    {errors.password}
                  </Form.Control.Feedback>
                </FloatingLabel>

                <div className='d-grid'>
                  <Button variant='primary' type='submit'>
                    Next
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Registration;
