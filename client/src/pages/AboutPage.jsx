import React, { useState } from 'react';
import ShieldIcon from '../components/ShieldIcon';
import { useToast } from '../hooks/useToast';

const SIMULATOR_CHALLENGES = [
  {
    id: 1,
    title: 'University Password Expiry Alert',
    sender: 'IT-Helpdesk <admin@sapthagiri-portal.support-verify.xyz>',
    message:
      'Urgent Student Notice: Your university academic LMS portal password expires in 15 minutes. To avoid suspension of library and exam access, click here to re-authenticate: http://student-login.sapthagiri-portal.support-verify.xyz/auth',
    isScam: true,
    category: 'Phishing & Homoglyph Spoofing',
    explanation:
      'Scam! Look closely at the domain: "support-verify.xyz" is an untrusted suspicious TLD impersonating your institution. Universities will never demand verification under a 15-minute suspension threat over plain HTTP.',
  },
  {
    id: 2,
    title: 'Work-From-Home Task Recruitment',
    sender: 'HR Recruiter via WhatsApp (+1 928-382-9102)',
    message:
      'Hi! You have been selected by Amazon Global for a remote video rating position. Earn $350 daily for 20 minutes of work. Join our Telegram channel @AmazonTaskHub and deposit a $25 refundable badge fee to receive your daily stipend.',
    isScam: true,
    category: 'Advance-Fee Job Scam',
    explanation:
      'Scam! Legitimate employers will never ask candidates to deposit money or pay "badge fees" to start work, nor do they conduct formal corporate hiring through anonymous Telegram groups.',
  },
  {
    id: 3,
    title: 'Official Account Security Verification',
    sender: 'Google Security <no-reply@accounts.google.com>',
    message:
      'New sign-in from Chrome on macOS. If this was you, you do not need to do anything. If this was not you, review your account security by visiting https://myaccount.google.com/security directly in your browser.',
    isScam: false,
    category: 'Legitimate System Advisory',
    explanation:
      'Legitimate! The sender domain is official (accounts.google.com), uses HTTPS, doesn’t demand immediate passwords or wire transfers, and encourages you to navigate to the official domain independently.',
  },
];

const THREAT_TOPICS = [
  {
    id: 'phishing',
    title: 'Phishing & Homoglyph Attacks',
    badge: 'Links & Fake Portals',
    icon: '🎣',
    description:
      'Attackers create convincing duplicates of login portals (Google, university LMS, banking) using deceptive lookalike domain names to harvest student credentials.',
    redFlags: [
      'Lookalike domains with hyphens (e.g., login-google.security-portal.xyz)',
      'Unencrypted HTTP connections requesting passwords or student IDs',
      'High-urgency warnings demanding immediate re-verification to prevent suspension',
    ],
    defense:
      'Never follow links in unexpected emails. Manually type the official domain in your browser or use your saved bookmarks.',
  },
  {
    id: 'otp',
    title: 'OTP & Account Deactivation Traps',
    badge: 'Credential Harvesting',
    icon: '📱',
    description:
      'Fraudsters impersonate bank security or telecom staff claiming an unauthorized transaction occurred and demand your 6-digit OTP to "cancel" it.',
    redFlags: [
      'Callers or SMS insisting you share a 6-digit verification code',
      'Threats that your SIM card or bank account will be closed in 10 minutes',
      'Claims that providing the OTP is required to reverse a fraudulent debit',
    ],
    defense:
      'Banks and IT staff will NEVER ask for your OTP. An OTP is an authorization key meant solely for your eyes.',
  },
  {
    id: 'payments',
    title: 'Fake Payment QR & UPI Requests',
    badge: 'Financial Fraud',
    icon: '💳',
    description:
      'Scammers send reverse QR codes or collection links claiming you are "receiving money" for a scholarship, refund, or marketplace sale.',
    redFlags: [
      'Prompting you to enter your UPI PIN or password in order to "receive" funds',
      'Unsolicited payment collection links disguised as cashbacks or refunds',
      'Demanding you send a small amount first to "verify the payment bridge"',
    ],
    defense:
      'Receiving money never requires entering your UPI PIN. If an app requests your PIN, funds are leaving your account.',
  },
  {
    id: 'jobs',
    title: 'Advance-Fee Job & Task Scams',
    badge: 'Recruitment Fraud',
    icon: '💼',
    description:
      'Unsolicited messages offering $100–$500/day for liking videos or rating products that ultimately demand upfront fees or cryptocurrency deposits.',
    redFlags: [
      'Hiring conducted exclusively through Telegram or WhatsApp',
      'Demands for "equipment fees", "badge fees", or "activation deposits"',
      'Unrealistic earnings promised for trivial copy-paste tasks',
    ],
    defense:
      'Legitimate companies never require you to pay money to work. Verify open roles directly on official corporate careers pages.',
  },
  {
    id: 'identity',
    title: 'Student Aid & Identity Harvesting',
    badge: 'Data Extortion',
    icon: '🪪',
    description:
      'Phishing forms seeking government IDs, Aadhaar numbers, and parent contacts under the guise of fake student grants or loan forgiveness.',
    redFlags: [
      'Applications hosted on free forms tools (Google Forms, Typeform) asking for tax IDs',
      'Emails from free mail providers (gmail.com, hotmail.com) claiming to be government agencies',
      'Guarantees of scholarship funding in exchange for an upfront processing fee',
    ],
    defense:
      'Only submit identity documents through accredited institutions in person or over secure, verified HTTPS portals.',
  },
];

export default function AboutPage() {
  const [activeTopic, setActiveTopic] = useState('phishing');
  const [simIndex, setSimIndex] = useState(0);
  const [simAnswer, setSimAnswer] = useState(null);
  const { addToast } = useToast();

  const currentChallenge = SIMULATOR_CHALLENGES[simIndex];

  const handleSimChoice = (userChoiceIsScam) => {
    const isCorrect = userChoiceIsScam === currentChallenge.isScam;
    setSimAnswer({
      userChoiceIsScam,
      isCorrect,
    });
    addToast(
      isCorrect ? '🎯 Correct analysis!' : '⚠️ Incorrect! Check the red flags.',
      isCorrect ? 'success' : 'warning'
    );
  };

  const handleNextChallenge = () => {
    setSimAnswer(null);
    setSimIndex((prev) => (prev + 1) % SIMULATOR_CHALLENGES.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 sm:pb-16 animate-fade-in relative z-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <ShieldIcon size={28} color="#3b82f6" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading mb-3">
          Digital Threat Defense & Simulator
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
          Train your instincts with our interactive scam simulator and learn how modern cybercriminals target students.
        </p>
      </div>

      {/* Interactive Scam Spotter Simulator */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 backdrop-blur-2xl mb-12 relative overflow-hidden border border-blue-500/25">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400">
                Interactive Training Simulator
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">
                Scenario {simIndex + 1} of {SIMULATOR_CHALLENGES.length}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              Spot The Threat: {currentChallenge.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              {currentChallenge.category}
            </span>
          </div>
        </div>

        {/* Sender details */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-slate-400 flex items-center justify-between">
          <span className="truncate">From: {currentChallenge.sender}</span>
        </div>

        {/* Simulated Message Content */}
        <div className="mt-3 p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {currentChallenge.message}
        </div>

        {/* Decision Buttons */}
        {!simAnswer ? (
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => handleSimChoice(true)}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-xl font-bold text-sm bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
            >
              <span>🚨</span>
              <span>It's a Malicious Scam</span>
            </button>

            <button
              onClick={() => handleSimChoice(false)}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-xl font-bold text-sm bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
            >
              <span>🛡️</span>
              <span>It's a Legitimate Message</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 p-5 rounded-2xl border animate-fade-in transition-all bg-slate-950">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xl">
                {simAnswer.isCorrect ? '🎉' : '⚠️'}
              </span>
              <h3
                className={`text-base font-bold font-heading ${
                  simAnswer.isCorrect ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {simAnswer.isCorrect ? 'Correct Assessment!' : 'Not Quite! Here is why:'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentChallenge.explanation}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={handleNextChallenge}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer font-heading flex items-center gap-1.5"
              >
                <span>Next Scenario</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Threat Knowledge Base */}
      <div className="mb-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-black text-white font-heading">
            Common Threat Playbooks
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Understanding an attacker's psychology is your first line of defense.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6" role="tablist" aria-label="Threat topics">
          {THREAT_TOPICS.map((topic) => (
            <button
              key={topic.id}
              role="tab"
              aria-selected={activeTopic === topic.id}
              onClick={() => setActiveTopic(topic.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-heading ${
                activeTopic === topic.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-400/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{topic.icon} </span>
              <span>{topic.title}</span>
            </button>
          ))}
        </div>

        {/* Selected Topic Detail Card */}
        {(() => {
          const topic = THREAT_TOPICS.find((t) => t.id === activeTopic) || THREAT_TOPICS[0];
          return (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{topic.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">{topic.title}</h3>
                  <span className="text-xs font-mono text-blue-400">{topic.badge}</span>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {topic.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold mb-3 flex items-center gap-1.5">
                    <span>🚨</span>
                    <span>Deadly Red Flags</span>
                  </h4>
                  <ul className="space-y-2">
                    {topic.redFlags.map((flag, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-rose-400 font-bold mt-0.5">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-3 flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Defensive Habits</span>
                  </h4>
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs sm:text-sm text-emerald-200 leading-relaxed">
                    {topic.defense}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Emergency Cybercrime Helpline */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono text-blue-400 uppercase tracking-wider block mb-1">
            Official Incident Support
          </span>
          <h3 className="text-lg font-bold text-white font-heading">
            Victim of Financial or Cyber Fraud?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg">
            Immediately call the National Cyber Crime Helpline at <strong className="text-white">1930</strong> or register a complaint at <strong className="text-blue-300">cybercrime.gov.in</strong>. Freeze your bank account immediately.
          </p>
        </div>

        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="cybercrime.gov.in — National Cyber Crime Reporting Portal (opens in a new tab)"
          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-colors whitespace-nowrap"
        >
          cybercrime.gov.in →
        </a>
      </div>
    </div>
  );
}
