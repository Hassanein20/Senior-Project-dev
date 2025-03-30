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
  <FloatingLabel label={label} className='mb-3'>
    <Form.Control
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      isInvalid={!!error}
      {...props}
    />
    <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
  </FloatingLabel>
);
