import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Plus, Trash2, Edit3, Loader2, UserPlus, ToggleLeft, ToggleRight, Check, Activity, Terminal, RefreshCw, AlertTriangle } from 'lucide-react';
import { User } from '../types.js';

interface AdminAccountsPanelProps {
  user: User | null;
  lang: 'ar' | 'en';
  setAdminNotification: React.Dispatch<React.SetStateAction<{
    show: boolean;
    type: 'error' | 'success';
    messageAr: string;
    messageEn: string;
  }>>;
}

export default function AdminAccountsPanel({
  user,
  lang,
  setAdminNotification
}: AdminAccountsPanelProps) {
  const isAr = lang === 'ar';
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Security login logs states
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form states for creating/editing accounts
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null
  });

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/login-logs', {
        headers: {
          'x-user-id': user?.id || '',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin login logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'x-user-id': user?.id || '',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }
    } catch (err: any) {
      console.error('Failed to fetch accounts:', err);
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: '❌ عذراً، فشل تحميل قائمة الحسابات من الخادم',
        messageEn: '❌ Failed to load accounts list from server'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchLogs();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('account-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleOpenEdit = (acc: User) => {
    setEditingId(acc.id);
    setForm({
      username: acc.username,
      email: acc.email || '',
      password: '', // Empty means leave unchanged unless input is filled
      role: acc.role
    });
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('account-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || (!editingId && (!form.email.trim() || !form.password))) {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: '⚠️ يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح',
        messageEn: '⚠️ Please fill in all required fields'
      });
      return;
    }

    setActionLoading('submit');
    try {
      if (editingId) {
        // Edit existing user
        const res = await fetch(`/api/admin/users/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'Authorization': user?.token ? `Bearer ${user.token}` : ''
          },
          body: JSON.stringify({
            username: form.username,
            password: form.password ? form.password : undefined,
            role: form.role
          })
        });

        if (res.ok) {
          setAdminNotification({
            show: true,
            type: 'success',
            messageAr: '✅ تم تعديل بيانات الحساب بنجاح',
            messageEn: '✅ Account updated successfully'
          });
          setShowForm(false);
          fetchAccounts();
        } else {
          const err = await res.json();
          throw new Error(err.error);
        }
      } else {
        // Create new user/staff
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'Authorization': user?.token ? `Bearer ${user.token}` : ''
          },
          body: JSON.stringify(form)
        });

        if (res.ok) {
          setAdminNotification({
            show: true,
            type: 'success',
            messageAr: '✅ تم إنشاء الحساب الجديد بنجاح في قاعدة البيانات',
            messageEn: '✅ New account successfully saved to database'
          });
          setShowForm(false);
          fetchAccounts();
        } else {
          const err = await res.json();
          throw new Error(err.error);
        }
      }
    } catch (err: any) {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: `❌ خطأ: ${err.message || 'فشلت العملية'}`,
        messageEn: `❌ Error: ${err.message || 'Operation failed'}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (acc: User) => {
    if (acc.id === 'admin-1') {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: '❌ لا يمكن تعديل رتبة الأدمن الأصلي',
        messageEn: '❌ Cannot modify the role of original admin'
      });
      return;
    }

    const nextRole = acc.role === 'admin' ? 'user' : 'admin';
    setActionLoading(`role_${acc.id}`);
    try {
      const res = await fetch(`/api/admin/users/${acc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify({
          role: nextRole
        })
      });

      if (res.ok) {
        setAdminNotification({
          show: true,
          type: 'success',
          messageAr: `✅ تم تعديل صلاحيات ${acc.username} بنجاح`,
          messageEn: `✅ Permission updated for ${acc.username} successfully`
        });
        fetchAccounts();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: `❌ فشلت ترقية/تنزيل الحساب: ${err.message}`,
        messageEn: `❌ Failed to toggle permission: ${err.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  const triggerDeleteConfirm = (acc: User) => {
    if (acc.id === 'admin-1') {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: '❌ غير مسموح بنهائياً حذف الحساب الأدمن الأصلي (المالك الرئيسي)',
        messageEn: '❌ You cannot delete the original system admin'
      });
      return;
    }

    if (acc.id === user?.id) {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: '❌ لا يمكنك حذف حسابك الشخصي الجاري تسجيل الدخول به',
        messageEn: '❌ You cannot delete your currently active account'
      });
      return;
    }

    setConfirmDelete({
      isOpen: true,
      user: acc
    });
  };

  const executeDelete = async () => {
    const acc = confirmDelete.user;
    if (!acc) return;

    setActionLoading(`del_${acc.id}`);
    setConfirmDelete({ isOpen: false, user: null });
    try {
      const res = await fetch(`/api/admin/users/${acc.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        }
      });

      if (res.ok) {
        setAdminNotification({
          show: true,
          type: 'success',
          messageAr: '✅ تم مسح وحذف الحساب من قاعدة البيانات بنجاح',
          messageEn: '✅ Account deleted from database successfully'
        });
        fetchAccounts();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: `❌ فشل الحذف: ${err.message}`,
        messageEn: `❌ Deletion failed: ${err.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Upper banner section */}
      <div className="bg-white border border-[#E5E2D9] p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="space-y-1.5 max-w-2xl">
          <h3 className="text-xl font-black text-[#3D4021] font-serif flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#f3a216]" />
            <span>{isAr ? 'التحكم الفائق وإدارة حسابات المطبخ' : 'Super Administrator Accounts Control'}</span>
          </h3>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            {isAr 
              ? 'بصفتك المدير الأصلي، يمكنك الإشراف على جميع موظفي المطبخ، وتعديل الأسماء وكلمات المرور الخاصة بهم مباشرة، وترقيتهم إلى رتبة مدير أو حذفهم كلياً من قاعدة البيانات.' 
              : 'As the Original Owner, you can oversee all staff, manage usernames & reset passwords directly, upgrade accounts to admins, or completely purge them from the database.'}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-[#3D4021] hover:bg-[#3D4021]/90 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-brand-gold" />
          <span>{isAr ? 'إضافة موظف/حساب جديد' : 'Add New Account'}</span>
        </button>
      </div>

      {/* Account creation / editing overlay card */}
      {showForm && (
        <div id="account-form-container" className="bg-white border-2 border-brand-gold/40 p-6 sm:p-8 rounded-3xl relative shadow-md animate-fade-in space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E2D9] pb-4">
            <h4 className="text-base font-black text-[#3D4021] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-gold" />
              <span>
                {editingId 
                  ? (isAr ? 'تعديل بيانات الحساب والتحكم بالباسورد' : 'Modify Account Credentials & Passwords') 
                  : (isAr ? 'إنشاء حساب موظف أو مستخدم جديد' : 'Create New Staff or User Account')}
              </span>
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                {isAr ? 'اسم المستخدم (الاسم المعروض)' : 'Username (Display Name)'}
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. Abu-Ahmed"
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E2D9] text-sm font-bold bg-[#FAF9F6] text-[#2D241E] focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                required={!editingId}
                disabled={!!editingId}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. employee@abuqura.com"
                className={`w-full px-4 py-3 rounded-2xl border border-[#E5E2D9] text-sm font-bold bg-[#FAF9F6] text-[#2D241E] focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 ${editingId ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {editingId && (
                <span className="text-[9px] text-gray-400 font-bold block mt-0.5">
                  {isAr ? '⚠️ لا يمكن تعديل البريد الإلكتروني بعد إنشاء الحساب' : '⚠️ Email cannot be changed after creation'}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <input
                type="password"
                required={!editingId}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? (isAr ? 'اتركه فارغاً لإبقائه دون تغيير' : 'Leave blank to keep unchanged') : '••••••••'}
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E2D9] text-sm font-bold bg-[#FAF9F6] text-[#2D241E] focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5"
              />
              {editingId && (
                <span className="text-[9px] text-brand-gold font-bold block mt-0.5">
                  {isAr ? '🔑 كمسؤول رئيسي، سيتم استبدال وتجاوز كلمة المرور السابقة فوراً في المونجو' : '🔑 As super admin, this overrides their old password instantly in MongoDB'}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                {isAr ? 'نوع الحساب والصلاحيات' : 'Account Type / Role'}
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'user' })}
                disabled={editingId === 'admin-1'}
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E2D9] text-sm font-black bg-[#FAF9F6] text-[#2D241E] focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5"
              >
                <option value="user">{isAr ? 'عميل / مستخدم عادي' : 'Customer / Standard User'}</option>
                <option value="admin">{isAr ? 'مسؤول / مدير مطبخ' : 'Kitchen Admin / Staff'}</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-3 rounded-2xl border border-[#E5E2D9] hover:bg-[#FAF9F6] text-xs font-black text-gray-500 transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={actionLoading === 'submit'}
                className="px-6 py-3 rounded-2xl bg-[#3D4021] hover:bg-[#3D4021]/90 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {actionLoading === 'submit' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                ) : (
                  <span>{isAr ? '💾 حفظ وتحديث الحساب' : '💾 Save Account'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List Table Card */}
      <div className="bg-white border border-[#E5E2D9] rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 sm:p-8 border-b border-[#E5E2D9] bg-[#FAF9F6] flex justify-between items-center">
          <h4 className="text-base font-black text-[#3D4021]">
            {isAr ? 'قائمة الحسابات المسجلة بقاعدة البيانات' : 'Registered Accounts in Database'}
          </h4>
          <span className="px-3 py-1 text-[10px] font-black rounded-full bg-[#3D4021]/5 text-[#3D4021] border border-[#3D4021]/15">
            {accounts.length} {isAr ? 'حسابات إجمالية' : 'Total Accounts'}
          </span>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
            <span className="text-xs font-bold text-gray-400">{isAr ? 'جاري قراءة ومزامنة بيانات MongoDB...' : 'Loading and syncing MongoDB records...'}</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-20 text-center">
            <p className="text-sm font-bold text-gray-400">{isAr ? 'لا توجد حسابات مسجلة حالياً.' : 'No registered accounts found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E5E2D9] text-[10px] font-black text-gray-400 uppercase tracking-wider bg-[#FAF9F6]/50">
                  <th className="px-6 py-4">{isAr ? 'الاسم والبريد' : 'Username & Email'}</th>
                  <th className="px-6 py-4">{isAr ? 'الرتبة والصلاحية' : 'Role / Authorization'}</th>
                  <th className="px-6 py-4">{isAr ? 'تاريخ التسجيل' : 'Date Joined'}</th>
                  <th className="px-6 py-4 text-center">{isAr ? 'التحكم بالصلاحيات' : 'Toggle Staff Role'}</th>
                  <th className="px-6 py-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D9]">
                {accounts.map((acc) => {
                  const isPrimaryAdmin = acc.id === 'admin-1' || acc.username === 'Abu-Qura';
                  return (
                    <tr key={acc.id} className="hover:bg-[#FAF9F6]/30 text-sm font-medium">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-serif text-sm font-black uppercase ${
                            isPrimaryAdmin 
                              ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                              : acc.role === 'admin'
                                ? 'bg-[#3D4021]/10 text-[#3D4021]'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {acc.username.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#2D241E] flex items-center gap-1.5">
                              <span>{acc.username}</span>
                              {isPrimaryAdmin && (
                                <span className="text-xs" title={isAr ? 'المدير الفوقي الأصلي' : 'Original Super Admin'}>👑</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-bold mt-0.5">{acc.email || (isAr ? 'لا يوجد بريد مسجل' : 'No Email')}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {isPrimaryAdmin ? (
                          <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wide">
                            {isAr ? 'المدير الأصلي (المخوّل المباشر)' : 'Original Super Admin'}
                          </span>
                        ) : acc.role === 'admin' ? (
                          <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-[#3D4021]/5 text-[#3D4021] border border-[#3D4021]/15 uppercase tracking-wide">
                            {isAr ? 'مدير / طاقم عمل المطبخ' : 'Kitchen Admin'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-gray-50 text-gray-500 border border-gray-200">
                            {isAr ? 'عميل / زائر' : 'Customer'}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-xs text-gray-400 font-mono font-bold">
                        {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : '-'}
                      </td>

                      <td className="px-6 py-5 text-center">
                        {isPrimaryAdmin ? (
                          <span className="text-xs font-bold text-gray-400">-</span>
                        ) : (
                          <button
                            onClick={() => handleToggleRole(acc)}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center justify-center p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#3D4021] cursor-pointer"
                            title={isAr ? 'تغيير الصلاحيات بين مدير وعميل' : 'Toggle role between admin and user'}
                          >
                            {actionLoading === `role_${acc.id}` ? (
                              <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
                            ) : acc.role === 'admin' ? (
                              <ToggleRight className="w-7 h-7 text-[#3D4021]" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-gray-300" />
                            )}
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            disabled={actionLoading !== null}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#3D4021] transition-colors cursor-pointer"
                            title={isAr ? 'تعديل البيانات والباسورد' : 'Modify Credentials & Passwords'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {!isPrimaryAdmin && (
                            <button
                              onClick={() => triggerDeleteConfirm(acc)}
                              disabled={actionLoading !== null}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                              title={isAr ? 'حذف الحساب نهائياً' : 'Delete Account'}
                            >
                              {actionLoading === `del_${acc.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Audit Logs Card */}
      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 sm:p-8 border-b border-rose-100 bg-rose-50/20 flex flex-wrap gap-4 justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-base font-black text-[#3D4021] flex items-center gap-2">
              <Terminal className="w-5 h-5 text-rose-500" />
              <span>{isAr ? 'سجل الأمان والرقابة ومراقبة الدخول' : 'Security Audit & Intrusion Logs'}</span>
            </h4>
            <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
              {isAr 
                ? 'يعرض هذا السجل آخر محاولات تسجيل الدخول للوحة التحكم لضمان أمان حساب المالك الرئيسي والتعرف الفوري على أي محاولات مشبوهة.' 
                : 'Displays the latest dashboard login requests to secure the original admin account and identify suspicious activity immediately.'}
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50/50 text-rose-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث السجل' : 'Refresh Logs'}</span>
          </button>
        </div>

        {loadingLogs && logs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
            <span className="text-xs font-bold text-gray-400">{isAr ? 'جاري قراءة وتحميل سجلات الأمان...' : 'Loading security records...'}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <AlertTriangle className="w-8 h-8 text-rose-300 mx-auto mb-2" />
            <p className="text-xs font-bold">{isAr ? 'لا توجد سجلات أمان مسجلة حالياً.' : 'No security records registered yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-rose-50 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-rose-50/10">
                  <th className="px-6 py-4">{isAr ? 'اسم المسؤول' : 'Admin Username'}</th>
                  <th className="px-6 py-4">{isAr ? 'البريد المستخدم' : 'Email Attempted'}</th>
                  <th className="px-6 py-4">{isAr ? 'الحالة الأمنيّة' : 'Security Status'}</th>
                  <th className="px-6 py-4">{isAr ? 'عنوان الـ IP' : 'IP Address'}</th>
                  <th className="px-6 py-4">{isAr ? 'بيانات الجهاز' : 'Device Info / User Agent'}</th>
                  <th className="px-6 py-4">{isAr ? 'التوقيت' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50/50">
                {logs.map((log: any) => {
                  const isSuccess = log.status === 'success';
                  return (
                    <tr key={log.id} className="hover:bg-rose-50/5 text-xs font-semibold">
                      <td className="px-6 py-4 font-black text-[#2D241E]">{log.username}</td>
                      <td className="px-6 py-4 text-gray-500">{log.email || '-'}</td>
                      <td className="px-6 py-4">
                        {isSuccess ? (
                          <span className="px-2.5 py-1 text-[9px] font-black rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {isAr ? 'نجاح الدخول' : 'Authorized Login'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[9px] font-black rounded-lg bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {isAr ? 'فشل الدخول' : 'Access Denied / Failed'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-600">{log.ipAddress}</td>
                      <td className="px-6 py-4 text-gray-400 max-w-xs truncate" title={log.userAgent}>
                        {log.userAgent}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono font-bold">
                        {new Date(log.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {confirmDelete.isOpen && confirmDelete.user && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div 
            className="bg-white max-w-md w-full rounded-3xl border border-[#E5E2D9] overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
              ⚠️
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-black text-[#2D241E] font-serif">
                {isAr ? 'حذف حساب المستخدم نهائياً' : 'Permanently Delete Account'}
              </h4>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                {isAr 
                  ? `هل أنت متأكد تماماً من حذف حساب "${confirmDelete.user.username}" نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء وسيتم إزالة كافة صلاحياته.`
                  : `Are you sure you want to permanently delete user "${confirmDelete.user.username}"? This action is absolute and cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete({ isOpen: false, user: null })}
                className="flex-1 py-3.5 rounded-2xl border border-[#E5E2D9] hover:bg-[#FAF9F6] text-xs font-black text-gray-500 transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء وتراجع' : 'Cancel & Go Back'}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-md cursor-pointer"
              >
                {isAr ? 'نعم، احذفه تماماً' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
