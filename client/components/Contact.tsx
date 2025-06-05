import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Send, 
  Clock,
  Zap,
  Shield,
  Users,
  Headphones
} from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Get help with your account, billing, or technical issues",
      contact: "niceearn7@gmail.com",
      response: "Response within 24 hours",
      color: "from-purple-600 to-purple-700"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Discord Community",
      description: "Join our community for tips, updates, and peer support",
      contact: "discord.gg/threadnova",
      response: "Active community",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Privacy & Legal",
      description: "Questions about privacy, terms, or legal matters",
      contact: "legal@threadnova.com",
      response: "Response within 3 business days",
      color: "from-green-600 to-green-700"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Enterprise Sales",
      description: "Custom plans for teams and large organizations",
      contact: "enterprise@threadnova.com",
      response: "Response within 1 business day",
      color: "from-orange-600 to-orange-700"
    }
  ];

  const officeInfo = [
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "Headquarters",
      value: "San Francisco, CA"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "Support Hours",
      value: "24/7 Online Support"
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: "Emergency",
      value: "Discord for urgent issues"
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
              <Headphones className="w-4 h-4 mr-2" />
              Get In Touch
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <div className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200">
              We're Here to Help
            </div>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Have questions about Thread Nova? Need technical support? Want to explore enterprise options? 
            Our team is ready to assist you.
          </p>
        </motion.div>
      </section>

      {/* Contact Methods */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <div className="text-white">
                    {method.icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{method.title}</h3>
                <p className="text-gray-400 text-sm mb-3 leading-relaxed">{method.description}</p>
                
                <div className="space-y-2">
                  <p className="text-purple-400 font-medium text-sm">{method.contact}</p>
                  <p className="text-gray-500 text-xs">{method.response}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="general">General Question</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Issue</option>
                    <option value="feature">Feature Request</option>
                    <option value="enterprise">Enterprise Inquiry</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    placeholder="Tell us how we can help you..."
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </motion.button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
                
                <div className="space-y-4">
                  {officeInfo.map((info, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <div className="text-purple-400">
                          {info.icon}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{info.label}</p>
                        <p className="text-white font-medium">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Quick Support</h3>
                </div>
                
                <p className="text-gray-300 mb-4">
                  Need immediate help? Join our Discord community for real-time support from our team and other users.
                </p>
                
                <motion.a
                  href="https://discord.gg/threadnova"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  <MessageSquare className="w-5 h-5" />
                  Join Discord
                </motion.a>
              </div>

              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">Frequently Asked</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-purple-400 font-medium text-sm">How quickly do you respond?</p>
                    <p className="text-gray-400 text-sm">Most support tickets are answered within 24 hours.</p>
                  </div>
                  <div>
                    <p className="text-purple-400 font-medium text-sm">Do you offer phone support?</p>
                    <p className="text-gray-400 text-sm">We primarily use email and Discord for faster, documented support.</p>
                  </div>
                  <div>
                    <p className="text-purple-400 font-medium text-sm">Can I schedule a demo?</p>
                    <p className="text-gray-400 text-sm">Yes! Contact our enterprise team for personalized demos.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact; 