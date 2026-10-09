/**
 * Reusable Button component.
 * Variants: primary | secondary | danger | ghost
 * Sizes:    sm | md | lg
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style: extraStyle = {},
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.55 : 1,
    transition: 'background 0.18s, transform 0.1s, box-shadow 0.18s',
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  };

  const sizes = {
    sm: { padding: '0.35rem 0.85rem', fontSize: '0.8rem' },
    md: { padding: '0.55rem 1.25rem', fontSize: '0.9rem' },
    lg: { padding: '0.75rem 1.75rem', fontSize: '1rem'  },
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      color: '#fff',
      boxShadow: '0 2px 12px rgba(59,130,246,0.35)',
    },
    secondary: {
      background: 'var(--color-bg-card)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      color: '#fff',
      boxShadow: '0 2px 10px rgba(239,68,68,0.35)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-brand-light)',
      border: '1px solid var(--color-border)',
    },
  };

  const focusClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';
  const combinedClass = rest.className ? `${focusClasses} ${rest.className}` : focusClasses;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClass}
      style={{ ...base, ...sizes[size], ...variants[variant], ...extraStyle }}
      {...rest}
    >
      {loading && (
        <span
          style={{
            width: '0.9em',
            height: '0.9em',
            borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            display: 'inline-block',
            animation: 'spin 0.75s linear infinite',
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
