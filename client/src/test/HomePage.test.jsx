import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import api from '../api/client';
import ToastProvider from '../context/ToastProvider';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/client', () => ({
  default: {
    analyzeUrl: vi.fn(),
    analyzeMessage: vi.fn(),
  },
}));

function renderHomePage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <HomePage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('HomePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input form with URL tab active by default', () => {
    renderHomePage();
    expect(screen.getByRole('tab', { name: /inspect web url/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText(/secure-paypal-verify/i)).toBeInTheDocument();
  });

  it('switches between URL and Message tabs', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const messageTab = screen.getByRole('tab', { name: /inspect message or email/i });
    await user.click(messageTab);

    expect(messageTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText(/urgent/i)).toBeInTheDocument();
    expect(screen.getByText(/Text content & links/i)).toBeInTheDocument();

    const urlTab = screen.getByRole('tab', { name: /inspect web url/i });
    await user.click(urlTab);
    expect(urlTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const submitButton = screen.getByRole('button', { name: /launch threat analysis/i });
    await user.click(submitButton);

    expect(screen.getByText(/Please enter or paste a URL to analyze/i)).toBeInTheDocument();
    expect(api.analyzeUrl).not.toHaveBeenCalled();
  });

  it('shows message-specific error when submitting empty message tab', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const messageTab = screen.getByRole('tab', { name: /inspect message or email/i });
    await user.click(messageTab);

    const submitButton = screen.getByRole('button', { name: /launch threat analysis/i });
    await user.click(submitButton);

    expect(screen.getByText(/Please enter or paste a message to analyze/i)).toBeInTheDocument();
    expect(api.analyzeMessage).not.toHaveBeenCalled();
  });

  it('populates input when clicking a quick-test sample chip', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const sampleChip = screen.getByRole('button', { name: /PayPal Phishing Domain/i });
    await user.click(sampleChip);

    const input = screen.getByPlaceholderText(/secure-paypal-verify/i);
    expect(input.value).toContain('secure-paypal-verify.login-update.xyz');
  });

  it('executes URL analysis and navigates on success', async () => {
    const user = userEvent.setup();
    api.analyzeUrl.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'scan-123',
        riskLevel: 'high_risk',
        threatType: 'Phishing',
        summary: 'Deceptive URL detected',
      },
    });

    renderHomePage();

    const input = screen.getByPlaceholderText(/secure-paypal-verify/i);
    await user.type(input, 'http://phishing-site.xyz/login');

    const submitButton = screen.getByRole('button', { name: /launch threat analysis/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.analyzeUrl).toHaveBeenCalledWith('http://phishing-site.xyz/login');
      expect(mockNavigate).toHaveBeenCalledWith('/result/scan-123', expect.any(Object));
    });
  });

  it('handles API failure and renders error state', async () => {
    const user = userEvent.setup();
    api.analyzeUrl.mockRejectedValueOnce(new Error('Network error: server unreachable'));

    renderHomePage();

    const input = screen.getByPlaceholderText(/secure-paypal-verify/i);
    await user.type(input, 'https://test-link.com');

    const submitButton = screen.getByRole('button', { name: /launch threat analysis/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error: server unreachable/i)).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation across tabs and inputs', async () => {
    const user = userEvent.setup();
    renderHomePage();

    const urlTab = screen.getByRole('tab', { name: /inspect web url/i });
    const messageTab = screen.getByRole('tab', { name: /inspect message or email/i });

    urlTab.focus();
    expect(document.activeElement).toBe(urlTab);

    await user.tab();
    expect(document.activeElement).toBe(messageTab);
  });
});
