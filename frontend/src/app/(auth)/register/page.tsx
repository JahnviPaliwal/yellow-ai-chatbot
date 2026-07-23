'use client';

import React from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';
import { RegisterForm } from '../../../features/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Bot className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Create an Account</h1>
          <p className="text-xs text-slate-400">Get started with Yellow.ai enterprise platform</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 shadow-2xl border border-slate-800">
          <RegisterForm />
        </div>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-amber-400 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
