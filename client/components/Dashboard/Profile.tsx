import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Check } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '../Auth/AuthProvider';

export default function Profile() {
  const { user, dbUser } = useAuth();
  
  // Debug logging
  useEffect(() => {
    console.log('Profile component rendering with user data:', { user, dbUser });
  }, [user, dbUser]);
  
  // Use dbUser data or default values if not available
  const userData = dbUser || {
    id: 'user-123',
    email: 'example@example.com',
    created_at: new Date().toISOString(),
    is_premium: false
  };
  
  const [formData, setFormData] = useState({
    fullName: userData.fullName || 'User',
    email: userData.email,
    username: userData.username || userData.email?.split('@')[0] || 'username',
    bio: userData.bio || 'Content creator specializing in tech threads'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Mock API call - in real app, this would save to your API
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (formData.fullName && formData.fullName.length > 0) {
      return formData.fullName.charAt(0).toUpperCase();
    }
    if (formData.email && formData.email.length > 0) {
      return formData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl -z-5"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-5"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Back Button */}
        <Link href="/dashboard">
          <a className="inline-flex items-center text-gray-300 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Back to Dashboard</span>
          </a>
        </Link>
        
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
              <p className="text-gray-300 text-sm">Manage your personal information</p>
            </div>
          </div>
          
          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {getInitials()}
                  </div>
                  <button 
                    type="button"
                    className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-white mb-2">Profile Picture</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Upload a profile picture to personalize your account
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                  >
                    Upload Image
                  </button>
                </div>
              </div>
              
              {/* Personal Information */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <User className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-10 py-2 bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none rounded-lg text-white placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Mail className="w-5 h-5" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-10 py-2 bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none rounded-lg text-white placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none rounded-lg text-white placeholder-gray-500 transition-all"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none rounded-lg text-white placeholder-gray-500 transition-all resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* Save Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/dashboard">
                  <a className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                    Cancel
                  </a>
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg ${
                    isSaving ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 