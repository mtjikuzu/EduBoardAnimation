import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="h-14 px-4 bg-card border-b border-border flex items-center gap-4">
        <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-serif font-bold text-lg">Privacy Policy</h1>
      </header>
      <main className="max-w-3xl mx-auto p-8 prose prose-gray">
        <p className="text-sm text-muted-foreground">Last updated: 24 July 2026</p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following information to provide and improve the Service:</p>
        <ul>
          <li><strong>Account information:</strong> email address, display name, and authentication credentials (via Clerk)</li>
          <li><strong>Content:</strong> lesson briefs, storyboards, narration text, and generated videos you create</li>
          <li><strong>Usage data:</strong> feature interactions, render job metadata, and credit transactions</li>
          <li><strong>Platform connections:</strong> YouTube channel information and OAuth tokens (with your consent)</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To generate and deliver educational videos based on your input</li>
          <li>To process credit purchases and manage your account</li>
          <li>To improve the Service through aggregated usage analysis</li>
          <li>To enforce our content policies and Terms of Service</li>
          <li>To communicate with you about service updates and support</li>
        </ul>

        <h2>3. Data Storage and Processing</h2>
        <p>Your content is stored on our infrastructure and processed by our AI providers (OpenAI, Kokoro TTS) solely for the purpose of generating your requested videos. We implement industry-standard security measures including encryption at rest and in transit.</p>

        <h2>4. Data Retention</h2>
        <p>We retain your account information and content for as long as your account is active. Upon account deletion, we remove or anonymize your data within 30 days, except where retention is required by law.</p>

        <h2>5. Third-Party Data Sharing</h2>
        <p>We share data only with service providers necessary to operate the platform:</p>
        <ul>
          <li><strong>Clerk:</strong> authentication and identity management</li>
          <li><strong>OpenAI:</strong> storyboard generation (lesson briefs only)</li>
          <li><strong>Polar:</strong> payment processing (purchase data only)</li>
          <li><strong>YouTube/Google:</strong> video publishing (with your explicit consent)</li>
        </ul>
        <p>We do not sell your personal data or use your content to train AI models without your explicit opt-in consent.</p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access, update, or delete your personal data</li>
          <li>Export your created content</li>
          <li>Revoke third-party platform connections at any time</li>
          <li>Withdraw consent for data processing</li>
          <li>File a complaint with your local data protection authority</li>
        </ul>

        <h2>7. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We do not use tracking cookies or third-party analytics cookies. You can control cookie settings through your browser.</p>

        <h2>8. Children's Privacy</h2>
        <p>The Service is not intended for users under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has provided us with personal data, please contact us.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We will notify users of material changes to this policy through the Service or via email.</p>

        <h2>10. Contact</h2>
        <p>For privacy-related inquiries, please open an issue on our GitHub repository.</p>
      </main>
    </div>
  );
}
