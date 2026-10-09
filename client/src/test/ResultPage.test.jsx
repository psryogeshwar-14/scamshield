import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResultPage from '../pages/ResultPage';
import api from '../api/client';
import ToastProvider from '../context/ToastProvider';

afterEach(() => {
  cleanup();
});

vi.mock('../api/client', () => ({
  default: {
    getHistoryById: vi.fn(),
    updateRecommendation: vi.fn(),
  },
}));

const mockScanData = {
  id: 'test-scan-1',
  inputType: 'url',
  raw: 'http://paypal-security-update.xyz/verify',
  userInput: 'http://paypal-security-update.xyz/verify',
  riskLevel: 'high_risk',
  threatType: 'Phishing',
  confidence: 0.94,
  summary: 'Deceptive credential harvesting attempt masquerading as PayPal.',
  recommendedAction: 'Do not enter credentials. Close this browser tab immediately.',
  evidence: [
    'Uses suspicious .xyz top-level domain',
    'Unencrypted HTTP protocol detected',
    'Brand keyword "paypal" impersonation',
  ],
  safetyRecommendations: [
    {
      id: 'rec-1',
      action: 'Do not click or submit any login credentials.',
      completed: false,
    },
    {
      id: 'rec-2',
      action: 'Change your PayPal password immediately if entered.',
      completed: true,
    },
  ],
  safeBrowsing: {
    status: 'unavailable',
    details: 'Reputation feed unconfigured or timed out',
  },
  heuristics: {
    score: 85,
    findings: [
      { label: 'TLD Check', detail: '.xyz domain frequently abused in phishing' },
    ],
  },
  whyThisResult: {
    deterministicChecks: '3 heuristic indicators triggered',
    externalReputation: 'Unavailable',
    aiInterpretation: 'Phishing mimicry pattern recognized',
    limitations: 'Heuristics cannot guarantee zero-day safety',
  },
};

function renderWithRouter(path = '/result/test-scan-1', state = null) {
  const entry = state ? { pathname: path, state: { result: state } } : path;
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ToastProvider>
        <Routes>
          <Route path="/result/:id" element={<ResultPage />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('ResultPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analysis verdict, confidence, and summary from state', () => {
    renderWithRouter('/result/test-scan-1', mockScanData);

    expect(screen.getByText('Security Evaluation Verdict')).toBeInTheDocument();
    expect(screen.getByText('Phishing')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
    expect(screen.getAllByText(mockScanData.summary).length).toBeGreaterThan(0);
    expect(screen.getByText(mockScanData.recommendedAction)).toBeInTheDocument();
  });

  it('renders Why This Result section with deterministic and limitations info', () => {
    renderWithRouter('/result/test-scan-1', mockScanData);

    expect(screen.getByText('Why This Result?')).toBeInTheDocument();
    expect(screen.getByText('Deterministic Checks')).toBeInTheDocument();
    expect(screen.getByText('Confidence Limitations')).toBeInTheDocument();
  });

  it('renders Safe Browsing badge in unavailable state when unconfigured', () => {
    renderWithRouter('/result/test-scan-1', mockScanData);

    expect(screen.getByText('Reputation Feed Unavailable')).toBeInTheDocument();
  });

  it('renders Safe Browsing badge in threat flagged state when threat detected', () => {
    const threatScan = {
      ...mockScanData,
      safeBrowsing: { status: 'threat', details: 'Google Safe Browsing threat match' },
    };
    renderWithRouter('/result/test-scan-1', threatScan);

    expect(screen.getByText('Active Threat Flagged')).toBeInTheDocument();
  });

  it('renders Safe Browsing badge in clean state when feed reports clean', () => {
    const cleanScan = {
      ...mockScanData,
      safeBrowsing: { status: 'clean', details: 'No threats found' },
    };
    renderWithRouter('/result/test-scan-1', cleanScan);

    expect(screen.getByText('Clean Threat Feed')).toBeInTheDocument();
  });

  it('toggles safety checklist items upon interaction', async () => {
    const user = userEvent.setup();
    api.updateRecommendation.mockResolvedValueOnce({ success: true });

    renderWithRouter('/result/test-scan-1', mockScanData);

    const step1Checkbox = screen.getByRole('checkbox', {
      name: /do not click or submit any login credentials/i,
    });
    expect(step1Checkbox).not.toBeChecked();

    await user.click(step1Checkbox);

    expect(step1Checkbox).toBeChecked();
    expect(api.updateRecommendation).toHaveBeenCalledWith(
      'test-scan-1',
      'rec-1',
      true
    );
  });

  it('fetches record from API when navigating directly via URL without state', async () => {
    api.getHistoryById.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'test-scan-1',
        inputType: 'url',
        userInput: 'http://paypal-fake.com',
        riskLevel: 'high_risk',
        threatType: 'Phishing',
        confidence: 0.88,
        summary: 'Deceptive URL retrieved from history database',
        recommendedAction: 'Avoid visiting',
        evidenceJson: JSON.stringify(['Suspicious brand impersonation']),
        safetyStepsJson: JSON.stringify(['Do not enter password']),
        safeBrowsingResult: JSON.stringify({ status: 'unavailable' }),
        createdAt: new Date().toISOString(),
      },
    });

    renderWithRouter('/result/test-scan-1', null);

    await waitFor(() => {
      expect(api.getHistoryById).toHaveBeenCalledWith('test-scan-1');
      expect(screen.getAllByText('Deceptive URL retrieved from history database').length).toBeGreaterThan(0);
    });
  });

  it('renders error state when API fails to find analysis record', async () => {
    api.getHistoryById.mockRejectedValueOnce(new Error('Record not found'));

    renderWithRouter('/result/nonexistent-id', null);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Security Record Not Found')).toBeInTheDocument();
    });
  });
});
