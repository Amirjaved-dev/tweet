import React, { useState, useEffect, ErrorInfo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Rocket, 
  Star,
  Check,
  ArrowRight,
  Twitter,
  MessageSquare,
  Users,
  BarChart3,
  Search,
  Globe
} from 'lucide-react';

// Add error boundary for the component
class LandingPageErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in LandingPage:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-6">We encountered an error loading the home page content.</p>
            <button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Typing Effect Component
const TypingEffect: React.FC<{ 
  texts: string[], 
  speed?: number, 
  deleteSpeed?: number, 
  pauseTime?: number,
  className?: string 
}> = ({ 
  texts, 
  speed = 100, 
  deleteSpeed = 50, 
  pauseTime = 2000,
  className = "" 
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isPaused) {
        setIsPaused(false);
        setIsDeleting(true);
        return;
      }

      const fullText = texts[currentTextIndex];
      
      if (isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      } else {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        
        if (currentText === fullText) {
          setIsPaused(true);
        }
      }
    }, isPaused ? pauseTime : isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, isPaused, currentTextIndex, texts, speed, deleteSpeed, pauseTime]);

  return (
    <span className={className}>
      {currentText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-1 h-[1em] bg-gradient-to-r from-purple-400 to-blue-400 ml-1"
      />
    </span>
  );
};

const LandingPage: React.FC = () => {
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

  const typingTexts = [
    "Viral Threads.",
    "Crypto Content.",
    "Web3 Stories.",
    "DeFi Threads.",
    "Meme Coin Hype."
  ];

  return (
    <LandingPageErrorBoundary>
      <div className="relative min-h-screen bg-black overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent"></div>
        
        {/* Floating orbs */}
        <motion.div 
          className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Hero Section */}
        <section className="relative z-10 container mx-auto px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20">
          <motion.div 
            className="text-center max-w-6xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-4 sm:mb-6">
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium backdrop-blur-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                AI-Powered Thread Generation
              </span>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight"
            >
              <div className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200">
                Turn Ideas into
              </div>
              <div className="mt-1 sm:mt-2">
                <TypingEffect 
                  texts={typingTexts}
                  speed={150}
                  deleteSpeed={100}
                  pauseTime={2000}
                  className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
                />
              </div>
              <div className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200 mt-1 sm:mt-2">
                Instantly.
              </div>
            </motion.div>

            <motion.p 
              variants={fadeInUp}
              className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2 sm:px-4"
            >
              AI-Powered Threads for Crypto Influencers. Trusted by DeFi, Meme Coin, and NFT founders.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold text-base sm:text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center justify-center">
                  Try Free Thread
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300"
              >
                See How It Works
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline" />
              </motion.button>
            </motion.div>

            {/* Live Thread Preview with Enhanced Typing Effect */}
            <motion.div 
              variants={fadeInUp}
              className="relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl mx-auto"
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-2"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-400 text-xs sm:text-sm ml-2 sm:ml-4">Thread Nova Generator</span>
                </div>
                <div className="text-left">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="text-green-400 font-mono text-xs sm:text-sm"
                  >
                    {">"} Generating viral thread about{" "}
                    <TypingEffect 
                      texts={["$PEPE...", "$DOGE...", "$SHIB...", "$BONK..."]}
                      speed={100}
                      deleteSpeed={50}
                      pauseTime={1500}
                      className="text-yellow-400"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3, duration: 1 }}
                    className="text-purple-300 font-mono text-xs sm:text-sm mt-2"
                  >
                    ✨ Thread generated in 2.3s
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* What It Does Section */}
        <section className="relative z-10 py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Powerful Features</h2>
              <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto">
                Advanced tools to create perfect crypto threads for any token or project
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {/* Token-Based Thread Generation */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-500/40 transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-900/30 rounded-xl flex items-center justify-center mb-5">
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Token-Based Thread Generation</h3>
                <p className="text-gray-300 mb-4">
                  Auto-detect tokens from X posts or custom input. Generate contextual threads instantly.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Context-aware token threads</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Real-time price integration</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Customizable thread length</span>
                  </li>
                </ul>
              </motion.div>

              {/* Feature Showcase Section - Improved */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-blue-500/40 transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-900/30 rounded-xl flex items-center justify-center mb-5">
                  <Search className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Real-time Scraping</h3>
                <p className="text-gray-300 mb-4">
                  Live price data, sentiment analysis, bio scraping, and X post monitoring.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Automatic price & trend tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Social sentiment analysis</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Competitive monitoring</span>
                  </li>
                </ul>
              </motion.div>

              {/* Web3-Native Tone Presets */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-green-500/40 transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-900/30 rounded-xl flex items-center justify-center mb-5">
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Web3-Native Tone Presets</h3>
                <p className="text-gray-300 mb-4">
                  Hype, Degen, Educational, Shill modes - perfect for crypto communities.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>5+ specialized tone presets</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Community-specific language</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Meme & emoji integration</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Showcase Section */}
        <section className="relative z-10 py-16 sm:py-24 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">See It In Action</h2>
              <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto">
                Advanced AI-powered features to enhance your crypto content
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              {/* Left Feature - Token-Based Thread */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-purple-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-400 mr-2" />
                  <h3 className="text-xl font-bold text-white">Token-Based Generation</h3>
                </div>
                
                <div className="bg-black/60 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-900/30">
                    <p className="text-white font-medium">1/ Excited to share my analysis on $ETH 🧵</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-gray-300">2/ $ETH is building something truly innovative in the crypto space. Their technology solves real problems.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-gray-300">3/ Key metrics for $ETH:<br/>• Market cap: $420M<br/>• 24h volume: $89M<br/>• Active developers: 32</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-gray-300">4/ The team behind $ETH is impressive. Led by experienced blockchain developers with previous successes.</p>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-400 italic">
                  Simply enter any token name and generate an in-depth analysis thread instantly
                </div>
              </motion.div>
              
              {/* Right Feature - Real-time Scraping */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-blue-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-center mb-4">
                  <Search className="w-6 h-6 text-blue-400 mr-2" />
                  <h3 className="text-xl font-bold text-white">Real-time Scraping</h3>
                </div>
                
                <div className="bg-black/60 border border-white/5 rounded-xl p-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2 p-3 rounded-lg bg-blue-900/20 border border-blue-900/30">
                    <div className="flex justify-between">
                      <span className="text-white font-medium">$BTC</span>
                      <span className="text-green-400">$44,278.65</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Current Price</span>
                      <span className="text-green-400">+2.4%</span>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-gray-300 text-sm">Sentiment Analysis</p>
                    <p className="text-green-400 font-medium">78% Bullish</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-gray-300 text-sm">Social Mentions</p>
                    <p className="text-white font-medium">12,453 <span className="text-green-400 text-xs">↑24%</span></p>
                  </div>
                  
                  <div className="col-span-2 p-3 rounded-lg bg-white/5">
                    <p className="text-gray-300 text-sm">Latest News</p>
                    <p className="text-white">Bitcoin ETF sees $258M inflows in last 24 hours</p>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-400 italic">
                  Real-time data fetching provides up-to-the-minute insights for your threads
                </div>
              </motion.div>
              
              {/* Bottom Feature - Web3 Tone Presets */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-green-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-center mb-4">
                  <Globe className="w-6 h-6 text-green-400 mr-2" />
                  <h3 className="text-xl font-bold text-white">Web3-Native Tone Presets</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-green-900/20 border border-green-900/30">
                    <p className="text-green-400 font-medium mb-2">Degen Mode</p>
                    <p className="text-white text-sm">gm frens. lfg with this alpha on solana. ser, this is the play. straight up degen szn vibes rn. apeing in with my last eth. ngmi if u don't follow.</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-900/30">
                    <p className="text-yellow-400 font-medium mb-2">Hype Mode</p>
                    <p className="text-white text-sm">🔥🔥🔥 HUGE ALERT!!! THE GAINS ARE COMING AND THEY'RE GOING TO BE MASSIVE!!! 📈📈📈 I'VE NEVER BEEN MORE BULLISH IN MY ENTIRE LIFE!!!</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-900/30">
                    <p className="text-blue-400 font-medium mb-2">Educational Mode</p>
                    <p className="text-white text-sm">An Educational Thread: To understand this project properly, we need to examine the underlying technology and its potential applications in the broader ecosystem.</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-900/30">
                    <p className="text-purple-400 font-medium mb-2">Shill Mode</p>
                    <p className="text-white text-sm">$BTC is the most undervalued gem in crypto right now. Still early. Team is based and delivers. Already partnered with huge names that I can't reveal yet.</p>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-400 italic">
                  Switch between different tones to match your audience and community style
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why It's Different Section */}
        <section className="relative z-10 py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Why ThreadNova is Different
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
              {[
                {
                  icon: <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />,
                  title: "Powered by OpenRouter & Gemini AI",
                  description: "Enterprise-grade AI models"
                },
                {
                  icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
                  title: "Works for tokens not on CoinMarketCap",
                  description: "Support for new and emerging tokens"
                },
                {
                  icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
                  title: "Crypto tone dial: Shill, Hype, or Calm",
                  description: "Perfect tone for every situation"
                },
                {
                  icon: <Star className="w-5 h-5 sm:w-6 sm:h-6" />,
                  title: "Built-in CTA placement",
                  description: "Optimized for maximum engagement"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300"
                >
                  <div className="text-purple-400 mb-2 sm:mb-3">
                    {item.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="relative z-10 py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Choose the plan that fits your content creation needs. Pay securely with cryptocurrency.
              </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto items-center justify-center">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="w-full lg:w-80 bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 hover:border-gray-600 transition-all duration-300"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                  <p className="text-gray-400 text-sm mb-6">Perfect for trying out</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-white">$0</span>
                    <span className="text-gray-400 text-lg ml-2">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300">3 basic threads per day</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300">Standard AI models</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300">Basic tone presets</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300">Community support</span>
                  </li>
                </ul>
                
                <button className="w-full py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-white font-semibold transition-all duration-300">
                  Get Started Free
                </button>
              </motion.div>

              {/* Pro Plan - Featured */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="w-full lg:w-80 relative"
              >
                {/* Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ⭐ Most Popular
                  </div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl"></div>
                
                {/* Card */}
                <div className="relative bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/50 rounded-3xl p-8 shadow-2xl">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                    <p className="text-purple-200 text-sm mb-6">For serious creators</p>
                    <div className="mb-6">
                      <span className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">$9.99</span>
                      <span className="text-gray-300 text-lg ml-2">/month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-purple-300" />
                      </div>
                      <span className="text-gray-200"><strong className="text-white">Unlimited</strong> thread generation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-purple-300" />
                      </div>
                      <span className="text-gray-200"><strong className="text-white">Advanced</strong> AI models</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-purple-300" />
                      </div>
                      <span className="text-gray-200"><strong className="text-white">Custom</strong> tone settings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-purple-300" />
                      </div>
                      <span className="text-gray-200"><strong className="text-white">Priority</strong> support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-purple-300" />
                      </div>
                      <span className="text-gray-200"><strong className="text-white">Analytics</strong> & insights</span>
                    </li>
                  </ul>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Upgrade to Pro
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Payment Info */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-300 font-semibold">Secure Crypto Payments</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Powered by <strong className="text-white">Coinbase Commerce</strong> - Accept Bitcoin, Ethereum, USDT, and more
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative z-10 py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Loved by Web3 Creators
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {[
                {
                  quote: "ThreadNova 10x'd our token's visibility in 48hrs. The AI understands crypto culture perfectly.",
                  author: "@cryptoLion",
                  role: "DeFi Founder"
                },
                {
                  quote: "Finally, an AI that gets the degen language. My engagement went through the roof!",
                  author: "@airdropQueen",
                  role: "Crypto Influencer"
                },
                {
                  quote: "Best investment for my meme coin project. ThreadNova creates viral content consistently.",
                  author: "@moonDevs",
                  role: "Meme Coin Creator"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8"
                >
                  <div className="text-yellow-400 mb-3 sm:mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 inline fill-current" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold mr-3 sm:mr-4">
                      {testimonial.author[1]}
                    </div>
                    <div>
                      <div className="text-sm sm:text-base text-white font-semibold">
                        {testimonial.author}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative z-10 py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 md:p-12">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                  Start Posting Viral Threads Today
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
                  Join the Web3 creators who are already dominating X with ThreadNova
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-bold text-base sm:text-xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative flex items-center justify-center">
                    Launch App
                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10 py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <h3 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  ThreadFlowPro
                </h3>
                <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">Made for Web3 by Web3</p>
              </div>
              
              <div className="flex items-center space-x-4 sm:space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
              </div>
            </div>

            {/* Payment Methods Section */}
            <div className="flex flex-col items-center mt-6 sm:mt-8 mb-6 sm:mb-8">
              <h4 className="text-sm text-gray-400 mb-4">Powered by Coinbase Commerce</h4>
              <div className="flex items-center space-x-6 sm:space-x-8">
                {/* Crypto Payment Icons */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">₿</span>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Ξ</span>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">₮</span>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💎</span>
                  </div>
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⚪</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Bitcoin • Ethereum • USDT • TON • USDC and more cryptocurrencies
              </p>
            </div>
            
            <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-xs sm:text-sm">
              <p>&copy; 2024 ThreadFlowPro. All rights reserved.</p>
              <div className="flex space-x-4 sm:space-x-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </LandingPageErrorBoundary>
  );
};

export default LandingPage; 