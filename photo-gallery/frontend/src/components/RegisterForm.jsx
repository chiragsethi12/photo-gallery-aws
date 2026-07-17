// src/components/RegisterForm.jsx - Premium onboarding experience
import React, { useState, useContext, useMemo } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import useToast from "../hooks/useToast";

const RegisterForm = ({ onToggleForm }) => {
  const { register } = useContext(AuthContext);
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEmailValid =
    email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    }),
    [password]
  );

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  const isFormValid =
    name.trim().length > 0 &&
    email.length > 0 &&
    isEmailValid &&
    passwordChecks.minLength &&
    password === confirmPassword &&
    confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError("Please fill in all fields correctly.");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await register(name, email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Account created! Welcome to PixHive.");
    }
  };

  const strengthLabel =
    passwordStrength === 0
      ? ""
      : passwordStrength === 1
        ? "Weak"
        : passwordStrength === 2
          ? "Fair"
          : "Strong";

  const strengthColor =
    passwordStrength === 1
      ? "bg-rose-500"
      : passwordStrength === 2
        ? "bg-amber-500"
        : passwordStrength === 3
          ? "bg-emerald-500"
          : "bg-slate-700";

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/80 p-7 shadow-[0_35px_80px_-35px_rgba(2,6,23,0.95)] backdrop-blur-xl">
      <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Free account
          </span>
        </div>

        <div className="mb-7 text-center">
          <h2 className="text-2xl font-bold text-white">PixHive</h2>
          <p className="mt-1 text-sm italic text-emerald-400">
            Your Memories, Organized.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Start organizing your memories in a workspace designed for clarity.
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
              htmlFor="register-name"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Full name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-name"
                type="text"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-shell pl-10"
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-email"
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
              htmlFor="register-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
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

            {password.length > 0 ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{
                        width: `${(passwordStrength / 3) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${passwordStrength === 3 ? "text-emerald-400" : passwordStrength === 2 ? "text-amber-400" : "text-rose-400"}`}
                  >
                    {strengthLabel}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { key: "minLength", label: "At least 6 characters" },
                    { key: "hasUpper", label: "One uppercase letter" },
                    { key: "hasNumber", label: "One number" },
                  ].map((rule) => (
                    <div
                      key={rule.key}
                      className="flex items-center gap-1.5 text-[11px]"
                    >
                      {passwordChecks[rule.key] ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <X className="h-3 w-3 text-slate-500" />
                      )}
                      <span
                        className={
                          passwordChecks[rule.key]
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Confirm password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input-shell pl-10 pr-10 ${confirmPassword.length > 0 && !passwordsMatch ? "border-rose-500/40 focus:border-rose-500/60 focus:ring-rose-500/20" : ""}`}
                disabled={submitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch ? (
              <p className="mt-1.5 text-xs text-rose-400">
                Passwords do not match.
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting || !isFormValid}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <button
            onClick={onToggleForm}
            className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
