/**
 * Reusable Card component — dark glassmorphism panel.
 */
export default function Card({
  children,
  style: extraStyle = {},
  hoverable = false,
  className = '',
  ...rest
}) {
  const base = {
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const hoverStyle = hoverable
    ? { cursor: 'pointer', ':hover': { borderColor: 'var(--color-border-light)' } }
    : {};

  return (
    <div
      style={{ ...base, ...hoverStyle, ...extraStyle }}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
}
