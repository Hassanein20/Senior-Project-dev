import { Form } from "react-bootstrap";

export const RadioGroup = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  className,
}) => (
  <Form.Group className={`mb-3 ${className}`}>
    <Form.Label>{label}</Form.Label>
    <div className='d-flex gap-3'>
      {options.map((option) => (
        <Form.Check
          key={option.value}
          type='radio'
          label={option.label}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={onChange}
        />
      ))}
    </div>
    {error && <div className='text-danger mt-1'>{error}</div>}
  </Form.Group>
);
