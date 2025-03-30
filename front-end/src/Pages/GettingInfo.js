import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Button,
  Container,
  Card,
  Row,
  Col,
  FloatingLabel,
} from "react-bootstrap";

const GettingInfo = () => {
  const [birthdate, setBirthdate] = useState("");
  const [level, setLevel] = useState("Sedentary");
  const [gender, setGender] = useState("Male");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [age, setAge] = useState(0);
  const navigate = useNavigate();

  // Date selection logic
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2015 - 1900 + 1 }, (_, i) => 1900 + i);
  const [days, setDays] = useState(Array.from({ length: 31 }, (_, i) => i + 1));

  useEffect(() => {
    if (month && year) {
      const daysInMonth = new Date(year, month, 0).getDate();
      setDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
      if (day > daysInMonth) setDay("");
    }
  }, [month, year, day]);

  const handleDateSubmit = (e) => {
    e.preventDefault();
    if (!day || !month || !year) {
      setError("Please select all date fields");
      return;
    }
    setError("");
    setBirthdate(new Date(year, month - 1, day));
  };

  const HandleLevel = (e) => {
    const value = parseInt(e.target.value);
    const levels = ["Sedentary", "Light", "Moderate", "Active", "Very Active"];
    setLevel(levels[value] || "Sedentary");
  };

  const handleGender = (e) => {
    setGender(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!day || !month || !year) {
      setError("Please Fill all Date fields");
      return;
    }

    // Create birthdate Date object
    const birthDate = new Date(year, month - 1, day); // Month is 0-indexed
    const today = new Date();

    // Calculate age
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      calculatedAge--;
    }

    setAge(calculatedAge);
    navigate("/User");
  };

  return (
    <div className='GettingInfoContainer d-flex align-items-center'>
      <Container>
        <Row className='justify-content-center'>
          <Col md={8} lg={6}>
            <Card
              className='p-4 shadow'
              style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
            >
              <Form onSubmit={handleSubmit}>
                {/* Full Name */}
                <FloatingLabel
                  className='mb-3'
                  controlId='NameInput'
                  label='Full Name'
                >
                  <Form.Control
                    type='text'
                    placeholder=' '
                    autoFocus
                    required
                  />
                </FloatingLabel>
                {/* Date Picker */}
                <Row className='g-2 my-4'>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Select
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                      >
                        <option value=''>Day</option>
                        {days.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                      >
                        <option value=''>Month</option>
                        {months.map((m, i) => (
                          <option key={m} value={i + 1}>
                            {m}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      >
                        <option value=''>Year</option>
                        {years.reverse().map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                {error && <div className='text-danger mb-3'>{error}</div>}
                {/* Weigt & Height */}
                <Row className='mb-3'>
                  <Col md={6}>
                    <FloatingLabel
                      label='Weight'
                      controlId='WeightInput'
                      className='mb-3'
                    >
                      <Form.Control
                        type='number'
                        step='0.1'
                        min='0'
                        max='200'
                        placeholder=''
                        required
                      />
                    </FloatingLabel>
                  </Col>
                  <Col md={6}>
                    <FloatingLabel
                      label='Height'
                      controlId='HeightInput'
                      className='mb-3'
                    >
                      <Form.Control
                        type='number'
                        step='0.1'
                        min='0'
                        max='300'
                        placeholder=''
                        required
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                {/* Gender Selection */}
                <Form.Group className='mb-3 d-flex flex-column align-items-center'>
                  <Form.Label>Gender</Form.Label>
                  <div className='d-flex gap-3'>
                    <Form.Check
                      type='radio'
                      label='Male'
                      value='Male'
                      checked={gender === "Male"}
                      onChange={handleGender}
                    />
                    <Form.Check
                      type='radio'
                      label='Female'
                      value='Female'
                      checked={gender === "Female"}
                      onChange={handleGender}
                    />
                  </div>
                </Form.Group>
                {/* Activity Level Slider */}
                <Form.Group className='mb-4'>
                  <Form.Label>Activity Level: {level}</Form.Label>
                  <Form.Range
                    min='0'
                    max='4'
                    defaultValue='0'
                    onChange={HandleLevel}
                    className='ActivityLevel'
                  />
                </Form.Group>
                {/* Submit Button */}
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

export default GettingInfo;
