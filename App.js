import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from './supabase';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  navy:       "#1a2b5e",
  navyDark:   "#0d1a3a",
  navyMid:    "#243380",
  navyLight:  "#eaecf5",
  navyXLight: "#f4f5fb",
  bg:         "#f5f6fa",
  surface:    "#ffffff",
  border:     "#e5e7eb",
  borderMid:  "#d1d5db",
  text:       "#111827",
  textMid:    "#4b5563",
  textMuted:  "#9ca3af",
  green:      "#16a34a",
  greenLight: "#f0fdf4",
  greenBorder:"#bbf7d0",
  red:        "#dc2626",
  redLight:   "#fef2f2",
  redBorder:  "#fecaca",
  amber:      "#d97706",
  amberLight: "#fffbeb",
  amberBorder:"#fde68a",
  purple:     "#7c3aed",
  purpleLight:"#f5f3ff",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:${C.bg};color:${C.text};-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;overscroll-behavior:none;}
  button,input,textarea,select{font-family:inherit;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fu{animation:fadeUp .28s ease both;}
  .fu2{animation:fadeUp .28s .07s ease both;}
  .fu3{animation:fadeUp .28s .14s ease both;}
  .su{animation:slideUp .3s ease both;}
  ::-webkit-scrollbar{width:0;}
`;

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Spinner({ color = "#fff", size = 20 }) {
  return <div style={{ width: size, height: size, border: `2px solid transparent`, borderTopColor: color, borderRadius: "50%", animation: "spin .7s linear infinite" }} />;
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : undefined, ...style }}>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", rows, style, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const base = { width: "100%", background: focused ? C.surface : C.bg, border: `1.5px solid ${focused ? C.navy : C.border}`, borderRadius: 10, color: C.text, padding: "12px 14px", fontSize: 15, outline: "none", transition: "all .15s", resize: rows ? "vertical" : undefined, ...style };
  if (rows) return <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} style={base} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoComplete={autoComplete} />;
}

function Btn({ children, onClick, variant = "primary", full, small, disabled, loading, type = "button" }) {
  const styles = {
    primary: { background: disabled || loading ? C.borderMid : C.navy, color: "#fff", border: "none" },
    outline: { background: "transparent", color: C.navy, border: `1.5px solid ${C.navy}` },
    ghost: { background: "transparent", color: C.textMuted, border: "none" },
    danger: { background: C.red, color: "#fff", border: "none" },
    success: { background: C.green, color: "#fff", border: "none" },
    purple: { background: C.purple, color: "#fff", border: "none" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, fontWeight: 600, fontSize: small ? 14 : 16, padding: small ? "9px 18px" : "13px 24px", width: full ? "100%" : undefined, cursor: disabled || loading ? "not-allowed" : "pointer", transition: "all .15s", opacity: disabled && !loading ? .5 : 1, ...styles[variant] }}>
      {loading ? <Spinner color={variant === "outline" ? C.navy : "#fff"} size={18} /> : children}
    </button>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 12 }}>{msg}</div>;
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: .8, textTransform: "uppercase", padding: "16px 20px 6px" }}>{children}</div>;
}

// ─── BRAND LOGO MARK ─────────────────────────────────────────────────────────
function LogoMark({ size = 48 }) {
  const colors = ["#4f9cf9", "#e05c5c", "#f5c842", "#5cbf7a"];
  return (
    <div style={{ width: size, height: size, borderRadius: size * .28, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: size * .05 }}>
        {colors.map((c, i) => <div key={i} style={{ width: size * .18, height: size * .18, borderRadius: size * .04, background: c }} />)}
      </div>
    </div>
  );
}

// ─── AUTH — WELCOME ───────────────────────────────────────────────────────────
function WelcomeScreen({ onLogin, onSignUp }) {
  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="fu" style={{ textAlign: "center", width: "100%", maxWidth: 360 }}>
        <LogoMark size={56} />
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginTop: 18, marginBottom: 6 }}>Exceed Support</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 40 }}>NDIS support worker portal</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onSignUp} style={{ width: "100%", background: "#fff", color: C.navy, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, padding: 14, cursor: "pointer" }}>
            Create account
          </button>
          <button onClick={onLogin} style={{ width: "100%", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 12, fontWeight: 600, fontSize: 16, padding: 14, cursor: "pointer" }}>
            Log in
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 28 }}>14-day free trial · No credit card required</p>
      </div>
    </div>
  );
}

// ─── AUTH — LOGIN ─────────────────────────────────────────────────────────────
function LoginScreen({ onBack, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
    else onSuccess();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="fu" style={{ width: "100%", maxWidth: 360 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer", marginBottom: 24, padding: 0 }}>← Back</button>
        <LogoMark size={44} />
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>Welcome back</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 28 }}>Log in to your account</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && <div style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: 13 }}>{error}</div>}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required autoComplete="email"
            style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", padding: "12px 14px", fontSize: 15, outline: "none" }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required autoComplete="current-password"
            style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", padding: "12px 14px", fontSize: 15, outline: "none" }} />
          <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "rgba(255,255,255,0.3)" : "#fff", color: C.navy, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, padding: 14, cursor: loading ? "not-allowed" : "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loading ? <Spinner color={C.navy} size={18} /> : "Log in →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── AUTH — SIGN UP FLOW ──────────────────────────────────────────────────────
const PROFESSIONAL_ROLES = [
  { value: "support_worker", label: "Support Worker" },
  { value: "support_coordinator", label: "Support Coordinator" },
  { value: "behaviour_support", label: "Behaviour Support Practitioner" },
  { value: "physiotherapist", label: "Physiotherapist" },
  { value: "occupational_therapist", label: "Occupational Therapist" },
  { value: "speech_pathologist", label: "Speech Pathologist" },
  { value: "psychologist", label: "Psychologist" },
  { value: "plan_manager", label: "Plan Manager" },
  { value: "nurse", label: "Nurse / Clinical" },
  { value: "other", label: "Other" },
];

function SignUpFlow({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [professionalRole, setProfessionalRole] = useState("support_worker");
  const [employeeRole, setEmployeeRole] = useState("support_worker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email: email.trim(), password });
      if (authErr) throw authErr;
      const authId = authData.user?.id;
      if (!authId) throw new Error("Signup failed — please try again.");

      // 2. Create people record
      const { data: person, error: pErr } = await supabase.from("people").insert({
        auth_id: authId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        account_type: accountType,
        professional_role: accountType === "employee" ? employeeRole : professionalRole,
        onboarding_done: true,
      }).select().single();
      if (pErr) throw pErr;

      // 3. Account-type-specific setup
      if (accountType === "business_owner") {
        const { data: biz, error: bErr } = await supabase.from("businesses").insert({
          name: businessName.trim(),
          owner_id: person.id,
        }).select().single();
        if (bErr) throw bErr;
        await supabase.from("subscriptions").insert({
          entity_type: "business", entity_id: biz.id,
          plan_type: "business", status: "trial", staff_count: 0,
        });
      } else if (accountType === "employee") {
        const code = joinCode.trim().toUpperCase();
        const { data: biz, error: bErr } = await supabase.from("businesses").select("id,name").eq("join_code", code).single();
        if (bErr || !biz) throw new Error(`No business found with code "${code}". Please check with your manager.`);
        await supabase.from("business_members").insert({
          business_id: biz.id, person_id: person.id,
          role: employeeRole, status: "pending",
        });
      } else if (accountType === "independent") {
        await supabase.from("subscriptions").insert({
          entity_type: "person", entity_id: person.id,
          plan_type: "independent", status: "trial",
        });
      }

      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (done) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div className="fu" style={{ maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700, marginBottom: 10 }}>
          {accountType === "employee" ? "Request sent!" : "Account created!"}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          {accountType === "employee"
            ? "Your join request has been sent to the business owner. You'll have access once they approve you — usually within 24 hours."
            : "Check your email to verify your account, then log in to get started. Your 14-day free trial begins now."}
        </p>
        <button onClick={onSuccess} style={{ width: "100%", background: "#fff", color: C.navy, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, padding: 14, cursor: "pointer" }}>
          {accountType === "employee" ? "Got it" : "Log in now →"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="fu" style={{ width: "100%", maxWidth: 360 }}>
        <button onClick={step === 1 ? onBack : () => setStep(s => s - 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer", marginBottom: 20, padding: 0 }}>← Back</button>

        {/* Step 1: Account type */}
        {step === 1 && (
          <>
            <LogoMark size={44} />
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>Create account</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24 }}>How will you be using Exceed?</p>
            {[
              { type: "business_owner", icon: "🏢", label: "I run a support business", sub: "Manage your team, clients, and organisation" },
              { type: "employee", icon: "👤", label: "I work for a business", sub: "Join your employer's account with a code" },
              { type: "independent", icon: "⭐", label: "I work independently", sub: "Manage your own clients and circles" },
            ].map(opt => (
              <button key={opt.type} onClick={() => { setAccountType(opt.type); setStep(2); }} style={{
                width: "100%", textAlign: "left", background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", marginBottom: 10, display: "flex", gap: 14, alignItems: "center",
              }}>
                <span style={{ fontSize: 22 }}>{opt.icon}</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{opt.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>{opt.sub}</div>
                </div>
              </button>
            ))}
          </>
        )}

        {/* Step 2: Name, email, password */}
        {step === 2 && (
          <>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Your details</h2>
            {error && <div style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { val: name, set: setName, ph: "Full name", type: "text", ac: "name" },
                { val: email, set: setEmail, ph: "Email address", type: "email", ac: "email" },
                { val: password, set: setPassword, ph: "Password (min 8 characters)", type: "password", ac: "new-password" },
              ].map((f, i) => (
                <input key={i} type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} autoComplete={f.ac}
                  style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", padding: "12px 14px", fontSize: 15, outline: "none" }} />
              ))}
              <button onClick={() => { if (!name || !email || password.length < 8) { setError("Please fill in all fields. Password must be at least 8 characters."); return; } setError(""); setStep(3); }}
                style={{ width: "100%", background: "#fff", color: C.navy, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, padding: 14, cursor: "pointer", marginTop: 4 }}>
                Continue →
              </button>
            </div>
          </>
        )}

        {/* Step 3: Account-type specifics */}
        {step === 3 && (
          <>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
              {accountType === "business_owner" ? "Your business" : accountType === "employee" ? "Join your business" : "Your role"}
            </h2>
            {error && <div style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accountType === "business_owner" && (
                <>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Business / organisation name"
                    style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", padding: "12px 14px", fontSize: 15, outline: "none" }} />
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5 }}>
                    Once set up, you'll get a unique join code to share with your staff. Your 14-day free trial includes up to 5 employees.
                  </p>
                </>
              )}
              {accountType === "employee" && (
                <>
                  <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Business join code (e.g. XCD-A3B7)"
                    style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", padding: "12px 14px", fontSize: 15, outline: "none", letterSpacing: 1 }} />
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5 }}>Ask your manager for your business's join code.</p>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>Your role</p>
                    <select value={employeeRole} onChange={e => setEmployeeRole(e.target.value)}
                      style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", padding: "12px 14px", fontSize: 14, outline: "none" }}>
                      {PROFESSIONAL_ROLES.map(r => <option key={r.value} value={r.value} style={{ background: C.navyDark }}>{r.label}</option>)}
                    </select>
                  </div>
                </>
              )}
              {accountType === "independent" && (
                <>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 4 }}>Your professional role</p>
                  <select value={professionalRole} onChange={e => setProfessionalRole(e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", padding: "12px 14px", fontSize: 14, outline: "none" }}>
                    {PROFESSIONAL_ROLES.map(r => <option key={r.value} value={r.value} style={{ background: C.navyDark }}>{r.label}</option>)}
                  </select>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5 }}>You can add your own clients, or be invited into another provider's client circle.</p>
                </>
              )}
              <button onClick={submit} disabled={loading} style={{ width: "100%", background: loading ? "rgba(255,255,255,0.3)" : "#fff", color: C.navy, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, padding: 14, cursor: loading ? "not-allowed" : "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><Spinner color={C.navy} size={18} /> Creating account…</> : "Create account →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ title, person, onLogout, back, onBack }) {
  return (
    <div style={{ background: C.navy, paddingTop: "max(env(safe-area-inset-top),12px)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {back && <button onClick={onBack} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.9)", fontSize: 16, cursor: "pointer" }}>‹</button>}
          <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 600 }}>{title}</h1>
        </div>
        {person && !back && (
          <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 20, padding: "6px 12px 6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{(person.name || "?")[0]}</div>
            {person.name?.split(" ")[0]}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── BOTTOM TAB BAR ───────────────────────────────────────────────────────────
function TabBar({ tab, setTab, isAdmin }) {
  const tabs = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "log", label: "Log Shift", icon: "✏️" },
    { key: "clients", label: "Clients", icon: "👥" },
    { key: "chat", label: "Chat", icon: "💬" },
    { key: "more", label: "More", icon: "⚙️" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom)", zIndex: 100 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer", color: tab === t.key ? C.navy : C.textMuted, transition: "color .15s" }}>
          <div style={{ width: 36, height: 24, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: tab === t.key ? C.navyXLight : "transparent" }}>{t.icon}</div>
          <span style={{ fontSize: 10, fontWeight: tab === t.key ? 600 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}
function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
const MOOD_COLORS = {
  "Happy and engaged": { bg: C.greenLight, color: C.green },
  "Calm": { bg: "#eff6ff", color: "#1d4ed8" },
  "Quiet/withdrawn": { bg: "#f9fafb", color: C.textMuted },
  "Tired": { bg: "#f9fafb", color: C.textMuted },
  "Anxious": { bg: C.amberLight, color: C.amber },
  "Agitated": { bg: C.amberLight, color: C.amber },
  "Up and down": { bg: C.amberLight, color: C.amber },
  "Upset": { bg: C.redLight, color: C.red },
};

// ─── HOME DASHBOARD ───────────────────────────────────────────────────────────
function HomeDashboard({ person, circles, notes, setTab }) {
  const recentNotes = [...notes].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 4);
  const todayNotes = notes.filter(n => n.shift_date === today() || n.submitted_at?.startsWith(today()));
  const incidents = notes.filter(n => n.incidents && n.incidents !== "No incidents" && !n.incidents.includes("No —"));

  const clientForNote = (n) => circles.find(c => c.id === n.circle_id)?.client;

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: C.navy, padding: "20px 20px 24px" }}>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginBottom: 2 }}>{greeting()},</p>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{person.name?.split(" ")[0]} 👋</h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p>
        <button onClick={() => setTab("log")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "14px 18px", cursor: "pointer", marginTop: 18, color: "#fff" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Log a shift</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Record today's support notes</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✏️</div>
        </button>
      </div>

      {incidents.length > 0 && (
        <>
          <SectionLabel>Incidents flagged</SectionLabel>
          <div style={{ margin: "0 16px" }}>
            <Card style={{ padding: "12px 16px", border: `1px solid ${C.redBorder}`, background: C.redLight }}>
              <div style={{ color: C.red, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>⚠ {incidents.length} incident{incidents.length > 1 ? "s" : ""} in recent notes</div>
              {incidents.slice(0, 2).map(n => (
                <div key={n.id} style={{ fontSize: 12, color: C.textMid, marginTop: 4 }}>
                  {clientForNote(n)?.name} · {n.author_name} · {timeAgo(n.submitted_at)}
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      <SectionLabel>Today's shifts</SectionLabel>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {todayNotes.length === 0 ? (
          <Card style={{ padding: 20, textAlign: "center" }}>
            <p style={{ color: C.textMuted, fontSize: 14 }}>No shifts logged today yet</p>
            <button onClick={() => setTab("log")} style={{ color: C.navy, fontWeight: 600, fontSize: 13, background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>Be the first →</button>
          </Card>
        ) : todayNotes.map(n => {
          const client = clientForNote(n);
          const mood = MOOD_COLORS[n.mood] || { bg: "#f9fafb", color: C.textMuted };
          return (
            <Card key={n.id} style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: (client?.color || C.navy) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: client?.color || C.navy, flexShrink: 0 }}>{client?.initials || "?"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{client?.name || "Unknown client"}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{n.author_name} · {timeAgo(n.submitted_at)}</div>
                </div>
                {n.mood && <span style={{ background: mood.bg, color: mood.color, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12 }}>{n.mood}</span>}
              </div>
            </Card>
          );
        })}
      </div>

      <SectionLabel>Recent team notes</SectionLabel>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {recentNotes.length === 0 ? (
          <Card style={{ padding: 20, textAlign: "center" }}>
            <p style={{ color: C.textMuted, fontSize: 14 }}>No notes yet — log the first shift!</p>
          </Card>
        ) : recentNotes.map(n => {
          const client = clientForNote(n);
          return (
            <Card key={n.id} style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: (client?.color || C.navy) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: client?.color || C.navy, flexShrink: 0 }}>{client?.initials || "?"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{client?.name || "Unknown"}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{timeAgo(n.submitted_at)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{n.author_name}</div>
                  <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{n.progress_note}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOG SHIFT ────────────────────────────────────────────────────────────────
const ACTIVITIES = [
  "Walk / outdoor exercise", "Grocery shopping", "Community outing", "Cooking / meal prep",
  "Movie / TV watching", "Board games / cards", "Home tasks / cleaning", "Personal care support",
  "Medication assistance", "Transport / travel", "Medical appointment", "Social activity",
  "Swimming / sport", "Reading / education", "Music / entertainment", "Work / vocational",
  "Phone / technology support", "Relaxation / rest", "Artwork / drawing", "Other",
];

function LogShift({ person, circles, onSubmit }) {
  const [circleId, setCircleId] = useState(circles[0]?.id || "");
  const [shiftDate, setShiftDate] = useState(today());
  const [mood, setMood] = useState("");
  const [activities, setActivities] = useState([]);
  const [progressNote, setNote] = useState("");
  const [hasIncident, setHasIncident] = useState(false);
  const [incidentDetail, setIncidentDetail] = useState("");
  const [followUps, setFollowUps] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const client = circles.find(c => c.id === circleId)?.client;

  const handleSubmit = async () => {
    const e = {};
    if (!mood) e.mood = true;
    if (!progressNote.trim()) e.note = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const note = {
      circle_id: circleId,
      author_person_id: person.id,
      author_name: person.name,
      shift_date: shiftDate,
      mood, activities,
      progress_note: progressNote,
      incidents: hasIncident ? "Yes — see details" : "No incidents",
      incident_detail: hasIncident ? incidentDetail : "",
      follow_ups: followUps,
      visibility_level: "general",
      submitted_at: new Date().toISOString(),
    };
    await onSubmit(note);
    setLoading(false);
    setSubmitted(true);
  };

  const reset = () => { setMood(""); setActivities([]); setNote(""); setHasIncident(false); setIncidentDetail(""); setFollowUps(""); setErrors({}); setSubmitted(false); setShiftDate(today()); };

  if (circles.length === 0) return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No clients yet</h3>
      <p style={{ color: C.textMuted, fontSize: 14 }}>Go to the Clients tab to add your first client or wait to be assigned one by your business.</p>
    </div>
  );

  if (submitted) return (
    <div className="fu" style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.greenLight, border: `2px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Shift logged</h2>
      <p style={{ color: C.textMuted, marginBottom: 28 }}>Note for <strong style={{ color: C.text }}>{client?.name}</strong> saved and visible to the circle.</p>
      <Btn onClick={reset} small>Log another shift</Btn>
    </div>
  );

  const toggleActivity = (a) => setActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  return (
    <div style={{ padding: "0 16px 120px" }}>
      {/* Circle selector */}
      {circles.length > 1 && (
        <>
          <SectionLabel>Who is this shift for?</SectionLabel>
          <Card style={{ padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {circles.map(c => (
                <button key={c.id} onClick={() => setCircleId(c.id)} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: circleId === c.id ? C.navy : C.surface, color: circleId === c.id ? "#fff" : C.textMid, border: `1px solid ${circleId === c.id ? C.navy : C.border}`, cursor: "pointer" }}>
                  <div style={{ fontSize: 15, marginBottom: 2 }}>{c.client?.initials || "?"}</div>
                  <div style={{ fontSize: 11 }}>{c.client?.name?.split(" ")[0]}</div>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      <SectionLabel>Shift date</SectionLabel>
      <Card style={{ padding: "14px 16px", marginBottom: 12 }}>
        <Input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} />
      </Card>

      <SectionLabel>How was the participant?</SectionLabel>
      <Card style={{ padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {["Happy and engaged", "Calm", "Quiet/withdrawn", "Tired", "Anxious", "Agitated", "Up and down", "Upset"].map(m => {
            const sel = mood === m;
            const colorMap = { "Happy and engaged": C.green, "Calm": C.navy, "Anxious": C.amber, "Agitated": C.amber, "Up and down": C.amber, "Upset": C.red };
            const col = colorMap[m] || C.textMuted;
            return <button key={m} type="button" onClick={() => setMood(m)} style={{ padding: "7px 13px", borderRadius: 20, fontSize: 13, fontWeight: 500, border: `1.5px solid ${sel ? col : C.border}`, background: sel ? col : C.surface, color: sel ? "#fff" : C.textMid, cursor: "pointer" }}>{m}</button>;
          })}
        </div>
        {errors.mood && <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>Please select a mood</div>}
      </Card>

      <SectionLabel>Activities this shift</SectionLabel>
      <Card style={{ padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {ACTIVITIES.map(a => {
            const sel = activities.includes(a);
            return <button key={a} type="button" onClick={() => toggleActivity(a)} style={{ padding: "7px 13px", borderRadius: 20, fontSize: 13, fontWeight: 500, border: `1.5px solid ${sel ? C.navy : C.border}`, background: sel ? C.navy : C.surface, color: sel ? "#fff" : C.textMid, cursor: "pointer" }}>{sel ? "✓ " : ""}{a}</button>;
          })}
        </div>
      </Card>

      <SectionLabel>Shift summary</SectionLabel>
      <Card style={{ padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>Brief, clear, person-centred. What happened? How did they engage?</div>
        <Input rows={5} value={progressNote} onChange={e => setNote(e.target.value)} placeholder={`${client?.name?.split(" ")[0] || "The participant"} presented well today. We focused on…`} />
        {errors.note && <div style={{ color: C.red, fontSize: 12, marginTop: 4 }}>A shift summary is required</div>}
      </Card>

      <SectionLabel>Incidents or concerns</SectionLabel>
      <Card style={{ padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: hasIncident ? C.red : C.text }}>{hasIncident ? "⚠ Incident to report" : "No incidents this shift"}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Tap to toggle</div>
          </div>
          <button onClick={() => setHasIncident(h => !h)} style={{ width: 50, height: 28, borderRadius: 14, border: "none", cursor: "pointer", background: hasIncident ? C.red : C.borderMid, position: "relative", transition: "background .2s" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "left .2s", left: hasIncident ? 25 : 3 }} />
          </button>
        </div>
        {hasIncident && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <Input rows={3} value={incidentDetail} onChange={e => setIncidentDetail(e.target.value)} placeholder="What happened? When? How did you respond? Who was notified?" />
          </div>
        )}
      </Card>

      <SectionLabel>Follow-ups for the team</SectionLabel>
      <Card style={{ padding: "14px 16px", marginBottom: 16 }}>
        <Input value={followUps} onChange={e => setFollowUps(e.target.value)} placeholder="e.g. Dentist Friday 14th, medication review due…" />
      </Card>

      {Object.keys(errors).length > 0 && <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "11px 14px", marginBottom: 12, fontSize: 13, color: C.red }}>Please fill in all required fields.</div>}

      <Btn full onClick={handleSubmit} loading={loading}>Submit shift note →</Btn>
    </div>
  );
}

// ─── CLIENTS TAB ──────────────────────────────────────────────────────────────
function ClientsTab({ person, circles, notes, onAddClient, onSelectCircle, selectedCircleId, onBack }) {
  if (selectedCircleId) {
    const circle = circles.find(c => c.id === selectedCircleId);
    const circleNotes = notes.filter(n => n.circle_id === selectedCircleId).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    return <ClientDetail circle={circle} notes={circleNotes} onBack={onBack} person={person} />;
  }

  const canAddClient = person.account_type === "business_owner" || person.account_type === "independent";

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ padding: "12px 0 4px", color: C.textMuted, fontSize: 13 }}>{circles.length} client{circles.length !== 1 ? "s" : ""} in your circles</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {circles.length === 0 && (
          <Card style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
            <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 16 }}>
              {person.account_type === "employee" ? "No clients assigned yet. Your business owner will assign clients to you." : "No clients yet. Add your first client below."}
            </p>
            {canAddClient && <Btn small onClick={onAddClient}>+ Add first client</Btn>}
          </Card>
        )}
        {circles.map(c => {
          const lastNote = notes.filter(n => n.circle_id === c.id).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];
          return (
            <Card key={c.id} onClick={() => onSelectCircle(c.id)} style={{ overflow: "hidden" }}>
              <div style={{ height: 4, background: c.client?.color || C.navy }} />
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: (c.client?.color || C.navy) + "18", border: `1.5px solid ${(c.client?.color || C.navy) + "30"}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: c.client?.color || C.navy, flexShrink: 0 }}>{c.client?.initials || "?"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{c.client?.name || "Unknown client"}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {lastNote ? `Last note: ${timeAgo(lastNote.submitted_at)} · ${lastNote.author_name}` : "No notes yet"}
                    </div>
                    {c.client?.ndis_number && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{c.client.ndis_number}</div>}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: 20 }}>›</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {canAddClient && circles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Btn full variant="outline" onClick={onAddClient}>+ Add a client</Btn>
        </div>
      )}
    </div>
  );
}

function ClientDetail({ circle, notes, onBack, person }) {
  if (!circle) return null;
  const client = circle.client || {};
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: client.color || C.navy, padding: "20px 20px 24px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#fff", flexShrink: 0 }}>{client.initials || "?"}</div>
          <div>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{client.name}</h2>
            {client.ndis_number && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>{client.ndis_number}</p>}
          </div>
        </div>
      </div>

      {(client.emergency_contact || client.address || client.medical_notes) && (
        <>
          <SectionLabel>Contact information</SectionLabel>
          <Card style={{ margin: "0 16px", overflow: "hidden" }}>
            {[["📍", "Address", client.address], ["🚨", "Emergency contact", client.emergency_contact], ["📞", "Emergency phone", client.emergency_phone]].filter(([,, v]) => v).map(([icon, label, val]) => (
              <div key={label} style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 18, width: 28, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div>
                  <div style={{ fontSize: 14, color: C.text, marginTop: 2 }}>{val}</div>
                </div>
              </div>
            ))}
            {client.medical_notes && (
              <div style={{ padding: "12px 16px", background: C.amberLight, borderTop: `1px solid ${C.amberBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.amber, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>⚕ Medical notes</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{client.medical_notes}</div>
              </div>
            )}
          </Card>
        </>
      )}

      {client.ndis_goals?.length > 0 && (
        <>
          <SectionLabel>NDIS goals</SectionLabel>
          <Card style={{ margin: "0 16px", overflow: "hidden" }}>
            {client.ndis_goals.map((g, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: i < client.ndis_goals.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: client.color || C.navy, flexShrink: 0 }} />
                <div style={{ fontSize: 14, color: C.text }}>{g}</div>
              </div>
            ))}
          </Card>
        </>
      )}

      <SectionLabel>{notes.length} shift note{notes.length !== 1 ? "s" : ""} on file</SectionLabel>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {notes.length === 0 && <Card style={{ padding: 24, textAlign: "center" }}><p style={{ color: C.textMuted, fontSize: 14 }}>No shift notes yet for this client</p></Card>}
        {notes.map(n => {
          const mood = MOOD_COLORS[n.mood] || { bg: "#f9fafb", color: C.textMuted };
          return (
            <Card key={n.id} style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>{n.author_name}</div><div style={{ fontSize: 12, color: C.textMuted }}>{formatDate(n.shift_date)}</div></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    {n.mood && <span style={{ background: mood.bg, color: mood.color, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12 }}>{n.mood}</span>}
                    {n.incidents && n.incidents !== "No incidents" && !n.incidents.includes("No —") && <span style={{ background: C.redLight, color: C.red, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12 }}>⚠ Incident</span>}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{n.progress_note}</p>
                {n.follow_ups && <div style={{ marginTop: 10, padding: "8px 12px", background: C.navyXLight, borderRadius: 8 }}><span style={{ fontSize: 12, color: C.navy }}>📌 {n.follow_ups}</span></div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADD CLIENT MODAL ─────────────────────────────────────────────────────────
function AddClientModal({ person, business, onSave, onClose }) {
  const [name, setName] = useState("");
  const [ndisNumber, setNdisNumber] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim()) { setError("Client name is required."); return; }
    setLoading(true); setError("");
    try {
      const initials = name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      const colors = ["#2563B0", "#16A34A", "#DC2626", "#D97706", "#7C3AED", "#0891B2", "#DB2777"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const { data: client, error: cErr } = await supabase.from("clients").insert({
        name: name.trim(), initials, color,
        ndis_number: ndisNumber || null,
        date_of_birth: dob || null,
        address: address || null,
        emergency_contact: emergencyContact || null,
        emergency_phone: emergencyPhone || null,
        medical_notes: medicalNotes || null,
        created_by_person_id: person.id,
        created_by_business_id: business?.id || null,
      }).select().single();
      if (cErr) throw cErr;

      const { data: circle, error: circErr } = await supabase.from("circles").insert({
        client_id: client.id,
        created_by_person_id: person.id,
      }).select().single();
      if (circErr) throw circErr;

      const memberType = business ? "business_employee" : "independent_owner";
      await supabase.from("circle_members").insert({
        circle_id: circle.id,
        person_id: person.id,
        membership_type: memberType,
        professional_role: person.professional_role,
        visibility_level: "clinical",
        business_id: business?.id || null,
        status: "active",
      });

      onSave({ ...circle, client });
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="su" style={{ background: C.surface, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto", padding: "24px 20px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add a client</h2>
          <button onClick={onClose} style={{ background: C.bg, border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, color: C.textMuted }}>✕</button>
        </div>
        <ErrorMsg msg={error} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { val: name, set: setName, ph: "Full name *", type: "text" },
            { val: ndisNumber, set: setNdisNumber, ph: "NDIS number (optional)", type: "text" },
            { val: dob, set: setDob, ph: "Date of birth", type: "date" },
            { val: address, set: setAddress, ph: "Address (optional)", type: "text" },
            { val: emergencyContact, set: setEmergencyContact, ph: "Emergency contact name", type: "text" },
            { val: emergencyPhone, set: setEmergencyPhone, ph: "Emergency contact phone", type: "tel" },
          ].map((f, i) => <Input key={i} type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} />)}
          <Input rows={3} value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} placeholder="Medical notes, allergies, important info (optional)" />
          <Btn full onClick={save} loading={loading}>Save client →</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── TEAM CHAT ────────────────────────────────────────────────────────────────
function TeamChat({ person, circles, notes, onSend }) {
  const [circleId, setCircleId] = useState(circles[0]?.id || "");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async (cId) => {
    if (!cId) return;
    setLoadingMsgs(true);
    const { data } = await supabase.from("messages").select("*").eq("circle_id", cId).order("sent_at", { ascending: true }).limit(200);
    setMessages(data || []);
    setLoadingMsgs(false);
  }, []);

  useEffect(() => { loadMessages(circleId); }, [circleId, loadMessages]);

  useEffect(() => {
    if (!circleId) return;
    const channel = supabase.channel(`chat-${circleId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `circle_id=eq.${circleId}` },
        ({ new: m }) => setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]))
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [circleId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !circleId) return;
    setText("");
    const msg = { id: "m" + Date.now(), circle_id: circleId, author_person_id: person.id, author_name: person.name, text: trimmed, sent_at: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    await supabase.from("messages").insert({ circle_id: circleId, author_person_id: person.id, author_name: person.name, text: trimmed });
  };

  const grouped = messages.map((m, i) => ({ ...m, isFirst: i === 0 || messages[i - 1].author_person_id !== m.author_person_id, isLast: i === messages.length - 1 || messages[i + 1].author_person_id !== m.author_person_id }));
  const isOwn = m => m.author_person_id === person.id;
  const AVATAR_COLORS = ["#2563B0", "#16A34A", "#DC2626", "#D97706", "#7C3AED", "#0891B2"];
  let colorIdx = {};
  let idx = 0;
  messages.forEach(m => { if (!colorIdx[m.author_person_id]) { colorIdx[m.author_person_id] = AVATAR_COLORS[idx++ % AVATAR_COLORS.length]; } });

  if (circles.length === 0) return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <p style={{ color: C.textMuted, fontSize: 14 }}>No client circles yet. Add a client to start chatting with their team.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      {circles.length > 1 && (
        <div style={{ display: "flex", gap: 6, padding: "8px 16px", borderBottom: `1px solid ${C.border}`, background: C.surface, overflowX: "auto" }}>
          {circles.map(c => (
            <button key={c.id} onClick={() => setCircleId(c.id)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${circleId === c.id ? C.navy : C.border}`, background: circleId === c.id ? C.navy : C.surface, color: circleId === c.id ? "#fff" : C.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              {c.client?.name?.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {loadingMsgs && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: 20 }}>Loading…</div>}
        {!loadingMsgs && messages.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: 40 }}>No messages yet. Say hello to the team!</div>}
        {grouped.map(m => {
          const own = isOwn(m);
          const color = colorIdx[m.author_person_id] || C.navy;
          const chatTime = iso => { const s = (Date.now() - new Date(iso)) / 1000; if (s < 60) return "now"; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" }); };
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: own ? "row-reverse" : "row", alignItems: "flex-end", gap: 7, marginBottom: m.isLast ? 10 : 2 }}>
              <div style={{ width: 26, flexShrink: 0 }}>
                {m.isLast && <div style={{ width: 26, height: 26, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 10 }}>{(m.author_name || "?")[0]}</div>}
              </div>
              <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: own ? "flex-end" : "flex-start" }}>
                {m.isFirst && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3, paddingLeft: own ? 0 : 2, paddingRight: own ? 2 : 0 }}>{!own && <span style={{ fontWeight: 600, color: C.textMid, marginRight: 5 }}>{m.author_name}</span>}{chatTime(m.sent_at)}</div>}
                <div style={{ background: own ? C.navy : C.surface, color: own ? "#fff" : C.text, border: own ? "none" : `1px solid ${C.border}`, borderRadius: own ? (m.isFirst ? "18px 18px 4px 18px" : "18px 4px 4px 18px") : (m.isFirst ? "18px 18px 18px 4px" : "4px 18px 18px 4px"), padding: "10px 14px", fontSize: 14, lineHeight: 1.6 }}>{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "10px 16px 100px", background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Message the circle team…" rows={1}
          style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, color: C.text, padding: "10px 14px", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 100 }}
          onFocus={e => e.target.style.borderColor = C.navy} onBlur={e => e.target.style.borderColor = C.border} />
        <button onClick={send} disabled={!text.trim()} style={{ width: 40, height: 40, borderRadius: "50%", background: text.trim() ? C.navy : C.border, border: "none", color: "#fff", fontSize: 16, cursor: text.trim() ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>➤</button>
      </div>
    </div>
  );
}

// ─── MORE TAB ─────────────────────────────────────────────────────────────────
function MoreTab({ person, business, subscription, onLogout }) {
  const planLabel = subscription?.status === "trial" ? "Free trial" : subscription?.plan_type === "business" ? "Business plan" : "Independent plan";
  const monthlyCost = subscription ? (subscription.base_price + Math.max(0, (subscription.staff_count || 0) - (subscription.included_staff || 5)) * (subscription.extra_staff_rate || 3)).toFixed(2) : "0.00";
  const Row = ({ icon, label, sub, onPress, danger }) => (
    <div onClick={onPress} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${C.border}`, cursor: onPress ? "pointer" : "default" }}>
      <div style={{ fontSize: 20, width: 32, textAlign: "center" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: danger ? C.red : C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{sub}</div>}
      </div>
      {onPress && <div style={{ color: C.textMuted, fontSize: 16 }}>›</div>}
    </div>
  );
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: C.navy, padding: "20px 20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700 }}>{(person.name || "?")[0]}</div>
        <div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>{person.name}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{PROFESSIONAL_ROLES.find(r => r.value === person.professional_role)?.label || "Support Worker"}</div>
          {business && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{business.name}</div>}
        </div>
      </div>

      {subscription && (
        <>
          <SectionLabel>Subscription</SectionLabel>
          <Card style={{ margin: "0 16px", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{planLabel}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  {subscription.status === "trial" ? `Trial ends ${new Date(subscription.trial_ends_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}` : "Active subscription"}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, color: C.navy }}>${monthlyCost}<span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>/mo</span></div>
            </div>
            {business && person.account_type === "business_owner" && (
              <div style={{ padding: "10px 16px", fontSize: 13, color: C.textMid }}>
                {subscription.staff_count || 0} staff · {Math.max(0, 5 - (subscription.staff_count || 0))} slots remaining at base price
              </div>
            )}
          </Card>
        </>
      )}

      {business && person.account_type === "business_owner" && (
        <>
          <SectionLabel>Your business</SectionLabel>
          <Card style={{ margin: "0 16px", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{business.name}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>Join code for new staff:</div>
              <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: C.navy, letterSpacing: 2, marginTop: 4 }}>{business.join_code}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Share this with staff when they sign up as an Employee</div>
            </div>
            <Row icon="👥" label="Manage staff" sub="Approve, suspend or remove team members" />
            <Row icon="👤" label="Manage clients" sub="Add, edit or deactivate clients" />
          </Card>
        </>
      )}

      <SectionLabel>Account</SectionLabel>
      <Card style={{ margin: "0 16px", overflow: "hidden" }}>
        <Row icon="✉️" label="Email" sub={person.email} />
        <Row icon="🔑" label="Change password" sub="Update your login password" />
        <div onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer" }}>
          <div style={{ fontSize: 20, width: 32, textAlign: "center" }}>🚪</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: C.red }}>Log out</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authScreen, setAuthScreen] = useState("welcome"); // welcome | login | signup
  const [session, setSession] = useState(null);
  const [person, setPerson] = useState(null);
  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [circles, setCircles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState("home");
  const [clientView, setClientView] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadApp(s.user.id);
      else setAppLoading(false);
    });
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadApp(s.user.id);
      else { setPerson(null); setAppLoading(false); }
    });
    return () => authSub.unsubscribe();
  }, []);

  const loadApp = async (authId) => {
    setAppLoading(true);
    try {
      // Load person
      const { data: p } = await supabase.from("people").select("*").eq("auth_id", authId).single();
      if (!p) { setAppLoading(false); return; }
      setPerson(p);

      // Load business (if owner or employee)
      if (p.account_type === "business_owner") {
        const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", p.id).single();
        setBusiness(biz);
        if (biz) {
          const { data: sub } = await supabase.from("subscriptions").select("*").eq("entity_type", "business").eq("entity_id", biz.id).single();
          setSubscription(sub);
        }
      } else if (p.account_type === "employee") {
        const { data: bm } = await supabase.from("business_members").select("*, businesses(*)").eq("person_id", p.id).eq("status", "active").single();
        if (bm?.businesses) setBusiness(bm.businesses);
      } else {
        const { data: sub } = await supabase.from("subscriptions").select("*").eq("entity_type", "person").eq("entity_id", p.id).single();
        setSubscription(sub);
      }

      // Load circles
      await loadCircles(p.id);
    } catch (err) { console.error("loadApp:", err); }
    setAppLoading(false);
  };

  const loadCircles = async (personId) => {
    const { data: memberships } = await supabase.from("circle_members").select("circle_id, membership_type, visibility_level").eq("person_id", personId).eq("status", "active");
    if (!memberships?.length) return;
    const circleIds = memberships.map(m => m.circle_id);
    const { data: circlesData } = await supabase.from("circles").select("*, clients(*)").in("id", circleIds);
    const enriched = (circlesData || []).map(c => {
      const mem = memberships.find(m => m.circle_id === c.id);
      return { ...c, client: c.clients, membership_type: mem?.membership_type, visibility_level: mem?.visibility_level };
    });
    setCircles(enriched);

    // Load notes for all circles
    if (circleIds.length > 0) {
      const { data: notesData } = await supabase.from("notes").select("*").in("circle_id", circleIds).order("submitted_at", { ascending: false }).limit(300);
      setNotes(notesData || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPerson(null); setBusiness(null); setSubscription(null); setCircles([]); setNotes([]);
    setAuthScreen("welcome");
  };

  const handleSubmitNote = async (note) => {
    const { data } = await supabase.from("notes").insert(note).select().single();
    if (data) setNotes(prev => [data, ...prev]);
  };

  const handleAddClient = async (circleWithClient) => {
    setCircles(prev => [...prev, circleWithClient]);
    setShowAddClient(false);
  };

  // Loading state
  if (appLoading) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <LogoMark size={56} />
        <Spinner color="#fff" size={24} />
      </div>
    </>
  );

  // Not authenticated
  if (!session || !person) {
    return (
      <>
        <style>{CSS}</style>
        {authScreen === "welcome" && <WelcomeScreen onLogin={() => setAuthScreen("login")} onSignUp={() => setAuthScreen("signup")} />}
        {authScreen === "login" && <LoginScreen onBack={() => setAuthScreen("welcome")} onSuccess={() => setAuthScreen("welcome")} />}
        {authScreen === "signup" && <SignUpFlow onBack={() => setAuthScreen("welcome")} onSuccess={() => setAuthScreen("login")} />}
      </>
    );
  }

  // Employee pending approval
  if (person.account_type === "employee" && !business) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <LogoMark size={56} />
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Waiting for approval</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.7, maxWidth: 300 }}>Your join request has been sent. Your business owner needs to approve you before you can access the app. Check back soon!</p>
        <button onClick={handleLogout} style={{ marginTop: 32, background: "none", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, color: "rgba(255,255,255,0.6)", padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>Log out</button>
      </div>
    </>
  );

  const TAB_TITLES = { home: "Home", log: "Log shift", clients: "Clients", chat: "Team chat", more: "More" };
  const showClientDetail = tab === "clients" && clientView;

  return (
    <>
      <style>{CSS}</style>
      {showAddClient && <AddClientModal person={person} business={business} onSave={handleAddClient} onClose={() => setShowAddClient(false)} />}
      <Header
        title={showClientDetail ? circles.find(c => c.id === clientView)?.client?.name || "Client" : TAB_TITLES[tab]}
        person={showClientDetail ? null : person}
        onLogout={handleLogout}
        back={showClientDetail}
        onBack={() => setClientView(null)}
      />
      <main>
        {tab === "home" && <HomeDashboard person={person} circles={circles} notes={notes} setTab={setTab} />}
        {tab === "log" && <LogShift person={person} circles={circles} onSubmit={handleSubmitNote} />}
        {tab === "clients" && (
          <ClientsTab
            person={person} circles={circles} notes={notes}
            onAddClient={() => setShowAddClient(true)}
            onSelectCircle={id => setClientView(id)}
            selectedCircleId={clientView}
            onBack={() => setClientView(null)}
          />
        )}
        {tab === "chat" && <TeamChat person={person} circles={circles} notes={notes} />}
        {tab === "more" && <MoreTab person={person} business={business} subscription={subscription} onLogout={handleLogout} />}
      </main>
      <TabBar tab={tab} setTab={t => { setClientView(null); setTab(t); }} />
    </>
  );
}
