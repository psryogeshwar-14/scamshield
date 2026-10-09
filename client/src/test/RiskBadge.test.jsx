import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskBadge from '../components/RiskBadge';

describe('RiskBadge component', () => {
  it('renders HIGH risk badge with label, icon, and accessible attributes', () => {
    render(<RiskBadge riskLevel="high_risk" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Risk assessment: High Risk');
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('handles uppercase HIGH alias gracefully', () => {
    render(<RiskBadge riskLevel="HIGH" />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('renders SUSPICIOUS risk badge with warning icon', () => {
    render(<RiskBadge riskLevel="suspicious" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Suspicious')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('renders MEDIUM risk alias as Suspicious', () => {
    render(<RiskBadge riskLevel="medium" />);
    expect(screen.getByText('Suspicious')).toBeInTheDocument();
  });

  it('renders SAFE risk badge with checkmark icon', () => {
    render(<RiskBadge riskLevel="safe" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Safe')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders LOW risk badge with low risk label', () => {
    render(<RiskBadge riskLevel="low" />);
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('handles unknown or missing risk level safely', () => {
    render(<RiskBadge riskLevel="unknown_level" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
