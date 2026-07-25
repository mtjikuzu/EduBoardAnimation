import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="h-14 px-4 bg-card border-b border-border flex items-center gap-4">
        <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-serif font-bold text-lg">Terms of Service</h1>
      </header>
      <main className="max-w-3xl mx-auto p-8 prose prose-gray">
        <p className="text-sm text-muted-foreground">Last updated: 24 July 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using EduWhiteboard ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

        <h2>2. Description of Service</h2>
        <p>EduWhiteboard is an educational video creation platform that allows creators to generate whiteboard-style instructional videos through AI-assisted tools and publish them to supported platforms including YouTube.</p>

        <h2>3. Creator Accounts</h2>
        <p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

        <h2>4. Content Ownership</h2>
        <p>You retain all ownership rights to the content you create using EduWhiteboard. By using the Service, you grant EduWhiteboard a limited license to process, store, and deliver your content solely for the purpose of providing the Service.</p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Create content that violates applicable laws or regulations</li>
          <li>Impersonate any person or entity</li>
          <li>Upload or generate content that infringes on third-party rights</li>
          <li>Distribute harmful, abusive, or misleading educational content</li>
          <li>Attempt to circumvent content safety policies</li>
        </ul>

        <h2>6. Content Moderation</h2>
        <p>EduWhiteboard employs automated content safety checks. Content that violates our policies may be blocked from generation or publication. We reserve the right to suspend accounts that repeatedly violate these policies.</p>

        <h2>7. Credits and Payments</h2>
        <p>Certain features require render credits, which may be purchased through our payment partners. Credits are non-refundable except as required by applicable law. Unused credits expire 12 months after purchase.</p>

        <h2>8. Third-Party Services</h2>
        <p>The Service integrates with third-party platforms (YouTube, OpenAI, etc.). Your use of those services is subject to their respective terms of service.</p>

        <h2>9. Limitation of Liability</h2>
        <p>EduWhiteboard is provided "as is" without warranties of any kind. We are not liable for damages arising from your use of the Service, including but not limited to content inaccuracies, service interruptions, or data loss.</p>

        <h2>10. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>

        <h2>11. Contact</h2>
        <p>For questions about these terms, please contact the project maintainers through the GitHub repository.</p>
      </main>
    </div>
  );
}
