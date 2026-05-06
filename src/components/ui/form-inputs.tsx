'use client';

import React from 'react';
import { INPUT_STYLES, FORM_STYLES, FOCUS_RINGS } from '@/lib/styling-constants';

// ===== TEXT INPUT =====
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random()}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block font-label text-label text-text-heading mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${error ? INPUT_STYLES.error : INPUT_STYLES.text} ${className || ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-error text-sm mt-1 font-label">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-text-muted text-sm mt-1 font-body-default">{helperText}</p>
        )}
      </div>
    );
  }
);
TextInput.displayName = 'TextInput';

// ===== NUMBER INPUT =====
interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  min?: number;
  max?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || `number-${Math.random()}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block font-label text-label text-text-heading mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="number"
          id={inputId}
          className={`${error ? INPUT_STYLES.error : INPUT_STYLES.number} ${className || ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-error text-sm mt-1 font-label">
            {error}
          </p>
        )}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';

// ===== CHECKBOX =====
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random()}`;
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`${FORM_STYLES.checkbox} ${className || ''}`}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="font-body-default text-body-default text-text-body cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// ===== RADIO BUTTON =====
interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random()}`;
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={`${FORM_STYLES.radio} ${className || ''}`}
          {...props}
        />
        {label && (
          <label htmlFor={radioId} className="font-body-default text-body-default text-text-body cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Radio.displayName = 'Radio';

// ===== SELECT =====
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random()}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block font-label text-label text-text-heading mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`${error ? 'border-error focus:ring-error/50' : ''} ${FORM_STYLES.select} ${className || ''}`}
          aria-invalid={!!error}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-error text-sm mt-1 font-label">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ===== TEXTAREA =====
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random()}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block font-label text-label text-text-heading mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${error ? 'border-error focus:ring-error/50' : ''} ${FORM_STYLES.textarea} ${className || ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-error text-sm mt-1 font-label">
            {error}
          </p>
        )}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';

export default {
  TextInput,
  NumberInput,
  Checkbox,
  Radio,
  Select,
  TextArea,
};
