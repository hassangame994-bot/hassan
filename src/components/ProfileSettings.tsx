import React, { useState, useEffect } from 'react';
import { User, Shield, Lock, Eye, EyeOff, Loader2, KeyRound, Check, X, AlertTriangle } from 'lucide-react';
import { User as UserType } from '../types.js';

interface ProfileSettingsProps {
  user: UserType;
  lang: 'ar' | 'en';
  onUpdateUser: (updatedUser: UserType) => void;
  addToast: (title: string, message: string, type: 'info' | 'success' | 'warning') => void;
}

export default function ProfileSettings({
  user,
  lang,
  onUpdateUser,
  addToast,
}: ProfileSettingsProps) {
  const isAr = lang === 'ar';

  const [username, setUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacyEnabled, setPrivacyEnabled] = useState(user.privacyEnabled || false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    setUsername(user.username);
    setPrivacyEnabled(user.privacyEnabled || false);
  }, [user]);

  // Real-time password strength criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const isPasswordValid = !newPassword || (hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial);
  const isSubAdmin = user.role === 'admin' && !user.isSuperAdmin && user.id !== 'admin-1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubAdmin) {
      addToast(
        isAr ? '❌ إجراء غير مصرح' : '❌ Unauthorized Action',
        isAr ? 'عذراً، حسابات الإدارة الفرعية غير مصرح لها بتعديل بيانات الدخول الخاصة بها.' : 'Sub-admin accounts are not permitted to change their access credentials.',
        'warning'
      );
      return;
    }

    const isUsernameChanged = username.trim() !== user.username;
    const isPasswordChanged = !!newPassword;
    const isPrivacyChanged = privacyEnabled !== (user.privacyEnabled || false);

    if (!isUsernameChanged && !isPasswordChanged && !isPrivacyChanged) {
      addToast(
        isAr ? 'ℹ️ لم يتم تغيير أي شيء' : 'ℹ️ Nothing changed',
        isAr ? 'البيانات المدخلة مطابقة تماماً للمعلومات الحالية.' : 'The information entered is identical to current.',
        'info'
      );
      return;
    }

    if ((isUsernameChanged || isPasswordChanged) && !currentPassword) {
      addToast(
        isAr ? '⚠️ عذراً' : '⚠️ Warning',
        isAr ? 'يرجى إدخال كلمة المرور الحالية لتأكيد الهوية وتطبيق التعديلات' : 'Please enter your current password to apply credentials changes',
        'warning'
      );
      return;
    }

    if (isPasswordChanged) {
      if (!isPasswordValid) {
        addToast(
          isAr ? '⚠️ كلمة مرور ضعيفة' : '⚠️ Weak Password',
          isAr ? 'تأكد من استيفاء جميع شروط القوة لكلمة المرور الجديدة' : 'Please satisfy all strength conditions for the new password',
          'warning'
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        addToast(
          isAr ? '⚠️ خطأ في التطابق' : '⚠️ Matching Error',
          isAr ? 'كلمتا المرور الجديدتان غير متطابقتين' : 'New passwords do not match',
          'warning'
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'Authorization': user.token ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({
          userId: user.id,
          newUsername: isUsernameChanged ? username.trim() : undefined,
          currentPassword: currentPassword || undefined,
          newPassword: isPasswordChanged ? newPassword : undefined,
          privacyEnabled: privacyEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isAr ? 'فشل تحديث البيانات' : 'Failed to update credentials'));
      }

      onUpdateUser(data.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      addToast(
        isAr ? '🛡️ تم حفظ البيانات بنجاح' : '🛡️ Changes Saved Successfully',
        isAr ? 'تم تحديث وتأمين بيانات حسابك بنجاح طبقاً لأعلى معايير الحماية' : 'Your account information has been updated and secured',
        'success'
      );
    } catch (err: any) {
      addToast(
        isAr ? '❌ فشل التحديث' : '❌ Update Failed',
        err.message || 'Error updating credentials',
        'warning'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[32px] border border-[#E5E2D9] shadow-xl overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-[#111] via-[#222] to-[#111] p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center p-4">
          <Shield className="w-48 h-48 -mr-16" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center text-3xl font-serif font-black select-none">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
              {isAr ? 'إعدادات الأمان وحسابي' : 'Security & Account Settings'}
              <span className="text-[#f3a216] text-sm">🔒</span>
            </h2>
            <p className="text-xs text-gray-300 font-medium mt-1">
              {isAr ? 'قم بحماية حسابك وتعديل اسم المستخدم وكلمة المرور في أي وقت' : 'Strengthen your username, password, and manage connection privacy'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        
        {isSubAdmin && (
          <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-5 space-y-3 animate-fade-in text-right">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-rose-900">
                  {isAr ? 'عذراً: حسابك لا يمتلك صلاحية تغيير بيانات الدخول' : 'Access Restricted: Sub-Admin Account'}
                </h4>
                <p className="text-[11px] text-rose-800 font-semibold leading-relaxed mt-1">
                  {isAr
                    ? 'بسبب السياسات الأمنية المشددة للمطبخ، يمتلك المدير الأصلي والمالك الفوقي للنظام (Abu-Qura) الصلاحية الحصرية لتعديل أسماء حسابات الإدارة وكلمات المرور الخاصة بها لمنع عمليات انتحال الشخصية أو قفل الحسابات العشوائي.'
                    : 'Under our strict security model, only the original Super Admin (Abu-Qura) is authorized to modify credentials for kitchen administration profiles to prevent identity spoofing or accidental lockouts.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PRIVACY PROTECTION SEGMENT */}
        <div className="bg-[#FAF9F6] rounded-2xl p-5 border border-[#E5E2D9] space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-[#231d1a]">
                {isAr ? 'حماية الحساب ومنع مشاركة الجلسة العشوائية' : 'Session & Profile Privacy Protection'}
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
                {isAr 
                  ? 'عند التفعيل، لن يتمكن أي طرف خارجي من مشاركة الحساب أو تتبع الطلبيات السابقة، وسيتم فرض نظام تحقق صارم على تسجيل الدخول لضمان الحماية المطلقة.'
                  : 'Enforce strict connection bounds to prevent session hijacking and unauthorized profile sharing.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E2D9]/60 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">
              {isAr ? 'تفعيل الخصوصية والحماية ضد المشاركة' : 'Activate anti-sharing privacy mode'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyEnabled}
                onChange={(e) => setPrivacyEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* ACCOUNT CREDENTIALS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-[#231d1a] uppercase tracking-wider border-b border-gray-100 pb-2">
            {isAr ? 'تعديل بيانات الدخول' : 'Access Credentials'}
          </h3>

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              {isAr ? 'اسم المستخدم الحالي أو الجديد' : 'Current or New Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={isSubAdmin}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm font-semibold transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                placeholder={isAr ? 'أدخل اسم المستخدم الجديد' : 'Enter username'}
              />
              <span className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400`}>
                <User className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Change Password Block */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-gold" />
              <span className="text-xs font-black text-gray-700">
                {isAr ? 'تغيير كلمة المرور لتشديد الحماية (اختياري)' : 'Modify Password to Strengthen Security (Optional)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    disabled={isSubAdmin}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm font-sans transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    disabled={isSubAdmin}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400 hover:text-gray-600 cursor-pointer`}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    disabled={isSubAdmin}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm font-sans transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400 hover:text-gray-600 cursor-pointer`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password strength criteria list */}
            {newPassword && (
              <div className="bg-white rounded-xl p-3 border border-gray-100 text-[10px] space-y-1.5 font-semibold">
                <p className="text-gray-500 font-black mb-1">
                  {isAr ? 'مؤشرات أمان كلمة المرور الجديدة:' : 'New Password strength metrics:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1">
                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                    <span className={hasMinLength ? 'text-emerald-700' : 'text-gray-400'}>{isAr ? '8 أحرف أو أكثر' : '8+ Characters'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                    <span className={hasUppercase ? 'text-emerald-700' : 'text-gray-400'}>{isAr ? 'حرف كبير واحد على الأقل (A-Z)' : 'One uppercase letter'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                    <span className={hasLowercase ? 'text-emerald-700' : 'text-gray-400'}>{isAr ? 'حرف صغير واحد على الأقل (a-z)' : 'One lowercase letter'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                    <span className={hasNumber ? 'text-emerald-700' : 'text-gray-400'}>{isAr ? 'رقم واحد على الأقل (0-9)' : 'One number'}</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-1 sm:col-span-2">
                    {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                    <span className={hasSpecial ? 'text-emerald-700' : 'text-gray-400'}>{isAr ? 'رمز خاص واحد على الأقل (!@#$%^&*)' : 'One special character (!@#$%^&*)'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECURITY CONFIRMATION KEY */}
        {(username !== user.username || !!newPassword) && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-3 animate-fade-in">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 font-bold leading-relaxed">
                {isAr 
                  ? 'لتأكيد هذا الإجراء الحساس (تغيير بيانات الدخول)، يرجى إدخال كلمة المرور الحالية لحسابك منعاً لعمليات الاحتيال.' 
                  : 'To complete this sensitive action, please supply your current account password.'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-900 block">
                {isAr ? 'كلمة المرور الحالية للتحقق من هويتك' : 'Confirm Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm font-sans transition-all bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400 hover:text-gray-600 cursor-pointer`}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT FORM BUTTON */}
        <button
          type="submit"
          disabled={loading || isSubAdmin}
          className="w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-light text-brand-gold font-bold text-sm shadow-lg shadow-brand-primary/10 transition-all duration-200 tap-scale flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
          ) : (
            <span>🛡️ {isAr ? 'حفظ وتثبيت تعديلات الأمان' : 'Save & Secure Account'}</span>
          )}
        </button>

      </form>
    </div>
  );
}
