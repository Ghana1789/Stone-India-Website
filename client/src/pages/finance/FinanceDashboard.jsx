import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FiBarChart2, FiCreditCard, FiFileText, FiDollarSign,
  FiActivity, FiTrendingUp
} from 'react-icons/fi';

import OverviewSection from './OverviewSection';
import PaymentsSection from './PaymentsSection';
import InvoicesSection from './InvoicesSection';
import PayslipsSection from './PayslipsSection';
import TransactionsSection from './TransactionsSection';
import ReportsSection from './ReportsSection';

// Tab configuration — role-adaptive
const getTabs = (role) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart2, color: '#10b981' },
    { id: 'payments', label: 'Payments', icon: FiCreditCard, color: '#3b82f6' },
  ];

  // Client sees invoices, not payslips
  if (role === 'client') {
    tabs.push({ id: 'invoices', label: 'Invoices', icon: FiFileText, color: '#f59e0b' });
  }

  // Employee sees payslips
  if (role === 'employee') {
    tabs.push({ id: 'payslips', label: 'Payslips', icon: FiDollarSign, color: '#a855f7' });
  }

  // Manager/Admin sees both invoices and payslips
  if (role === 'admin' || role === 'manager') {
    tabs.push({ id: 'invoices', label: 'Invoices', icon: FiFileText, color: '#f59e0b' });
    tabs.push({ id: 'payslips', label: 'Payslips', icon: FiDollarSign, color: '#a855f7' });
  }

  // Ledger for all roles
  tabs.push({ id: 'transactions', label: 'Ledger', icon: FiActivity, color: '#06b6d4' });

  // Reports only for manager/admin
  if (role === 'admin' || role === 'manager') {
    tabs.push({ id: 'reports', label: 'Reports', icon: FiTrendingUp, color: '#ec4899' });
  }

  return tabs;
};

const SECTIONS = {
  overview: OverviewSection,
  payments: PaymentsSection,
  invoices: InvoicesSection,
  payslips: PayslipsSection,
  transactions: TransactionsSection,
  reports: ReportsSection,
};

export default function FinanceDashboard() {
  const { user } = useAuth();
  const role = user?.role || 'client';
  const tabs = getTabs(role);
  const [activeTab, setActiveTab] = useState('overview');

  const ActiveSection = SECTIONS[activeTab] || OverviewSection;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">
            Finance Dashboard
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            {role === 'admin' && 'Organization-wide financial management and analytics'}
            {role === 'manager' && 'Department financial oversight and payroll management'}
            {role === 'employee' && 'Your personal salary records and financial summary'}
            {role === 'client' && 'Your invoices, payments, and billing overview'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-lg shadow-emerald-900/30">
          <FiDollarSign className="text-white w-5 h-5" />
          <div className="text-left">
            <div className="text-[10px] text-emerald-100 font-black uppercase tracking-widest opacity-70">Module</div>
            <div className="text-white text-xs font-black uppercase tracking-tight">Financial Hub</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[#13161e] border border-slate-800 rounded-2xl p-1.5 flex flex-wrap gap-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: isActive ? tab.color : '#374151' }}
              />
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <ActiveSection />
    </div>
  );
}
