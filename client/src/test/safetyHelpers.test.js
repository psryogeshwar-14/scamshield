import { describe, it, expect, vi } from 'vitest';
import {
  extractSafetySteps,
  formatSecurityAdvisory,
  downloadJsonReport,
} from '../utils/safetyHelpers.js';

describe('safetyHelpers utility', () => {
  it('extracts steps from relational safetyRecommendations', () => {
    const data = {
      safetyRecommendations: [
        { id: 'rec-1', action: 'Do not click links', completed: false },
        { id: 'rec-2', action: 'Change your password', completed: true },
      ],
    };
    const steps = extractSafetySteps(data);
    expect(steps).toHaveLength(2);
    expect(steps[0].id).toBe('rec-1');
    expect(steps[0].completed).toBe(false);
    expect(steps[1].completed).toBe(true);
  });

  it('extracts steps from JSON serialized safetyStepsJson', () => {
    const data = {
      safetyStepsJson: JSON.stringify(['Verify portal directly', 'Report sender']),
    };
    const steps = extractSafetySteps(data);
    expect(steps).toHaveLength(2);
    expect(steps[0].id).toBe('step-0');
    expect(steps[0].action).toBe('Verify portal directly');
    expect(steps[0].completed).toBe(false);
  });

  it('extracts steps from array safetySteps', () => {
    const data = {
      safetySteps: ['Never share OTP'],
    };
    const steps = extractSafetySteps(data);
    expect(steps).toHaveLength(1);
    expect(steps[0].action).toBe('Never share OTP');
  });

  it('returns empty array for empty or null inputs', () => {
    expect(extractSafetySteps(null)).toEqual([]);
    expect(extractSafetySteps({})).toEqual([]);
  });

  it('formats security advisory text correctly', () => {
    const data = {
      riskLevel: 'high_risk',
      threatType: 'otp_scam',
      recommendedAction: 'Do not share your OTP.',
      summary: 'Urgent social engineering detected.',
    };
    const advisory = formatSecurityAdvisory(data);
    expect(advisory).toContain('HIGH_RISK');
    expect(advisory).toContain('OTP SCAM');
    expect(advisory).toContain('Do not share your OTP.');
    expect(advisory).toContain('ScamShield');
  });

  it('creates JSON download blob cleanly', () => {
    const fakeUrl = 'blob:http://localhost/fake-uuid';
    global.URL.createObjectURL = vi.fn().mockReturnValue(fakeUrl);
    global.URL.revokeObjectURL = vi.fn();

    const linkClickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = linkClickSpy;
      }
      return el;
    });

    const reportData = { id: 'test-123', riskLevel: 'safe' };
    downloadJsonReport(reportData);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(linkClickSpy).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
  });
});
