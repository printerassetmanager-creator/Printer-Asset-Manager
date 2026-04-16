import React from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function formatYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CustomDatePicker({ selected, onChange, placeholderText, ...props }) {
  return (
    <DatePicker
      selected={selected ? new Date(selected) : null}
      onChange={(date) => onChange(date ? formatYmd(date) : '')}
      dateFormat="dd-MM-yyyy"
      placeholderText={placeholderText || "DD-MM-YYYY"}
      className="field-input"
      {...props}
    />
  );
}
