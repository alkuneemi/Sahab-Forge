import React from "react";
import "./FormField.css";

interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        <span>{label}</span> <span className="required">*</span>
      </label>
      <input id={id} {...inputProps} />
    </div>
  );
}
