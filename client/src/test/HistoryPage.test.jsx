import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HistoryPage from '../pages/HistoryPage';
import api from '../api/client';
import ToastProvider from '../context/ToastProvider';

afterEach(() => {
  cleanup();
});

vi.mock('../api/client', () => ({
  default: {
    getHistory: vi.fn(),
    deleteHistoryItem: vi.fn(),
  },
}));

const mockRecords = [
  {
    id: 'item-1',
    inputType: 'url',
    userInput: 'http://fake-university-login.xyz',
    riskLevel: 'high_risk',
    threatType: 'Phishing',
    confidence: 0.95,
    summary: 'Deceptive student portal spoofing Sapthagiri university.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-2',
    inputType: 'message',
    userInput: 'Your bank account will be closed. Send OTP to 99999.',
    riskLevel: 'high_risk',
    threatType: 'OTP_Fraud',
    confidence: 0.92,
    summary: 'Urgent social engineering coercion aiming to extract 6-digit OTP.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-3',
    inputType: 'url',
    userInput: 'https://www.google.com',
    riskLevel: 'safe',
    threatType: 'Legitimate',
    confidence: 0.99,
    summary: 'Legitimate global search platform.',
    createdAt: new Date().toISOString(),
  },
];

function renderHistoryPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <HistoryPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('HistoryPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no history records exist', async () => {
    api.getHistory.mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: { total: 0, totalPages: 1, limit: 10 },
    });

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('No Matching Records Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /launch threat scanner/i })).toBeInTheDocument();
    });
  });

  it('renders populated history list with statistics and record details', async () => {
    api.getHistory.mockResolvedValueOnce({
      success: true,
      data: mockRecords,
      pagination: { total: 3, totalPages: 1, limit: 10 },
    });

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Threat Inspection History')).toBeInTheDocument();
      expect(screen.getByText('http://fake-university-login.xyz')).toBeInTheDocument();
      expect(screen.getByText('Your bank account will be closed. Send OTP to 99999.')).toBeInTheDocument();
      expect(screen.getByText('https://www.google.com')).toBeInTheDocument();
    });

    // Check count cards
    expect(screen.getByText('Total Scans')).toBeInTheDocument();
    expect(screen.getAllByText('View Dossier').length).toBe(3);
  });

  it('filters records when clicking filter tabs', async () => {
    const user = userEvent.setup();
    api.getHistory.mockResolvedValueOnce({
      success: true,
      data: mockRecords,
      pagination: { total: 3, totalPages: 1, limit: 10 },
    });

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('http://fake-university-login.xyz')).toBeInTheDocument();
    });

    // Mock API response for 'message' filter tab
    api.getHistory.mockResolvedValueOnce({
      success: true,
      data: [mockRecords[1]],
      pagination: { total: 1, totalPages: 1, limit: 10 },
    });

    const messagesTab = screen.getByRole('tab', { name: /messages/i });
    await user.click(messagesTab);

    await waitFor(() => {
      expect(api.getHistory).toHaveBeenCalledWith(1, 10, 'message');
    });
  });

  it('filters records client-side using search input', async () => {
    const user = userEvent.setup();
    api.getHistory.mockResolvedValueOnce({
      success: true,
      data: mockRecords,
      pagination: { total: 3, totalPages: 1, limit: 10 },
    });

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('http://fake-university-login.xyz')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search history by url/i);
    await user.type(searchInput, 'google');

    expect(screen.getByText('https://www.google.com')).toBeInTheDocument();
    expect(screen.queryByText('http://fake-university-login.xyz')).not.toBeInTheDocument();
  });

  it('opens delete confirmation modal and removes item on confirm', async () => {
    const user = userEvent.setup();
    api.getHistory.mockResolvedValueOnce({
      success: true,
      data: mockRecords,
      pagination: { total: 3, totalPages: 1, limit: 10 },
    });
    api.deleteHistoryItem.mockResolvedValueOnce({ success: true });

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('http://fake-university-login.xyz')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete this scan/i });
    await user.click(deleteButtons[0]);

    // Modal appears
    expect(screen.getByText('Delete Security Dossier?')).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(api.deleteHistoryItem).toHaveBeenCalledWith('item-1');
      expect(screen.queryByText('http://fake-university-login.xyz')).not.toBeInTheDocument();
    });
  });

  it('renders error alert when history endpoint fails', async () => {
    api.getHistory.mockRejectedValue(new Error('Internal database error'));

    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByText('Internal database error')).toBeInTheDocument();
    });
  });
});
