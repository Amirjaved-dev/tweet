import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Bell, 
  User,
  Moon,
  Sun,
  Save,
  Mail,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import { Link } from 'wouter';
import { useUserData } from '../../hooks/useUserData';

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { isPremium } = useUserData();
  
  const [settings, setSettings] = useState({
      displayName: user?.fullName || '',
      theme: 'dark',
    emailNotifications: true,
    pushNotifications: true,
    showProfile: true,
    autoSave: true
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('user_settings');
    if (saved) {
      setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    
    // Save to localStorage (in real app, save to database)
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    // Fake API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    try {
      await signOut();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      {/* Cool background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
            <a className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
          </a>
        </Link>
        
            <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-purple-400" />
            </div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
        </div>

        {/* Main Settings Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-6">
          
          {/* Profile Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Your Profile
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="Your name"
                />
                <p className="text-sm text-gray-400 mt-1">How others see you</p>
              </div>
            </div>
          </div>
          
          {/* Appearance */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-purple-400" />}
              Look & Feel
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Theme</p>
                <p className="text-sm text-gray-400">Dark mode is easier on the eyes</p>
              </div>
          <button
                onClick={() => setSettings(prev => ({ 
                  ...prev, 
                  theme: prev.theme === 'dark' ? 'light' : 'dark' 
                }))}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.theme === 'dark' ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                }`} />
          </button>
        </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Auto-save work</p>
                <p className="text-sm text-gray-400">Save your progress automatically</p>
              </div>
                  <button
                onClick={() => setSettings(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.autoSave ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.autoSave ? 'translate-x-8' : 'translate-x-1'
                }`} />
                  </button>
            </div>
          </div>

          {/* Notifications */}
                  <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              Notifications
            </h2>
            
                      <div className="flex items-center justify-between">
                        <div>
                <p className="text-white">Email updates</p>
                <p className="text-sm text-gray-400">Get notified about important stuff</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.emailNotifications ? 'translate-x-8' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
                      <div className="flex items-center justify-between">
                        <div>
                <p className="text-white">Push notifications</p>
                <p className="text-sm text-gray-400">Instant alerts on your device</p>
                    </div>
                      <button
                onClick={() => setSettings(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.pushNotifications ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.pushNotifications ? 'translate-x-8' : 'translate-x-1'
                }`} />
                              </button>
              </div>
            </div>
            
          {/* Privacy */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Privacy
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Public profile</p>
                <p className="text-sm text-gray-400">Let others find and see your profile</p>
                      </div>
                          <button
                onClick={() => setSettings(prev => ({ ...prev, showProfile: !prev.showProfile }))}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.showProfile ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.showProfile ? 'translate-x-8' : 'translate-x-1'
                }`} />
                          </button>
                        </div>
                      </div>
                      
          {/* Account Info */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Account
            </h2>
            
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-white">Email: {user?.emailAddresses[0]?.emailAddress}</p>
              <p className="text-sm text-gray-400 mt-1">
                Account type: {isPremium ? 'Premium ✨' : 'Free'}
                        </p>
                      </div>
                    </div>

          {/* Save Button */}
          <div className="pt-4">
                          <button 
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
                      </button>
                    </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-red-500/20">
            <h3 className="text-red-400 font-medium mb-4">Danger Zone</h3>
                        <button
              onClick={handleDeleteAccount}
              className={`${
                showDeleteConfirm 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300'
              } px-4 py-2 rounded-lg transition-colors flex items-center gap-2`}
            >
              <Trash2 className="w-4 h-4" />
              {showDeleteConfirm ? 'Click again to confirm delete' : 'Delete Account'}
                          </button>
          </div>
        </div>
      </div>
    </div>
  );
} 