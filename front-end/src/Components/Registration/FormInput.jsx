import { FloatingLabel, Form } from "react-bootstrap";

export const FormInput = ({
  label,
  type = "text",
  name,
  value,
  error,
  onChange,
  ...props
}) => (
  <FloatingLabel
    label={label}
    style={{ color: "var(--color-text)" }}
    data-bs-theme='var(--color-theme)'
    className='mb-3'
  >
    <Form.Control
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      isInvalid={!!error}
      style={{
        backgroundColor: "var(--color-lighter)",
      }}
      {...props}
    />
    <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
  </FloatingLabel>
);
