import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SafetyActionsPage from '../pages/SafetyActionsPage';
import api from '../api/client';
import ToastProvider from '../context/ToastProvider';

vi.mock('../api/client', () => ({
  default: {
    getHistoryById: vi.fn(),
    updateRecommendation: vi.fn(),
  },
}));

function renderSafetyActionsPage(id = 'test-scan-123') {
  return render(
    <MemoryRouter initialEntries={[`/safety/${id}`]}>
      <ToastProvider>
        <Routes>
          <Route path="/safety/:id" element={<SafetyActionsPage />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('SafetyActionsPage Component', () => {
  const sampleScan = {
    id: 'test-scan-123',
    inputType: 'message',
    userInput: 'URGENT: Bank account suspended. Share OTP now.',
    riskLevel: 'high_risk',
    threatType: 'otp_scam',
    summary: 'Phishing attempt soliciting one-time security passcode.',
    safetyRecommendations: [
      { id: 'rec-1', action: 'Do NOT share OTP with the caller', completed: false },
      { id: 'rec-2', action: 'Change your net banking password immediately', completed: false },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially while fetching dossier', () => {
    api.getHistoryById.mockReturnValueOnce(new Promise(() => {})); // pending
    renderSafetyActionsPage();

    expect(screen.getAllByText(/Retrieving safety protocol/i)[0]).toBeInTheDocument();
  });

  it('renders error state when API request fails', async () => {
    api.getHistoryById.mockRejectedValueOnce(new Error('Dossier record not found'));
    renderSafetyActionsPage();

    await waitFor(() => {
      expect(screen.getByText(/Dossier record not found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to threat scanner/i })).toBeInTheDocument();
    });
  });

  it('renders safety action items and progress bar accurately', async () => {
    api.getHistoryById.mockResolvedValueOnce({
      success: true,
      data: sampleScan,
    });

    renderSafetyActionsPage();

    await waitFor(() => {
      expect(screen.getByText(/Interactive Defense Checklist/i)).toBeInTheDocument();
      expect(screen.getByText(/Do NOT share OTP with the caller/i)).toBeInTheDocument();
      expect(screen.getByText(/Change your net banking password immediately/i)).toBeInTheDocument();
      expect(screen.getByText(/0 of 2 defensive measures executed/i)).toBeInTheDocument();
    });
  });

  it('toggles an action status and calls updateRecommendation API', async () => {
    const user = userEvent.setup();
    api.getHistoryById.mockResolvedValueOnce({
      success: true,
      data: sampleScan,
    });
    api.updateRecommendation.mockResolvedValueOnce({ success: true });

    renderSafetyActionsPage();

    await waitFor(() => {
      expect(screen.getByText(/Do NOT share OTP with the caller/i)).toBeInTheDocument();
    });

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');

    await user.click(firstCheckbox);

    expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');
    expect(api.updateRecommendation).toHaveBeenCalledWith('test-scan-123', 'rec-1', true);
    expect(screen.getByText(/1 of 2 defensive measures executed/i)).toBeInTheDocument();
  });

  it('reverts optimistic checkbox state when updateRecommendation API fails', async () => {
    const user = userEvent.setup();
    api.getHistoryById.mockResolvedValueOnce({
      success: true,
      data: sampleScan,
    });
    api.updateRecommendation.mockRejectedValueOnce(new Error('Network error syncing status'));

    renderSafetyActionsPage();

    await waitFor(() => {
      expect(screen.getByText(/Do NOT share OTP with the caller/i)).toBeInTheDocument();
    });

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);

    await waitFor(() => {
      expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByText(/Could not save protective action status/i)).toBeInTheDocument();
    });
  });

  it('supports keyboard accessibility via Space and Enter keys', async () => {
    const user = userEvent.setup();
    api.getHistoryById.mockResolvedValueOnce({
      success: true,
      data: sampleScan,
    });
    api.updateRecommendation.mockResolvedValue({ success: true });

    renderSafetyActionsPage();

    await waitFor(() => {
      expect(screen.getByText(/Do NOT share OTP with the caller/i)).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes[0].focus();
    expect(document.activeElement).toBe(checkboxes[0]);

    // Toggle with Space
    await user.keyboard(' ');
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true');

    // Toggle with Enter
    await user.keyboard('{Enter}');
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('displays completion celebration banner when 100% of actions are resolved', async () => {
    const completedScan = {
      ...sampleScan,
      safetyRecommendations: [
        { id: 'rec-1', action: 'Do NOT share OTP with the caller', completed: true },
        { id: 'rec-2', action: 'Change your net banking password immediately', completed: true },
      ],
    };

    api.getHistoryById.mockResolvedValueOnce({
      success: true,
      data: completedScan,
    });

    renderSafetyActionsPage();

    await waitFor(() => {
      expect(screen.getByText(/All safety actions verified! Threat safely mitigated/i)).toBeInTheDocument();
      expect(screen.getByText(/2 of 2 defensive measures executed/i)).toBeInTheDocument();
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
    });
  });
});
