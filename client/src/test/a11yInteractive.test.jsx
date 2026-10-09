import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HistoryPage from '../pages/HistoryPage';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import RiskBadge from '../components/RiskBadge';
import ToastProvider from '../context/ToastProvider';
import api from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    getHistory: vi.fn(),
    deleteHistoryItem: vi.fn(),
  },
}));

describe('Interactive Accessibility & Screen Reader Behavior', () => {
  it('LoadingSpinner provides polite aria-live status and sr-only announcement', () => {
    render(<LoadingSpinner message="Evaluating 11-point threat model..." />);

    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(/Evaluating 11-point threat model/i)).toBeInTheDocument();
  });

  it('ErrorAlert renders with role="alert" for immediate screen reader priority', () => {
    const onDismiss = vi.fn();
    render(<ErrorAlert title="Security Malfunction" message="Could not complete heuristic analysis." onDismiss={onDismiss} />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/Security Malfunction/i)).toBeInTheDocument();
  });

  it('RiskBadge communicates risk without relying exclusively on color', () => {
    const { rerender } = render(<RiskBadge riskLevel="high_risk" />);

    let badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Risk assessment: High Risk');
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument(); // icon indicator

    rerender(<RiskBadge riskLevel="safe" />);
    badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Risk assessment: Safe');
    expect(screen.getByText('Safe')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument(); // icon indicator
  });

  it('Delete confirmation modal traps and handles Escape key dismissal', async () => {
    const user = userEvent.setup();
    api.getHistory.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'scan-to-delete-1',
          inputType: 'url',
          userInput: 'https://malicious-threat-item.xyz',
          riskLevel: 'high_risk',
          threatType: 'phishing',
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, totalPages: 1, page: 1, limit: 10 },
    });

    render(
      <MemoryRouter>
        <ToastProvider>
          <HistoryPage />
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('https://malicious-threat-item.xyz')).toBeInTheDocument();
    });

    // Open delete dialog
    const deleteButton = screen.getByRole('button', { name: /Delete this scan/i });
    await user.click(deleteButton);

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText(/Delete Security Dossier\?/i)).toBeInTheDocument();

    // Dismiss using Escape key
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
