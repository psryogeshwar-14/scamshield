import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AboutPage from '../pages/AboutPage';
import ToastProvider from '../context/ToastProvider';

function renderAboutPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AboutPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('AboutPage Component & Interactive Defense Simulator', () => {
  it('renders defense knowledge base and threat taxonomy', () => {
    renderAboutPage();

    expect(screen.getByText(/Digital Threat Defense & Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/Common Threat Playbooks/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Phishing & Homoglyph Attacks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /OTP & Account Deactivation Traps/i })).toBeInTheDocument();
    expect(screen.getByText(/Victim of Financial or Cyber Fraud?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cybercrime\.gov\.in/i })).toBeInTheDocument();
  });

  it('allows interacting with the phishing challenge simulator and cycling scenarios', async () => {
    const user = userEvent.setup();
    renderAboutPage();

    expect(screen.getByText(/Interactive Training Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/University Password Expiry Alert/i)).toBeInTheDocument();

    const flagAsScamButton = screen.getByRole('button', { name: /It's a Malicious Scam/i });
    expect(flagAsScamButton).toBeInTheDocument();

    await user.click(flagAsScamButton);

    // Explanatory feedback is revealed
    expect(screen.getByText(/Correct Assessment!/i)).toBeInTheDocument();
    expect(screen.getAllByText(/support-verify.xyz/i).length).toBeGreaterThan(0);

    // Advance to next challenge
    const nextButton = screen.getByRole('button', { name: /Next Scenario/i });
    await user.click(nextButton);

    expect(screen.getByText(/Work-From-Home Task Recruitment/i)).toBeInTheDocument();
  });

  it('switches between threat playbook tabs', async () => {
    const user = userEvent.setup();
    renderAboutPage();

    const otpTab = screen.getByRole('tab', { name: /OTP & Account Deactivation Traps/i });
    await user.click(otpTab);

    expect(otpTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Deadly Red Flags/i)).toBeInTheDocument();
  });
});
