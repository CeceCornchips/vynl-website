"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WaitlistFormConfig } from "@/types";
import { PrimaryButton } from "../ui/Buttons";
import { Heading, Subheading, BodyText, LabelText } from "../ui/Typography";

// ── InputField ────────────────────────────────────────────────────────────

interface InputFieldProps {
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function InputField({
  id, name, type = "text", placeholder, value, onChange,
  label, error, required, className, disabled,
}: InputFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label htmlFor={id} className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-500">
          {label}{required && <span className="text-vynl-champagne ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full border-b border-vynl-gray-200 bg-transparent px-0 py-3",
          "text-sm font-sans font-light text-vynl-black placeholder:text-vynl-gray-400",
          "focus:outline-none focus:border-vynl-black transition-colors duration-200",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          error && "border-red-400"
        )}
      />
      {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
    </div>
  );
}

// ── EmailInput ─────────────────────────────────────────────────────────────

interface EmailInputProps {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
  dark?: boolean;
}

export function EmailInput({
  placeholder = "Email address", value, onChange, disabled, className, error, dark,
}: EmailInputProps) {
  return (
    <input
      type="email"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
      className={cn(
        "w-full border-b bg-transparent px-0 py-3",
        "text-sm font-sans font-light placeholder:text-current/40",
        "focus:outline-none transition-colors duration-200",
        dark
          ? "border-white/20 text-vynl-white focus:border-vynl-champagne"
          : "border-vynl-gray-300 text-vynl-black focus:border-vynl-black",
        "disabled:opacity-40",
        error && "border-red-400",
        className
      )}
    />
  );
}

// ── FormWrapper ─────────────────────────────────────────────────────────────

interface FormWrapperProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export function FormWrapper({ children, onSubmit, className }: FormWrapperProps) {
  return (
    <form onSubmit={onSubmit} noValidate className={cn("flex flex-col gap-5", className)}>
      {children}
    </form>
  );
}

// ── WaitlistForm ─────────────────────────────────────────────────────────────

interface WaitlistFormProps extends WaitlistFormConfig {
  className?: string;
  colorScheme?: "light" | "dark" | "smoke";
}

export function WaitlistForm({
  title, subtitle, buttonText = "Join the Waitlist",
  successMessage = "You're on the list. We'll be in touch soon.",
  placeholder = "Email address",
  namePlaceholder = "Your name",
  context, showName = false, className, colorScheme = "light",
}: WaitlistFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const isDark = colorScheme === "dark";
  const isSmoke = colorScheme === "smoke";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    // Replace with real API call — Mailchimp / Klaviyo / Formspree / custom
    await new Promise((res) => setTimeout(res, 900));
    console.log("[waitlist]", { name, email, context });
    setStatus("success");
    setName("");
    setEmail("");
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden p-8 md:p-12",
        isDark && "bg-vynl-gray-900 text-vynl-white",
        isSmoke && "bg-vynl-smoke text-vynl-black",
        !isDark && !isSmoke && "bg-vynl-white border border-vynl-gray-100 text-vynl-black",
        className
      )}
    >
      {/* Subtle decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vynl-champagne/40 to-transparent" />

      <div className="flex flex-col gap-7 max-w-md">
        {title && (
          <Heading
            as="h3"
            size="md"
            className={isDark ? "text-vynl-white" : "text-vynl-black"}
          >
            {title}
          </Heading>
        )}
        {subtitle && (
          <Subheading
            size="sm"
            className={isDark ? "text-vynl-gray-400" : "text-vynl-gray-500"}
            muted={false}
          >
            {subtitle}
          </Subheading>
        )}

        {status === "success" ? (
          <div className="flex items-center gap-3 py-4 border-l-2 border-vynl-champagne pl-5">
            <BodyText
              size="sm"
              className={cn("font-light", isDark ? "text-vynl-gray-300" : "text-vynl-gray-600")}
            >
              {successMessage}
            </BodyText>
          </div>
        ) : (
          <FormWrapper onSubmit={handleSubmit} className="gap-6">
            {showName && (
              <input
                type="text"
                placeholder={namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === "loading"}
                className={cn(
                  "w-full border-b bg-transparent px-0 py-3",
                  "text-sm font-sans font-light placeholder:text-current/40",
                  "focus:outline-none transition-colors duration-200",
                  isDark
                    ? "border-white/20 text-vynl-white focus:border-vynl-champagne"
                    : "border-vynl-gray-200 text-vynl-black focus:border-vynl-black"
                )}
              />
            )}
            <EmailInput
              placeholder={placeholder}
              value={email}
              onChange={setEmail}
              disabled={status === "loading"}
              error={error}
              dark={isDark}
            />
            {error && <p className="text-xs text-red-400 font-sans -mt-3">{error}</p>}
            <PrimaryButton
              type="submit"
              disabled={status === "loading"}
              fullWidth
              className={cn(
                isDark
                  ? "bg-vynl-champagne-light text-vynl-black hover:bg-vynl-nude border-none mt-2"
                  : "bg-vynl-black text-vynl-white hover:bg-vynl-gray-800 mt-2"
              )}
            >
              {status === "loading" ? "Submitting…" : buttonText}
            </PrimaryButton>
          </FormWrapper>
        )}
      </div>
    </div>
  );
}

// ── ContactForm ───────────────────────────────────────────────────────────

export function ContactForm({ className }: { className?: string }) {
  const [form, setForm] = useState({ name: "", email: "", service: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email || !form.email.includes("@")) e.email = "Valid email required.";
    if (!form.message.trim()) e.message = "Please tell us about your appointment.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus("loading");
    // Replace with real endpoint
    await new Promise((res) => setTimeout(res, 1000));
    console.log("[contact]", form);
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className={cn("py-12 flex flex-col gap-4", className)}>
        <div className="w-8 h-px bg-vynl-champagne" />
        <Heading as="h3" size="sm">Thank you.</Heading>
        <BodyText muted>We&apos;ve received your message and will be in touch shortly to confirm your booking.</BodyText>
      </div>
    );
  }

  const fieldClass = "w-full border-b border-vynl-gray-200 bg-transparent px-0 py-3 text-sm font-sans font-light text-vynl-black placeholder:text-vynl-gray-400 focus:outline-none focus:border-vynl-black transition-colors duration-200";

  return (
    <form onSubmit={handleSubmit} noValidate className={cn("flex flex-col gap-8", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <InputField
          id="name"
          name="name"
          label="Your Name"
          placeholder="First & last name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          required
        />
        <InputField
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="your@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-500">
          Service Interest
        </label>
        <select
          value={form.service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          className={cn(fieldClass, "cursor-pointer")}
        >
          <option value="">Select a service…</option>
          <option value="gel-x-set">Gel-X Builder Set</option>
          <option value="gel-x-art-1">Gel-X + Art · Level 1</option>
          <option value="gel-x-art-2">Gel-X + Art · Level 2</option>
          <option value="gel-x-art-3">Gel-X + Art · Level 3</option>
          <option value="infill">Gel-X Infill</option>
          <option value="removal">Removal</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-500">
          Tell us about your vision <span className="text-vynl-champagne">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="Describe the look you have in mind, share inspo links, or ask a question…"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={cn(fieldClass, "resize-none")}
        />
        {errors.message && <p className="text-xs text-red-500 font-sans">{errors.message}</p>}
      </div>

      <PrimaryButton type="submit" disabled={status === "loading"} className="self-start">
        {status === "loading" ? "Sending…" : "Send Booking Request"}
      </PrimaryButton>
    </form>
  );
}
