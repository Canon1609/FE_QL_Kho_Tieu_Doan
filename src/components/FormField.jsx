export function FieldError({ children }) { return children ? <small className="field-error" role="alert">{children}</small> : null }
export function HelperText({ children }) { return children ? <small className="field-help">{children}</small> : null }
export function Field({ label, required = false, help, error, children, className = '' }) {
  return <div className={`form-field ${className}`}><label><span>{label}{required && <span className="field-required" aria-hidden="true"> *</span>}</span>{children}</label><HelperText>{help}</HelperText><FieldError>{error}</FieldError></div>
}
export function CheckboxField({ label, checked, onChange, help, error }) {
  return <div className="checkbox-field"><label><input type="checkbox" checked={checked} onChange={onChange} /><span>{label}</span></label><HelperText>{help}</HelperText><FieldError>{error}</FieldError></div>
}
