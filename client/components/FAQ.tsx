import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, MessageCircle, Zap, Shield, CreditCard } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqCategories = [
    {
      icon: <HelpCircle className="w-5 h-5" />,
      title: "Getting Started",
      faqs: [
        {
          question: "What is Thread Nova?",
          answer: "Thread Nova is an AI-powered platform specifically designed for creating viral crypto and Web3 content for X (Twitter). We combine real-time market data, sentiment analysis, and crypto-native language models to help you create threads that actually convert and engage your audience."
        },
        {
          question: "How does token detection work?",
          answer: "Our AI can automatically detect crypto tokens from X posts, URLs, or manual input. Simply paste a link to a tweet or enter a token name, and we'll pull real-time price data, recent news, and community sentiment to create contextually relevant threads."
        },
        {
          question: "Do I need crypto knowledge to use Thread Nova?",
          answer: "Not at all! Our platform is designed for both crypto veterans and newcomers. We provide educational tone presets and built-in context that helps you sound authentic even if you're just getting started in Web3."
        },
        {
          question: "What makes Thread Nova different from other AI writing tools?",
          answer: "Unlike generic AI tools, we're built specifically for crypto communities. We understand meme culture, token dynamics, DeFi protocols, and the unique language of Web3. Plus, we integrate real-time market data and social sentiment analysis."
        }
      ]
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "Features & Usage",
      faqs: [
        {
          question: "What tone presets are available?",
          answer: "We offer 5+ specialized tones: Hype (high-energy, FOMO-driven), Degen (meme-heavy, community slang), Educational (informative, beginner-friendly), Shill (promotional, conversion-focused), and Analysis (data-driven, technical). Each understands crypto culture."
        },
        {
          question: "Can I schedule threads for later?",
          answer: "Yes! Premium users can schedule threads for optimal posting times. Our analytics show when your audience is most active, and you can schedule across different time zones to maximize global reach."
        },
        {
          question: "What export formats do you support?",
          answer: "You can export threads as plain text, formatted for X, PDF documents, or save them in your personal thread library. We also provide embed codes for websites and newsletters."
        },
        {
          question: "How accurate is the real-time data?",
          answer: "We pull data from multiple sources including CoinGecko, CoinMarketCap, and X's API for the most up-to-date prices and sentiment. Data is refreshed every few minutes to ensure accuracy."
        }
      ]
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: "Pricing & Plans",
      faqs: [
        {
          question: "What's included in the free plan?",
          answer: "The free plan includes 5 threads per day, basic tone presets, thread history, and export as text. It's perfect for testing the platform and occasional content creation."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major cryptocurrencies (Bitcoin, Ethereum, USDT, USDC, TON) via Coinbase Commerce. We're crypto-native, so we prefer crypto payments, but also support traditional payment methods."
        },
        {
          question: "Can I cancel my subscription anytime?",
          answer: "Absolutely! You can cancel your subscription at any time from your account settings. You'll continue to have access to premium features until your current billing period ends."
        },
        {
          question: "Do you offer team discounts?",
          answer: "Yes! We offer special pricing for teams and agencies. Contact us at niceearn7@gmail.com for custom team plans and volume discounts."
        }
      ]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Security & Support",
      faqs: [
        {
          question: "Is my data secure?",
          answer: "Absolutely. We use enterprise-grade encryption and never store your private keys or sensitive information. Your threads and data are kept private and secure. We're SOC 2 compliant and follow crypto industry best practices."
        },
        {
          question: "How do I get support?",
          answer: "Reach out to us at niceearn7@gmail.com or join our Discord community. Premium users get priority support with faster response times. We're here to help you succeed!"
        },
        {
          question: "Can I use Thread Nova for other platforms?",
          answer: "While we're optimized for X (Twitter), our threads work great on other platforms too. Many users repurpose content for LinkedIn, Discord, Telegram, and their own blogs or newsletters."
        },
        {
          question: "Do you have an API?",
          answer: "Yes! Premium users get access to our API for integrating Thread Nova into their existing workflows, tools, or automation systems. Full documentation is available in your dashboard."
        }
      ]
    }
  ];

  const toggleFAQ = (categoryIndex: number, faqIndex: number) => {
    const globalIndex = categoryIndex * 1000 + faqIndex;
    setOpenFAQ(openFAQ === globalIndex ? null : globalIndex);
  };

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
              <HelpCircle className="w-4 h-4 mr-2" />
              Frequently Asked Questions
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <div className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200">
              Got Questions?
            </div>
            <div className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mt-2">
              We've Got Answers
            </div>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about Thread Nova, from getting started to advanced features.
          </p>
        </motion.div>
      </section>

      {/* FAQ Content */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              {/* Category Header */}
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                  <div className="text-purple-400">
                    {category.icon}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white">{category.title}</h2>
              </div>

              {/* FAQ Items */}
              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 1000 + faqIndex;
                  const isOpen = openFAQ === globalIndex;

                  return (
                    <motion.div
                      key={faqIndex}
                      className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleFAQ(categoryIndex, faqIndex)}
                        className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <span className="text-lg font-semibold text-white pr-4">
                          {faq.question}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0"
                        >
                          <ChevronDown className="w-5 h-5 text-purple-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-5">
                              <p className="text-gray-300 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
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
                <MessageCircle className="w-8 h-8 text-purple-400" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Still Have Questions?
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Our team is here to help! Reach out and we'll get back to you quickly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="mailto:niceearn7@gmail.com"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Email Support
                </motion.a>
                <motion.a
                  href="https://discord.gg/threadnova"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Join Discord
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQ; 