/**
 * ErrorAlert — dismissible error/warning banner.
 * severity: "error" | "warning" | "info"
 */
const SEVERITY_CONFIG = {
  error:   { color: 'var(--color-high-risk)',   bg: 'var(--color-high-risk-bg)',   border: '#991b1b',  icon: '✕' },
  warning: { color: 'var(--color-suspicious)',  bg: 'var(--color-suspicious-bg)',  border: '#92400e',  icon: '⚠' },
  info:    { color: 'var(--color-brand-light)', bg: 'rgba(59,130,246,0.08)',        border: '#1e40af',  icon: 'ℹ' },
};

export default function ErrorAlert({
  title,
  message,
  severity = 'error',
  onDismiss,
}) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.error;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.9rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${cfg.border}`,
        backgroundColor: cfg.bg,
        color: cfg.color,
        animation: 'fade-in 0.2s ease-out',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }}>
        {cfg.icon}
      </span>
      <div style={{ flex: 1 }}>
        {title && (
          <p style={{ fontWeight: 700, marginBottom: '0.2rem', fontSize: '0.9rem' }}>{title}</p>
        )}
        <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.4 }}>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: cfg.color,
            opacity: 0.7,
            fontSize: '1rem',
            flexShrink: 0,
            lineHeight: 1,
            padding: '0.1rem',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
