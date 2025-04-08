import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, Row, Col } from "react-bootstrap";
import { FormInput } from "../Components/Registration/FormInput";
import { RadioGroup } from "../Components/Registration/RadioGroup";
import { DatePicker } from "../Components/Registration/DatePicker";
import Background from "./../Assets/GettingInfo.webp";

const GettingInfo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    date: { day: "", month: "", year: "" },
    weight: "",
    height: "",
    gender: "Male",
    activityLevel: 0,
  });

  const [errors, setErrors] = useState({});

  const activityLevels = [
    "Sedentary: No or little exercise",
    "Light: Sports 1-3 days/week",
    "Moderate: Sports 3-5 days/week",
    "Active: Sports 6-7 days/week",
    "Very Active: Training twice a day",
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      date: { ...prev.date, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, date: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (!/^[a-zA-Z\s]{2,}$/.test(formData.fullName)) {
      newErrors.fullName = "Invalid name format";
    }

    if (!formData.date.day || !formData.date.month || !formData.date.year) {
      newErrors.date = "Please select complete birthdate";
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // const birthDate = new Date(
    //   formData.date.year,
    //   formData.date.month - 1,
    //   formData.date.day
    // );

    navigate("/User", { state: formData });
  };

  return (
    <div
      className='GettingInfoContainer d-flex align-items-center'
      style={{ backgroundImage: `url(${Background})` }}
    >
      <Container>
        <Row className='justify-content-center'>
          <Col md={8} lg={6}>
            <Card
              className='p-4 form-shadow'
              style={{ backgroundColor: "var(--color-card)" }}
            >
              <Form onSubmit={handleSubmit}>
                <FormInput
                  label='Full Name'
                  name='fullName'
                  value={formData.fullName}
                  error={errors.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  autoFocus
                  required
                  placeholder=''
                />

                <DatePicker
                  date={formData.date}
                  error={errors.date}
                  onDateChange={handleDateChange}
                />

                <Row className='mb-3'>
                  {["weight", "height"].map((field) => (
                    <Col key={field} md={6}>
                      <FormInput
                        label={`${
                          field.charAt(0).toUpperCase() + field.slice(1)
                        } (${field === "weight" ? "kg" : "cm"})`}
                        type='number'
                        name={field}
                        value={formData[field]}
                        onChange={(e) => handleChange(field, e.target.value)}
                        min={field === "weight" ? 40 : 100}
                        max={field === "weight" ? 200 : 300}
                        step='0.1'
                        required
                        placeholder=''
                      />
                    </Col>
                  ))}
                </Row>

                <RadioGroup
                  className={"d-flex flex-column align-items-center"}
                  label='Gender'
                  name='gender'
                  options={[
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                  ]}
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                />

                <Form.Group className='mb-4'>
                  <Form.Label
                    style={{ color: "var(--color-text)", fontWeight: "bolder" }}
                  >
                    Activity Level: {activityLevels[formData.activityLevel]}
                  </Form.Label>
                  <Form.Range
                    className='custom-range ActivityLevel'
                    onChange={(e) => {
                      handleChange("activityLevel", e.target.value);
                    }}
                    min='0'
                    max='4'
                    defaultValue='0'
                  />
                </Form.Group>

                <div className='d-grid'>
                  <Button className='button' type='submit'>
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
