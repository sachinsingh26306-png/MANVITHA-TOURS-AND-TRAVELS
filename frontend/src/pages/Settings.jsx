import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Key, User, Mail, Phone, FileText, Camera, CheckCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const { user, refreshProfile, isDriver } = useAuth();

  // Profile Details Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // Profile Picture Upload States
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Password Reset Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Show/Hide password toggle states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status Alerts
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Load user data into form on mount
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhoneVal(user.phone || user.driverProfile?.phone || '');
      if (user.driverProfile) {
        setLicenseNumber(user.driverProfile.licenseNumber || '');
      }
      setAvatarPreview(user.profileImageUrl || '');
    }
  }, [user]);

  // Profile Image picker preview handler
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Submit Profile Info Handler
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    if (!name || !email) {
      setProfileError('Name and Email are required.');
      setProfileLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phoneVal);
    if (isDriver) {
      formData.append('licenseNumber', licenseNumber);
    }
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      await api.auth.updateProfile(formData);
      await refreshProfile(); // Refresh app context to update header and sidebars
      setProfileSuccess('Profile details updated successfully!');
      setAvatarFile(null);
    } catch (err) {
      console.error(err);
      setProfileError(err.message || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit Password Change Handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);

    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Account Settings</h1>
        <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
          Manage your personal details, uploads, and security settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Card 1: Personal Profile Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
              <User className="h-5.5 w-5.5 text-blue-500" />
              <h2 className="text-lg font-bold">Personal Information</h2>
            </div>

            {profileError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-semibold text-emerald-600 dark:border-emerald-950/30 dark:bg-emerald-950/10 dark:text-emerald-400 flex items-start gap-2">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              
              {/* Profile Image Picker */}
              <div className="flex items-center gap-4 py-2">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-center shadow-inner">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar Preview" 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <User className="h-10 w-10 text-slate-400 stroke-1" />
                  )}
                </div>

                <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-slate-650 dark:text-zinc-300 cursor-pointer transition-all">
                  <Camera className="h-4 w-4" />
                  Upload Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              {/* Name field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              {/* Email field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus:border-blue-500"
                    placeholder="name@manivtha.com"
                  />
                </div>
              </div>

              {/* Phone number field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus:border-blue-500"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              {/* License Number (Drivers Only) */}
              {isDriver && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">License Number</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-mono outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus:border-blue-500"
                      placeholder="DL-XXXXXXXXXXXXX"
                    />
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex w-full justify-center items-center rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {profileLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Save Details'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Card 2: Password Security settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
              <Key className="h-5.5 w-5.5 text-blue-500" />
              <h2 className="text-lg font-bold">Password Security</h2>
            </div>

            {passwordError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-semibold text-emerald-600 dark:border-emerald-950/30 dark:bg-emerald-950/10 dark:text-emerald-400 flex items-start gap-2">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus:border-blue-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus:border-blue-500"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:focus:border-blue-500"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex w-full justify-center items-center rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
