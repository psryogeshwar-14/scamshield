import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axe from 'axe-core';
import HomePage from '../pages/HomePage';
import ResultPage from '../pages/ResultPage';
import SafetyActionsPage from '../pages/SafetyActionsPage';
import HistoryPage from '../pages/HistoryPage';
import AboutPage from '../pages/AboutPage';
import NotFoundPage from '../pages/NotFoundPage';
import Navbar from '../components/Navbar';
import ToastProvider from '../context/ToastProvider';
import api from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    getHistory: vi.fn(),
    getHistoryById: vi.fn(),
    deleteHistoryItem: vi.fn(),
    updateRecommendation: vi.fn(),
  },
}));

async function checkA11y(container) {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false }, // tested separately with computed WCAG ratios
    },
  });

  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.map((n) => n.html),
  }));
}

const sampleResult = {
  id: 'a11y-test-123',
  inputType: 'url',
  raw: 'https://paypal-security.serveo.net/login',
  riskLevel: 'high_risk',
  threatType: 'impersonation',
  confidence: 0.96,
  summary: 'Tunneling host masquerading as PayPal authentication portal.',
  evidence: ['Serveo tunnel detected', 'PayPal brand keyword in subdomain'],
  recommendedAction: 'Close browser tab immediately and avoid entering login credentials.',
  safetySteps: ['Check official URL', 'Clear browser cache'],
  safetyRecommendations: [
    { id: 'rec-1', action: 'Check official URL', completed: false },
    { id: 'rec-2', action: 'Clear browser cache', completed: false },
  ],
  safeBrowsing: { status: 'unavailable', details: 'Offline mode active' },
  whyThisResult: {
    deterministicChecks: ['Brand impersonation', 'Tunneling domain'],
    externalReputation: 'Offline feed',
    aiInterpretation: 'Urgent social engineering',
    limitations: ['Automated guidance only'],
  },
  createdAt: new Date().toISOString(),
};

describe('Comprehensive axe-core Accessibility Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HomePage has 0 axe accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ToastProvider>
          <HomePage />
        </ToastProvider>
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it('Navbar has 0 axe accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it('ResultPage has 0 axe accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/result/a11y-test-123', state: { result: sampleResult } }]}>
        <ToastProvider>
          <Routes>
            <Route path="/result/:id" element={<ResultPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Security Evaluation Verdict/i)).toBeInTheDocument();
    });

    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it('SafetyActionsPage has 0 axe accessibility violations', async () => {
    api.getHistoryById.mockResolvedValueOnce({
      success: true,
      data: sampleResult,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/safety/a11y-test-123']}>
        <ToastProvider>
          <Routes>
            <Route path="/safety/:id" element={<SafetyActionsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Interactive Defense Checklist/i)).toBeInTheDocument();
    });

    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it('HistoryPage has 0 axe accessibility violations', async () => {
    api.getHistory.mockResolvedValueOnce({
      success: true,
      data: [sampleResult],
      pagination: { total: 1, totalPages: 1, page: 1, limit: 10 },
    });

    const { container } = render(
      <MemoryRouter>
        <ToastProvider>
          <HistoryPage />
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Threat Inspection History/i)).toBeInTheDocument();
    });

    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it('AboutPage has 0 axe accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ToastProvider>
          <AboutPage />
        </ToastProvider>
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it('NotFoundPage has 0 axe accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });
});
