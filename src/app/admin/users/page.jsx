'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Ban,
  Briefcase,
  CheckCircle2,
  Filter,
  GraduationCap,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

const INITIAL_USERS = [
  {
    id: 'USR-2101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@college.edu',
    role: 'student',
    status: 'active',
    department: 'Computer Science',
    year: '3rd Year',
    phone: '+91-90000-11001',
    joinedAt: '2025-01-15',
    lastSeen: '2m ago',
  },
  {
    id: 'USR-2102',
    name: 'Riya Patel',
    email: 'riya.patel@college.edu',
    role: 'student',
    status: 'active',
    department: 'Electronics',
    year: '2nd Year',
    phone: '+91-90000-11002',
    joinedAt: '2025-02-10',
    lastSeen: '14m ago',
  },
  {
    id: 'USR-2103',
    name: 'Kunal Mehta',
    email: 'kunal.mehta@college.edu',
    role: 'student',
    status: 'suspended',
    department: 'Mechanical',
    year: '4th Year',
    phone: '+91-90000-11003',
    joinedAt: '2024-11-20',
    lastSeen: '3d ago',
  },
  {
    id: 'USR-3051',
    name: 'Dr. Nisha Rao',
    email: 'nisha.rao@college.edu',
    role: 'counselor',
    status: 'active',
    department: 'Wellness Cell',
    year: '-',
    phone: '+91-90000-22001',
    joinedAt: '2024-09-05',
    lastSeen: '9m ago',
  },
  {
    id: 'USR-3052',
    name: 'Dr. Vikram Sethi',
    email: 'vikram.sethi@medvault.org',
    role: 'therapist',
    status: 'active',
    department: 'Clinical Partnerships',
    year: '-',
    phone: '+91-90000-22002',
    joinedAt: '2024-08-28',
    lastSeen: '1h ago',
  },
  {
    id: 'USR-3053',
    name: 'Meera Dsouza',
    email: 'meera.dsouza@college.edu',
    role: 'support_staff',
    status: 'invited',
    department: 'Student Affairs',
    year: '-',
    phone: '+91-90000-22003',
    joinedAt: '2026-03-22',
    lastSeen: 'Not yet signed in',
  },
  {
    id: 'USR-4001',
    name: 'Admin User',
    email: 'admin@college.edu',
    role: 'admin',
    status: 'active',
    department: 'Administration',
    year: '-',
    phone: '+91-90000-33001',
    joinedAt: '2024-06-12',
    lastSeen: '5m ago',
  },
  {
    id: 'USR-4011',
    name: 'Prof. Aditya Iyer',
    email: 'aditya.iyer@college.edu',
    role: 'faculty',
    status: 'active',
    department: 'Humanities',
    year: '-',
    phone: '+91-90000-33002',
    joinedAt: '2024-10-19',
    lastSeen: '22m ago',
  },
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'support_staff', label: 'Support Staff' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
];

const ROLE_COLORS = {
  student: 'bg-sky-100 text-sky-700 border-sky-200',
  faculty: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  counselor: 'bg-violet-100 text-violet-700 border-violet-200',
  therapist: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  support_staff: 'bg-amber-100 text-amber-700 border-amber-200',
  admin: 'bg-rose-100 text-rose-700 border-rose-200',
};

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  invited: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  suspended: 'bg-rose-100 text-rose-700 border-rose-200',
};

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function roleLabel(role) {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    status: 'invited',
    department: '',
    year: '',
    phone: '',
  });

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setNotice('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [notice]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.status === 'active').length;
    const invited = users.filter((user) => user.status === 'invited').length;
    const students = users.filter((user) => user.role === 'student').length;
    const staff = total - students;

    return {
      total,
      active,
      invited,
      students,
      staff,
    };
  }, [users]);

  const updateStatus = (id) => {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== id) {
          return user;
        }

        if (user.status === 'suspended') {
          return { ...user, status: 'active', lastSeen: 'Just re-activated' };
        }

        if (user.status === 'invited') {
          return { ...user, status: 'active', lastSeen: 'Invitation accepted' };
        }

        return { ...user, status: 'suspended', lastSeen: 'Account suspended' };
      })
    );

    setNotice('Account status updated.');
  };

  const resetPassword = (name) => {
    setNotice(`Password reset link sent to ${name}.`);
  };

  const deleteUser = (id, name) => {
    if (!window.confirm(`Remove ${name} from user records?`)) {
      return;
    }

    setUsers((current) => current.filter((user) => user.id !== id));
    setNotice('User removed from the mock directory.');
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleAddUser = (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      setNotice('Name and email are required.');
      return;
    }

    const newUser = {
      id: `USR-${Math.floor(5000 + Math.random() * 3999)}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      status: formData.status,
      department: formData.department.trim() || 'General Administration',
      year: formData.role === 'student' ? formData.year.trim() || '1st Year' : '-',
      phone: formData.phone.trim() || 'Not provided',
      joinedAt: new Date().toISOString().slice(0, 10),
      lastSeen: formData.status === 'invited' ? 'Not yet signed in' : 'Just now',
    };

    setUsers((current) => [newUser, ...current]);
    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      role: 'student',
      status: 'invited',
      department: '',
      year: '',
      phone: '',
    });
    setNotice('Account created in the mock admin panel.');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 px-4 py-10 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-300/45 via-emerald-200/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-0 h-72 w-72 rounded-full bg-gradient-to-tr from-amber-300/35 via-orange-200/20 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-7xl pt-16 pb-10">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-5 rounded-3xl border border-white/50 bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl p-6 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/50"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                User Management Control Room
              </h1>
              <p className="mt-2 text-sm md:text-base font-medium text-slate-600 dark:text-slate-300 max-w-3xl">
                Manage student and staff identities, status lifecycle, and account readiness from one clean surface.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <UserPlus className="h-4 w-4" />
              Add Account
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-cyan-50 to-white px-4 py-3 text-sm text-emerald-900">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              Mock Mode
            </span>
            <span className="ml-2 text-emerald-800/90">
              Actions are local for demo flow and reset on refresh.
            </span>
          </div>
        </motion.div>

        {notice ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
            {notice}
          </div>
        ) : null}

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Accounts</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Active</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Invited</p>
            <p className="mt-2 text-3xl font-black text-cyan-700">{stats.invited}</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Students</p>
            <p className="mt-2 text-3xl font-black text-sky-700">{stats.students}</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Staff</p>
            <p className="mt-2 text-3xl font-black text-indigo-700">{stats.staff}</p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, department, or user ID"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                <Filter className="h-4 w-4" />
                Filters
              </span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-11 min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department / Year</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Seen</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-xs font-bold grid place-items-center">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          <p className="text-xs text-slate-400">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[user.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.department}
                      <span className="text-slate-400">{user.year !== '-' ? ` / ${user.year}` : ''}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.lastSeen}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => resetPassword(user.name)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reset
                        </button>
                        <button
                          onClick={() => updateStatus(user.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                            user.status === 'suspended'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {user.status === 'suspended' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.name)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-4 p-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="text-xs text-slate-400">{user.id}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${STATUS_COLORS[user.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {user.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {roleLabel(user.role)}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    {user.department}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => resetPassword(user.name)}
                    className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => updateStatus(user.id)}
                    className={`rounded-lg px-2 py-2 text-xs font-semibold ${
                      user.status === 'suspended'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id, user.name)}
                    className="rounded-lg border border-rose-200 px-2 py-2 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="border-t border-slate-100 px-6 py-14 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">No users found</h3>
              <p className="mt-1 text-sm text-slate-500">Try a different search term or reset filters.</p>
            </div>
          ) : null}
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <GraduationCap className="h-4 w-4 text-sky-600" />
              Student Readiness
            </p>
            <p className="mt-2 text-sm text-slate-600">{stats.students} student accounts currently visible across batches.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              Staff Readiness
            </p>
            <p className="mt-2 text-sm text-slate-600">{stats.staff} staff accounts available for counseling and operations workflows.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Access Hygiene
            </p>
            <p className="mt-2 text-sm text-slate-600">Use suspend/reactivate controls to quickly enforce account lifecycle policy.</p>
          </div>
        </section>
      </div>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Add New Account</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">Create a mock student or staff account for dashboard demos.</p>

            <form onSubmit={handleAddUser} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Full name
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Enter full name"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="name@college.edu"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Role
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {ROLE_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Account status
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Department
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleFormChange}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Computer Science / Wellness Cell"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Student year (optional)
                  <input
                    name="year"
                    value={formData.year}
                    onChange={handleFormChange}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="1st Year / 2nd Year"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                  Phone (optional)
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="+91-90000-00000"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Create Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}