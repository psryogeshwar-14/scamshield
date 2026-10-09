import { forwardRef } from 'react';

/**
 * Reusable Input / Textarea component.
 * Pass multiline={true} to render a <textarea>.
 */
const Input = forwardRef(function Input(
  {
    label,
    id,
    error,
    hint,
    multiline = false,
    rows = 5,
    style: extraStyle = {},
    ...rest
  },
  ref,
) {
  const base = {
    width: '100%',
    padding: '0.65rem 0.9rem',
    backgroundColor: 'var(--color-bg-primary)',
    border: `1px solid ${error ? 'var(--color-high-risk)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    resize: multiline ? 'vertical' : undefined,
    fontFamily: 'inherit',
    ...extraStyle,
  };

  const field = multiline
    ? <textarea id={id} ref={ref} rows={rows} style={base} {...rest} />
    : <input    id={id} ref={ref} style={base} {...rest} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </label>
      )}
      {field}
      {hint && !error && (
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: '0.78rem', color: 'var(--color-high-risk)' }} role="alert">{error}</p>
      )}
    </div>
  );
});

export default Input;
