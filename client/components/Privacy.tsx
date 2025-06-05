import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Calendar, Database } from 'lucide-react';

const Privacy: React.FC = () => {
  const lastUpdated = "December 1, 2024";

  const sections = [
    {
      icon: <Eye className="w-5 h-5" />,
      title: "1. Information We Collect",
      content: [
        "Account Information: Email address, username, and profile information you provide during registration.",
        "Usage Data: Information about how you use our service, including threads created, features accessed, and time spent on the platform.",
        "Payment Information: Payment details processed securely through Coinbase Commerce for crypto payments.",
        "Technical Data: IP address, browser type, device information, and usage analytics.",
        "Content Data: Threads, prompts, and other content you create using our platform."
      ]
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "2. How We Use Your Information",
      content: [
        "Service Provision: To provide, maintain, and improve ThreadFlowPro's features and functionality.",
        "Account Management: To manage your account, process payments, and provide customer support.",
        "Analytics: To understand usage patterns and improve our AI models and user experience.",
        "Communication: To send service updates, security alerts, and support messages.",
        "Legal Compliance: To comply with legal obligations and protect our rights and users' safety."
      ]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "3. Information Sharing",
      content: [
        "We do not sell, trade, or rent your personal information to third parties.",
        "Service Providers: We share data with trusted service providers who help us operate our platform (hosting, analytics, payment processing).",
        "Legal Requirements: We may disclose information when required by law or to protect our rights and safety.",
        "Business Transfers: Information may be transferred in connection with mergers, acquisitions, or sales of assets.",
        "Consent: We may share information with your explicit consent for specific purposes."
      ]
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "4. Data Security",
      content: [
        "We use industry-standard encryption to protect data in transit and at rest.",
        "Access to your data is restricted to authorized personnel who need it for business purposes.",
        "We regularly audit our security practices and update them to address new threats.",
        "Payment processing is handled securely through Coinbase Commerce with no storage of payment details.",
        "We implement multi-factor authentication and other security measures to protect accounts."
      ]
    },
    {
      title: "5. Data Retention",
      content: [
        "Account data is retained while your account is active and for a reasonable period after deletion.",
        "Content data (threads, prompts) is retained to provide the service and improve our AI models.",
        "Usage analytics may be retained in aggregated, anonymized form for business intelligence.",
        "Payment records are retained as required by law and our payment processors.",
        "You can request deletion of your data subject to legal and technical limitations."
      ]
    },
    {
      title: "6. Your Rights",
      content: [
        "Access: You can access and review your personal information through your account settings.",
        "Correction: You can update or correct your personal information at any time.",
        "Deletion: You can request deletion of your account and associated data.",
        "Portability: You can export your content and data in standard formats.",
        "Opt-out: You can opt out of non-essential communications and certain data processing activities."
      ]
    },
    {
      title: "7. Cookies and Tracking",
      content: [
        "We use cookies and similar technologies to improve user experience and analyze usage.",
        "Essential cookies are required for the service to function properly.",
        "Analytics cookies help us understand how users interact with our platform.",
        "You can control cookie preferences through your browser settings.",
        "We do not use cookies for advertising or tracking across other websites."
      ]
    },
    {
      title: "8. Third-Party Services",
      content: [
        "Authentication: We use Clerk for secure user authentication and account management.",
        "Analytics: We use privacy-focused analytics to understand usage patterns.",
        "Payment Processing: Coinbase Commerce handles cryptocurrency payments securely.",
        "AI Services: We use OpenRouter and other AI providers for content generation.",
        "Each third-party service has its own privacy policy that governs their data practices."
      ]
    },
    {
      title: "9. International Data Transfers",
      content: [
        "Your data may be processed in countries other than your country of residence.",
        "We ensure appropriate safeguards are in place for international data transfers.",
        "Data processing complies with applicable privacy laws including GDPR and CCPA.",
        "We maintain data processing agreements with all service providers."
      ]
    },
    {
      title: "10. Children's Privacy",
      content: [
        "Our service is not directed to children under 13 years of age.",
        "We do not knowingly collect personal information from children under 13.",
        "If we become aware of such collection, we will delete the information promptly.",
        "Parents or guardians can contact us if they believe their child has provided personal information."
      ]
    },
    {
      title: "11. Changes to Privacy Policy",
      content: [
        "We may update this privacy policy from time to time to reflect changes in our practices.",
        "Material changes will be communicated via email or prominent notice on our platform.",
        "Continued use of the service after changes constitutes acceptance of the updated policy.",
        "We encourage you to review this policy periodically for updates."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 md:pt-32 pb-16">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium backdrop-blur-sm">
              <Shield className="w-4 h-4 mr-2" />
              Privacy Policy
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <div className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200">
              Your Privacy Matters
            </div>
          </h1>

          <div className="flex items-center justify-center gap-2 text-gray-400 mb-8">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            We're committed to protecting your privacy and being transparent about how we collect, use, and protect your information.
          </p>
        </motion.div>
      </section>

      {/* Privacy Content */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  {section.icon && (
                    <div className="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <div className="text-purple-400">
                        {section.icon}
                      </div>
                    </div>
                  )}
                  {!section.icon && (
                    <div className="w-8 h-8 bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-purple-400 text-sm font-bold">{index + 1}</span>
                    </div>
                  )}
                  {section.title}
                </h2>
                
                <div className="space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-300 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 md:p-12">
              <div className="w-16 h-16 bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Privacy Questions?
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                If you have questions about this privacy policy or how we handle your data, we're here to help.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="mailto:privacy@threadnova.com"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 inline-flex items-center justify-center gap-2"
                >
                  <Shield className="w-5 h-5" />
                  Contact Privacy Team
                </motion.a>
                <motion.a
                  href="/dashboard/settings"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center gap-2"
                >
                  <Database className="w-5 h-5" />
                  Manage Data
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Privacy; 