// src/components/LoginForm.jsx - Premium sign-in experience
import React, { useState, useContext } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import useToast from "../hooks/useToast";

const LoginForm = ({ onToggleForm }) => {
  const { login } = useContext(AuthContext);
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEmailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = email.length > 0 && password.length > 0 && isEmailValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError("Please enter a valid email and password.");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await login(email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Welcome back! Signed in successfully.");
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/80 p-7 shadow-[0_35px_80px_-35px_rgba(2,6,23,0.95)] backdrop-blur-xl">
      <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="absolute -bottom-10 right-0 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Secure sign in
          </span>
        </div>

        <div className="mb-7 text-center">
          <h2 className="text-2xl font-bold text-white">PixHive</h2>
          <p className="mt-1 text-sm italic text-emerald-400">
            Your Memories, Organized.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Re-enter your workspace and pick up where you left off.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
              {error}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-shell pl-10 ${email.length > 0 && !isEmailValid ? "border-rose-500/40 focus:border-rose-500/60 focus:ring-rose-500/20" : ""}`}
                disabled={submitting}
                required
              />
            </div>
            {email.length > 0 && !isEmailValid ? (
              <p className="mt-1.5 text-xs text-rose-400">
                Please enter a valid email address.
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-shell pl-10 pr-10"
                disabled={submitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isFormValid}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          New here?{" "}
          <button
            onClick={onToggleForm}
            className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
