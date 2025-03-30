import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, Row, Col } from "react-bootstrap";
import { FormInput } from "../Components/FormInput";
import { emailSchema, passwordSchema } from "../Components/Validators";

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const validationResult = {
      email: "",
      password: "",
    };

    try {
      emailSchema.parse(formData.email);
    } catch (emailError) {
      validationResult.email = emailError.errors[0].message;
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (passwordError) {
      validationResult.password = passwordError.errors[0].message;
    }

    setErrors(validationResult);
    return !validationResult.email && !validationResult.password;
  };

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
                <h3 className='text-center mb-4'>Sign Up</h3>

                <FormInput
                  label='Email'
                  type='email'
                  name='email'
                  value={formData.email}
                  error={errors.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder=' '
                />

                <FormInput
                  label='Password'
                  type='password'
                  name='password'
                  value={formData.password}
                  error={errors.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder=' '
                  className='mb-4'
                />

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
