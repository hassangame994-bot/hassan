import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  User, 
  Loader2, 
  KeyRound, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { User as UserType } from '../types.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  lang: 'ar' | 'en';
  allowAdmin?: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess, lang, allowAdmin = false }: AuthModalProps) {
  const isAr = lang === 'ar';
  const [isAdminMode, setIsAdminMode] = useState(allowAdmin);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Fields state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsAdminMode(allowAdmin);
      setIsRegisterMode(false);
      setError('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, allowAdmin]);

  if (!isOpen) return null;

  // Real-time password criteria validation helper
  const getPasswordCriteria = (pwd: string) => {
    return {
      hasLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasDigit: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  };

  const pwdCriteria = getPasswordCriteria(password);
  const strengthScore = Object.values(pwdCriteria).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    // Admin Login Mode
    if (isAdminMode) {
      if (!username.trim() || !password) {
        setError(isAr ? 'برجاء إدخال اسم المستخدم وكلمة المرور الإدارية' : 'Please enter admin credentials');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password,
            isAdminLogin: true,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || (isAr ? 'فشل تسجيل الدخول كمدير' : 'Admin authentication failed'));
        }
        onSuccess(data.user);
        onClose();
      } catch (err: any) {
        setError(err.message || (isAr ? 'عذراً، حدث خطأ ما' : 'An error occurred'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Customer Login Mode
    if (!isRegisterMode) {
      if (!email.trim() || !password) {
        setError(isAr ? 'برجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            isAdminLogin: false,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || (isAr ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password'));
        }
        onSuccess(data.user);
        onClose();
      } catch (err: any) {
        setError(err.message || (isAr ? 'عذراً، حدث خطأ ما' : 'An error occurred'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Customer Register Mode
    if (isRegisterMode) {
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        setError(isAr ? 'برجاء ملء جميع الحقول المطلوبة' : 'Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
        return;
      }

      const isStrong = Object.values(pwdCriteria).every(Boolean);
      if (!isStrong) {
        setError(isAr 
          ? 'برجاء التأكد من استيفاء جميع شروط كلمة المرور القوية' 
          : 'Please fulfill all password strength requirements');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || (isAr ? 'فشل إنشاء الحساب' : 'Registration failed'));
        }
        onSuccess(data.user);
        onClose();
      } catch (err: any) {
        setError(err.message || (isAr ? 'عذراً، حدث خطأ ما' : 'An error occurred'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-brand-primary/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-gold to-brand-primary"></div>

        {/* Header */}
        <div className="px-6 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-extrabold text-brand-primary">
              {isAdminMode 
                ? (isAr ? 'بوابة الإدارة والمراقبة' : 'Admin Command Center') 
                : isRegisterMode
                  ? (isAr ? 'إنشاء حساب جديد ومؤمن' : 'Secure Registration')
                  : (isAr ? 'مرحباً بك في أبو قورة' : 'Abu Qura Culinary Hub')}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {isAdminMode 
                ? (isAr ? 'سجل الدخول لإدارة ومراقبة الطلبات والمنيو' : 'Authenticate to access secure restaurant dashboard') 
                : isRegisterMode
                  ? (isAr ? 'سجل بياناتك بكلمة مرور قوية لتأمين حسابك وطلباتك' : 'Create an account with a robust password to secure your deliveries')
                  : (isAr ? 'سجل دخولك بالبريد الإلكتروني لمتابعة طلباتك السابقة وفاتورتك' : 'Log in to track orders, save shipping maps, and check profiles')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Mode */}
        {allowAdmin && (
          <div className="px-6 py-1">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(false);
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  !isAdminMode 
                    ? 'bg-white text-brand-primary shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل دخول عميل' : 'Customer Portal'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(true);
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  isAdminMode 
                    ? 'bg-brand-primary text-brand-gold shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-brand-gold" />
                <span>{isAr ? 'مدير المطعم (الأدمين)' : 'Admin Portal'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* REGISTER MODE UNIQUE FIELD: Username */}
          {!isAdminMode && isRegisterMode && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-brand-primary">
                {isAr ? 'اسم المستخدم (الاسم الكامل)' : 'Full Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isAr ? 'مثال: أحمد عبد الله أبو قورة' : 'e.g. Ahmed Abu Qura'}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm transition-all"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400`}>
                  <User className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}

          {/* EMAIL FIELD (Required for Customer Login/Register) */}
          {(!isAdminMode || isRegisterMode) ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-primary">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAr ? 'name@example.com' : 'name@example.com'}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm transition-all ltr"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400`}>
                  <Mail className="w-4 h-4" />
                </span>
              </div>
            </div>
          ) : (
            /* ADMIN LOGIN MODE UNIQUE FIELD: Admin Username */
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-primary">
                {isAr ? 'اسم مستخدم المدير' : 'Admin Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isAr ? 'أدخل اسم المستخدم' : 'Enter username'}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm transition-all"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400`}>
                  <User className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}

          {/* PASSWORD FIELD */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-brand-primary">
                {isAdminMode 
                  ? (isAr ? 'كلمة المرور الإدارية' : 'Admin Password') 
                  : (isAr ? 'كلمة المرور' : 'Password')}
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400 hover:text-brand-primary transition-colors`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* PASSWORD STRENGTH METER & VERIFICATION CHECKLIST (Shown in Register Mode) */}
            {!isAdminMode && isRegisterMode && password.length > 0 && (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl space-y-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Strength Meter Bar */}
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                  <span>{isAr ? 'قوة كلمة المرور:' : 'Password Strength:'}</span>
                  <span className={
                    strengthScore <= 2 ? 'text-red-600' : strengthScore <= 4 ? 'text-amber-600' : 'text-emerald-600'
                  }>
                    {strengthScore <= 2 
                      ? (isAr ? 'ضعيفة جداً 🛑' : 'Too Weak 🛑') 
                      : strengthScore <= 4 
                        ? (isAr ? 'متوسطة الأمان ⚠️' : 'Moderate Security ⚠️') 
                        : (isAr ? 'آمنة وقوية جداً ممتاز ✅' : 'Extremely Strong & Secure ✅')}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div 
                      key={level} 
                      className={`h-full flex-1 transition-all duration-300 ${
                        level <= strengthScore 
                          ? strengthScore <= 2 
                            ? 'bg-rose-500' 
                            : strengthScore <= 4 
                              ? 'bg-amber-400' 
                              : 'bg-emerald-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Checklist Rules */}
                <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 font-semibold font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-0.5 rounded-full ${pwdCriteria.hasLength ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{isAr ? '8 خانات على الأقل' : 'Min 8 characters'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`p-0.5 rounded-full ${pwdCriteria.hasUpper ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{isAr ? 'حرف كبير (A-Z)' : 'Uppercase letter'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`p-0.5 rounded-full ${pwdCriteria.hasLower ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{isAr ? 'حرف صغير (a-z)' : 'Lowercase letter'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`p-0.5 rounded-full ${pwdCriteria.hasDigit ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{isAr ? 'رقم واحد (0-9)' : 'Numeric digit'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className={`p-0.5 rounded-full ${pwdCriteria.hasSpecial ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{isAr ? 'رمز خاص (!@#$%^&*)' : 'Special symbol (!@#$%^&*)'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CONFIRM PASSWORD FIELD (Shown in Register Mode) */}
          {!isAdminMode && isRegisterMode && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-brand-primary">
                {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm transition-all"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400`}>
                  <Lock className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-light text-brand-gold font-bold text-sm shadow-lg shadow-brand-primary/10 transition-all duration-200 tap-scale flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
            ) : (
              <span>
                {isAdminMode 
                  ? (isAr ? 'تسجيل دخول الإدارة' : 'Login as Admin') 
                  : isRegisterMode
                    ? (isAr ? 'إنشاء حسابي المؤمّن الآن 🛡️' : 'Create Secure Account 🛡️')
                    : (isAr ? 'تسجيل الدخول الآمن 🔑' : 'Secure Login 🔑')}
              </span>
            )}
          </button>
        </form>

        {/* Form Mode Toggle Footer (Not in Admin Mode) */}
        {!isAdminMode && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">
              {isRegisterMode 
                ? (isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?') 
                : (isAr ? 'ليس لديك حساب؟' : "Don't have an account?")}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
              }}
              className="text-brand-primary font-black hover:underline cursor-pointer transition-all"
            >
              {isRegisterMode 
                ? (isAr ? 'تسجيل الدخول' : 'Sign In') 
                : (isAr ? 'إنشاء حساب جديد' : 'Register Now')}
            </button>
          </div>
        )}

        {/* Security watermark */}
        <div className="px-6 py-3 text-center bg-gray-100/50">
          <span className="text-[9px] text-gray-400 font-bold tracking-wider uppercase flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            {isAr 
              ? 'تشفير ثنائي الأطراف PBKDF2 للبيانات وتأمين الحسابات' 
              : 'End-to-End PBKDF2 Password Hashing & Active Protection'}
          </span>
        </div>
      </div>
    </div>
  );
}
