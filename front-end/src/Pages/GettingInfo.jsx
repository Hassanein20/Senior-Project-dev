import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Form,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import { FormInput } from "../Components/Registration/FormInput";
import { RadioGroup } from "../Components/Registration/RadioGroup";
import { DatePicker } from "../Components/Registration/DatePicker";
import Background from "./../Assets/GettingInfo.webp";
import {
  emailSchema,
  passwordSchema,
} from "../Components/Registration/Validators";

const GettingInfo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    date: { day: "", month: "", year: "" },
    weight: "",
    height: "",
    gender: "Male",
    activityLevel: 0,
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    fullName: "",
    date: "",
  });

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

  const validateCredentials = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    try {
      emailSchema.parse(formData.email);
    } catch (error) {
      newErrors.email = error.errors[0].message;
      isValid = false;
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (error) {
      newErrors.password = error.errors[0].message;
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateUserInfo = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (!/^[a-zA-Z\s]{2,}$/.test(formData.fullName)) {
      newErrors.fullName = "Invalid name format";
    }

    if (!formData.date.day || !formData.date.month || !formData.date.year) {
      newErrors.date = "Please select complete birthdate";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialSubmit = (e) => {
    e.preventDefault();
    if (validateCredentials()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (validateUserInfo()) {
      navigate("/User", { state: formData });
    }
  };

  return (
    <div
      className='GettingInfoContainer d-flex align-items-center'
      style={{ backgroundImage: `url(${Background})` }}
    >
      {step === 1 && (
        <Modal
          show
          onHide={() => navigate(-1)}
          backdrop='static'
          keyboard={false}
          centered
        >
          <Form onSubmit={handleCredentialSubmit}>
            <Modal.Header className='d-flex justify-content-center align-items-center'>
              <Modal.Title>Create a New Account</Modal.Title>
            </Modal.Header>
            <Modal.Body>
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
              />

              <Form.Check
                type='checkbox'
                label='Remember Me?'
                className='my-2 fs-7'
              />
            </Modal.Body>
            <Modal.Footer className='d-flex justify-content-center align-items-center'>
              <Button className='button' type='submit'>
                Next
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {step === 2 && (
        <Container>
          <Row className='justify-content-center'>
            <Col md={8} lg={6}>
              <Card
                className='p-4 form-shadow'
                style={{ backgroundColor: "var(--color-card)" }}
              >
                <Form onSubmit={handleFinalSubmit}>
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
                      style={{
                        color: "var(--color-text)",
                        fontWeight: "bolder",
                      }}
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
                      value={formData.activityLevel}
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
      )}
    </div>
  );
};

export default GettingInfo;
