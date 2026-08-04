import { AlertCircle } from 'lucide-react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
}

export function Field({ label, error, helper, id, ...props }: FieldProps) {
  const fieldId = id ?? `field-${props.name ?? label.toLowerCase().replaceAll(' ', '-')}`
  const messageId = `${fieldId}-message`
  return (
    <label className="field-group" htmlFor={fieldId}>
      <span className="field-label">{label}</span>
      <input
        id={fieldId}
        className="field-control"
        aria-invalid={Boolean(error)}
        aria-describedby={error || helper ? messageId : undefined}
        {...props}
      />
      {error ? (
        <span id={messageId} className="error-text">
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </span>
      ) : helper ? (
        <span id={messageId} className="helper-text">
          {helper}
        </span>
      ) : null}
    </label>
  )
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helper?: string
}

export function TextareaField({ label, error, helper, id, ...props }: TextareaFieldProps) {
  const fieldId = id ?? `field-${props.name ?? label.toLowerCase().replaceAll(' ', '-')}`
  const messageId = `${fieldId}-message`
  return (
    <label className="field-group" htmlFor={fieldId}>
      <span className="field-label">{label}</span>
      <textarea
        id={fieldId}
        className="field-control"
        aria-invalid={Boolean(error)}
        aria-describedby={error || helper ? messageId : undefined}
        {...props}
      />
      {error ? (
        <span id={messageId} className="error-text">
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </span>
      ) : helper ? (
        <span id={messageId} className="helper-text">
          {helper}
        </span>
      ) : null}
    </label>
  )
}
