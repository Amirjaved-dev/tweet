import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Rocket, 
  Star,
  Check,
  MessageSquare,
  Search,
  Globe,
  BarChart3,
  Download,
  Clock,
  Users,
  Target,
  Layers
} from 'lucide-react';

const Features: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Token-Based Thread Generation",
      description: "Auto-detect tokens from X posts or custom input. Generate contextual threads instantly with real-time market data.",
      highlights: ["Context-aware content", "Real-time price integration", "Customizable thread length"]
    },
    {
      icon: Search,
      title: "Real-time Scraping & Analysis",
      description: "Live price data, sentiment analysis, bio scraping, and X post monitoring for up-to-the-minute insights.",
      highlights: ["Automatic price tracking", "Social sentiment analysis", "Competitive monitoring"]
    },
    {
      icon: Globe,
      title: "Web3-Native Tone Presets",
      description: "Hype, Degen, Educational, Shill modes - perfect for crypto communities with authentic language.",
      highlights: ["5+ specialized tone presets", "Community-specific language", "Meme & emoji integration"]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track your thread performance, engagement rates, and growth metrics with detailed insights.",
      highlights: ["Performance tracking", "Engagement analytics", "Growth insights"]
    },
    {
      icon: Download,
      title: "Export & Save",
      description: "Export your threads in multiple formats and save your favorites for future reference.",
      highlights: ["Multiple export formats", "Thread history", "Favorite collections"]
    },
    {
      icon: Clock,
      title: "Thread Scheduling",
      description: "Schedule your threads for optimal posting times across different time zones.",
      highlights: ["Optimal timing", "Time zone support", "Batch scheduling"]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work with your team to create, review, and approve threads before publishing.",
      highlights: ["Team workspaces", "Approval workflows", "Collaborative editing"]
    },
    {
      icon: Target,
      title: "Smart CTAs",
      description: "Automatically generate compelling calls-to-action optimized for Web3 communities.",
      highlights: ["Conversion-optimized", "Community-specific", "A/B testing"]
    },
    {
      icon: Layers,
      title: "Template Library",
      description: "Access hundreds of proven thread templates for different crypto niches and use cases.",
      highlights: ["Pre-built templates", "Niche-specific", "Customizable layouts"]
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
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Features
            </span>
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            <div className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200">
              Everything You Need to
            </div>
            <div className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mt-2">
              Dominate Crypto X
            </div>
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Thread Nova combines cutting-edge AI with deep crypto market understanding to help you create viral content that actually converts. Here's what makes us different.
          </motion.p>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center mb-5 group-hover:bg-purple-900/50 transition-colors">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-400">
                      <Check className="w-4 h-4 text-purple-400 mr-3 flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="relative z-10 py-16 sm:py-20 bg-gradient-to-r from-purple-900/10 to-blue-900/10">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Thread Nova is Different
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Built specifically for the crypto community by people who understand Web3 culture
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: <Rocket className="w-6 h-6" />,
                title: "Enterprise AI Models",
                description: "Powered by OpenRouter & Gemini AI for professional-grade content"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Works for Any Token",
                description: "Support for new and emerging tokens, not just listed ones"
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Crypto-Native Tones",
                description: "Authentic Web3 language that resonates with communities"
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: "Conversion Optimized",
                description: "Built-in CTAs and strategies that actually drive results"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-purple-400">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Go Viral?
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Join thousands of Web3 creators who are already dominating X with Thread Nova
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    Start Creating
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  View Pricing
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Features; 