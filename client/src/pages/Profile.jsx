import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun, Monitor, Smartphone, Shield, Mail, Laptop } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setTheme } from '../store/slices/uiSlice';
import api from '../services/api';
import Button from '../components/Button';
import GlassCard from '../components/ui/GlassCard';
import { validateLoginPassword, validatePassword } from '../utils/authValidation';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [emailPrefs, setEmailPrefs] = useState({ marketing: true, courseUpdates: true, weeklyDigest: false });
  const [emailPrefsMsg, setEmailPrefsMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      if (user.emailPreferences) {
        setEmailPrefs({
          marketing: user.emailPreferences.marketing ?? true,
          courseUpdates: user.emailPreferences.courseUpdates ?? true,
          weeklyDigest: user.emailPreferences.weeklyDigest ?? false,
        });
      }
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      await api.patch('/profile', { name, avatar: avatar || '' });
      await refreshUser();
      setProfileMsg('Profile saved.');
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    const currentError = validateLoginPassword(currentPassword);
    const newError = validatePassword(newPassword);
    if (currentError || newError) {
      setPasswordMsg(currentError || newError);
      return;
    }
    setSaving(true);
    try {
      await api.patch('/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMsg('Password updated.');
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const saveEmailPreferences = async () => {
    setSaving(true);
    setEmailPrefsMsg('');
    try {
      await api.patch('/email-preferences', emailPrefs);
      await refreshUser();
      setEmailPrefsMsg('Email preferences saved.');
    } catch (err) {
      setEmailPrefsMsg(err.response?.data?.message || 'Failed to save email preferences');
    } finally {
      setSaving(false);
    }
  };

  const tabs = ['Profile', 'Password', 'Preferences', 'Security'];

  return (
    <div>
      <h1 className="section-title">Profile & Settings</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your account, security, and preferences</p>

      <Tab.Group className="mt-8">
        <Tab.List className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-700">
          {tabs.map((t) => (
            <Tab
              key={t}
              className={({ selected }) =>
                `pb-3 text-sm font-semibold outline-none ${
                  selected
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              {t}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6 max-w-2xl">
          <Tab.Panel>
            <GlassCard className="p-6">
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-2xl font-bold text-white">
                    {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Profile photo</p>
                    <p className="text-xs text-slate-400">Paste an image URL below</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="input-field mt-1 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Avatar URL</label>
                  <input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="input-field mt-1"
                  />
                </div>
                {profileMsg && <p className="text-sm text-primary-600">{profileMsg}</p>}
                <Button type="submit" disabled={saving}>
                  Save profile
                </Button>
              </form>
            </GlassCard>
          </Tab.Panel>

          <Tab.Panel>
            <GlassCard className="p-6">
              <form onSubmit={savePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field mt-1"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Min 8 characters with uppercase, lowercase, and a number.
                  </p>
                </div>
                {passwordMsg && <p className="text-sm text-primary-600">{passwordMsg}</p>}
                <Button type="submit" disabled={saving}>
                  Update password
                </Button>
              </form>
            </GlassCard>
          </Tab.Panel>

          <Tab.Panel className="space-y-4">
            <GlassCard className="p-6">
              <p className="font-semibold text-slate-900 dark:text-white">Appearance</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose light, dark, or match your system settings. Saved automatically.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => dispatch(setTheme(id))}
                    className={`theme-option ${theme === id ? 'theme-option-active' : ''}`}
                  >
                    <Icon className="h-6 w-6" />
                    {label}
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 font-medium">
                <Mail className="h-5 w-5 text-primary-500" />
                Email Preferences
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { key: 'marketing', label: 'Marketing emails' },
                  { key: 'courseUpdates', label: 'Course updates' },
                  { key: 'weeklyDigest', label: 'Weekly learning digest' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{label}</span>
                    <input
                      type="checkbox"
                      checked={emailPrefs[key]}
                      onChange={(e) => setEmailPrefs({ ...emailPrefs, [key]: e.target.checked })}
                      className="rounded border-slate-300 text-primary-500"
                    />
                  </label>
                ))}
              </div>
              {emailPrefsMsg && <p className="mt-4 text-sm text-primary-600">{emailPrefsMsg}</p>}
              <Button type="button" onClick={saveEmailPreferences} disabled={saving} className="mt-5">
                Save email preferences
              </Button>
            </GlassCard>
          </Tab.Panel>

          <Tab.Panel className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary-500" />
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">Add an extra layer of security (WebAuthn ready)</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                Enable 2FA
              </Button>
            </GlassCard>

            <GlassCard className="p-6">
              <p className="font-medium">Device History</p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <Monitor className="h-5 w-5 text-slate-400" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">Windows · Chrome</p>
                    <p className="text-slate-500">Current session · Active now</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <Smartphone className="h-5 w-5 text-slate-400" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">Mobile · Safari</p>
                    <p className="text-slate-500">Last active 2 days ago</p>
                  </div>
                </li>
              </ul>
            </GlassCard>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
