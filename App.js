import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase, isConfigured as supabaseConfigured } from './supabase';

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { id: "blake", name: "Blake",   pin: "0000", role: "admin",  clients: ["aaron","col"] },
  { id: "sarah", name: "Sarah",   pin: "1111", role: "worker", clients: ["aaron"] },
  { id: "james", name: "James",   pin: "2222", role: "worker", clients: ["aaron"] },
];
const DEMO_CLIENTS = {
  aaron: {
    name: "Aaron Hughes", initials: "AH", color: "#2563B0",
    ndisNumber: "NDIS430221987", dob: "14 March 1989",
    address: "14 Bloom Street, Werribee VIC 3030",
    emergencyContact: "Margaret Hughes (Mother)", emergencyPhone: "0412 345 678",
    medicalNotes: "Intellectual disability (mild). No known allergies. Takes Melatonin 5mg nightly.",
    goals: [
      "Increase independence in daily living tasks",
      "Build social connections and community participation",
      "Improve personal hygiene routine with less prompting",
      "Develop cooking and meal preparation skills",
    ],
  },
  col: {
    name: "Colenders (Col)", initials: "CO", color: "#16A34A",
    ndisNumber: "NDIS521334156", dob: "22 September 1975",
    address: "7 Banksia Road, Hoppers Crossing VIC 3029",
    emergencyContact: "Rita Colenders (Wife)", emergencyPhone: "0423 567 890",
    medicalNotes: "Acquired brain injury. Difficulty with complex instructions. Seizure history — emergency protocol in care plan.",
    goals: [
      "Maintain community access and social participation",
      "Support physical health and mobility",
      "Manage daily living with gradually reducing support levels",
    ],
  },
};

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
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { scroll-behavior:smooth; }
  body {
    font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
    background:${C.bg}; color:${C.text};
    -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:transparent;
    overscroll-behavior:none;
  }
  button,input,textarea,select { font-family:inherit; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
  @keyframes pinPop  { 0%{transform:scale(.7)}70%{transform:scale(1.1)}100%{transform:scale(1)} }
  @keyframes shake   { 0%,100%{transform:translateX(0)}25%,75%{transform:translateX(-8px)}50%{transform:translateX(8px)} }
  .fu  { animation:fadeUp  .28s ease both; }
  .fu2 { animation:fadeUp  .28s .07s ease both; }
  .fu3 { animation:fadeUp  .28s .14s ease both; }
  .su  { animation:slideUp .3s ease both; }
  ::-webkit-scrollbar { width:0; }
`;

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:C.surface, borderRadius:14,
      border:`1px solid ${C.border}`, ...style,
      cursor: onClick ? "pointer" : undefined,
    }}>{children}</div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize:11, fontWeight:600, color:C.textMuted,
      letterSpacing:.8, textTransform:"uppercase",
      padding:"18px 20px 6px", ...style,
    }}>{children}</div>
  );
}

function Input({ value, onChange, placeholder, type="text", rows, style }) {
  const [focused, setFocused] = useState(false);
  const base = {
    width:"100%", background:focused?C.surface:C.bg,
    border:`1.5px solid ${focused?C.navy:C.border}`,
    borderRadius:10, color:C.text, padding:"11px 14px",
    fontSize:15, outline:"none", transition:"all .15s",
    resize:rows?"vertical":undefined, ...style,
  };
  if (rows) return <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} style={base} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} />;
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} />;
}

function Btn({ children, onClick, variant="primary", full, small, disabled, type="button" }) {
  const styles = {
    primary: { background:disabled?C.borderMid:C.navy, color:"#fff", border:"none" },
    outline: { background:"transparent", color:C.navy, border:`1.5px solid ${C.navy}` },
    ghost:   { background:"transparent", color:C.textMuted, border:"none" },
    danger:  { background:C.red, color:"#fff", border:"none" },
    success: { background:C.green, color:"#fff", border:"none" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      borderRadius:12, fontWeight:600, fontSize:small?14:16,
      padding:small?"9px 18px":"13px 24px",
      width:full?"100%":undefined,
      cursor:disabled?"not-allowed":"pointer", transition:"all .15s",
      opacity:disabled?.6:1,
      ...styles[variant],
    }}
      onMouseEnter={e=>{ if(!disabled&&variant==="primary") e.currentTarget.style.background=C.navyMid; }}
      onMouseLeave={e=>{ if(!disabled&&variant==="primary") e.currentTarget.style.background=C.navy; }}
    >{children}</button>
  );
}

function Badge({ label, bg=C.navyLight, color=C.navy }) {
  return (
    <span style={{ display:"inline-block", background:bg, color, fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20 }}>
      {label}
    </span>
  );
}

function ChipSelect({ options, value=[], onChange }) {
  const toggle = o => value.includes(o) ? onChange(value.filter(v=>v!==o)) : onChange([...value,o]);
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
      {options.map(o => {
        const sel = value.includes(o);
        return (
          <button key={o} type="button" onClick={()=>toggle(o)} style={{
            padding:"7px 13px", borderRadius:20, fontSize:13, fontWeight:500,
            border:`1.5px solid ${sel?C.navy:C.border}`,
            background:sel?C.navy:C.surface, color:sel?"#fff":C.textMid,
            cursor:"pointer", transition:"all .15s",
          }}>{sel?"✓ ":""}{o}</button>
        );
      })}
    </div>
  );
}

function RadioChips({ options, value, onChange, colorMap }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
      {options.map(o => {
        const sel = value===o;
        const col = colorMap?.[o]||C.navy;
        return (
          <button key={o} type="button" onClick={()=>onChange(o)} style={{
            padding:"9px 14px", borderRadius:20, fontSize:13, fontWeight:500,
            border:`1.5px solid ${sel?col:C.border}`,
            background:sel?col:C.surface, color:sel?"#fff":C.textMid,
            cursor:"pointer", transition:"all .15s",
          }}>{o}</button>
        );
      })}
    </div>
  );
}

function Divider() { return <div style={{height:1,background:C.border,margin:"14px 0"}} />; }

// ─── ORG SETUP ────────────────────────────────────────────────────────────────
function OrgSetup({ onSetup, error }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); if (!code.trim()) return; setBusy(true); await onSetup(code.trim()); setBusy(false); };
  return (
    <div style={{ minHeight:"100vh", background:C.navy, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="fu" style={{ width:"100%", maxWidth:360 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <div style={{ display:"flex", gap:2 }}>{["#4f9cf9","#e05c5c","#f5c842","#5cbf7a"].map((c,i)=><div key={i} style={{ width:8,height:8,borderRadius:2,background:c }}/>)}</div>
          </div>
          <h1 style={{ color:"#fff", fontSize:24, fontWeight:600, marginBottom:6 }}>Exceed Support</h1>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>Enter your organisation code</p>
        </div>
        <form onSubmit={submit}>
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. EXCEED001"
            style={{ width:"100%", background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:12, color:"#fff", padding:"14px 16px", fontSize:16, outline:"none", letterSpacing:1, marginBottom:12 }} />
          {error && <div style={{ background:"rgba(220,38,38,0.2)", border:"1px solid rgba(220,38,38,0.4)", borderRadius:10, padding:"10px 14px", color:"#fca5a5", fontSize:13, marginBottom:12 }}>{error}</div>}
          <button type="submit" disabled={busy||!code.trim()} style={{ width:"100%", background:busy||!code.trim()?"rgba(255,255,255,0.15)":"#fff", color:busy||!code.trim()?"rgba(255,255,255,0.4)":C.navy, border:"none", borderRadius:12, fontWeight:700, fontSize:16, padding:14, cursor:busy||!code.trim()?"not-allowed":"pointer" }}>
            {busy?"Connecting…":"Connect →"}
          </button>
        </form>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:12, textAlign:"center", marginTop:24 }}>Code provided on subscription</p>
      </div>
    </div>
  );
}

// ─── PIN SCREEN ───────────────────────────────────────────────────────────────
function PinScreen({ onLogin, users=DEMO_USERS, orgName="Exceed Support", isDemo }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const press = d => {
    if (pin.length>=4) return;
    const next = pin+d;
    setPin(next);
    if (next.length===4) {
      const user = users.find(u=>u.pin===next);
      if (user) { setTimeout(()=>onLogin(user),150); }
      else { setShake(true); setError("Incorrect PIN"); setTimeout(()=>{ setPin(""); setShake(false); setError(""); },800); }
    }
  };
  return (
    <div style={{ minHeight:"100vh", background:C.navy, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 24px env(safe-area-inset-bottom)" }}>
      <div className="fu" style={{ textAlign:"center", marginBottom:44 }}>
        <div style={{ width:56, height:56, borderRadius:16, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
          <div style={{ display:"flex", gap:2 }}>{["#4f9cf9","#e05c5c","#f5c842","#5cbf7a"].map((c,i)=><div key={i} style={{ width:8,height:8,borderRadius:2,background:c }}/>)}</div>
        </div>
        <h1 style={{ color:"#fff", fontSize:22, fontWeight:600, marginBottom:4 }}>{orgName}</h1>
        <p style={{ color:"rgba(255,255,255,0.45)", fontSize:14 }}>Support Worker Portal</p>
      </div>
      <div className="fu2" style={{ display:"flex", gap:14, marginBottom:10, animation:shake?"shake .4s ease":undefined }}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{ width:14, height:14, borderRadius:"50%", background:i<pin.length?"#fff":"transparent", border:`2px solid ${i<pin.length?"#fff":"rgba(255,255,255,0.3)"}`, transition:"all .15s", animation:i<pin.length?"pinPop .2s ease":undefined }} />
        ))}
      </div>
      <div style={{ height:20, marginBottom:28, color:"#f87171", fontSize:13, textAlign:"center" }}>{error}</div>
      <div className="fu3" style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:280 }}>
        {[[1,2,3],[4,5,6],[7,8,9],[null,0,"⌫"]].map((row,ri)=>(
          <div key={ri} style={{ display:"flex", gap:10 }}>
            {row.map((k,ki)=>{
              if (k===null) return <div key={ki} style={{ flex:1 }}/>;
              const isDel=k==="⌫";
              return (
                <button key={ki} onClick={()=>isDel?setPin(p=>p.slice(0,-1)):press(String(k))}
                  style={{ flex:1, height:60, border:"none", borderRadius:14, background:"rgba(255,255,255,0.1)", color:"#fff", fontSize:isDel?20:24, fontWeight:400, cursor:"pointer", transition:"all .12s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.18)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}
                  onMouseDown={e=>e.currentTarget.style.transform="scale(0.94)"}
                  onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                >{k}</button>
              );
            })}
          </div>
        ))}
      </div>
      {isDemo && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, marginTop:32, textAlign:"center" }}>Demo — Blake: 0000 · Sarah: 1111 · James: 2222</p>}
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ title, user, onLogout, back, onBack }) {
  return (
    <div style={{ background:C.navy, paddingTop:"max(env(safe-area-inset-top),12px)", position:"sticky", top:0, zIndex:100 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {back && (
            <button onClick={onBack} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, padding:"6px 10px", color:"rgba(255,255,255,0.9)", fontSize:16, cursor:"pointer" }}>‹</button>
          )}
          <h1 style={{ color:"#fff", fontSize:20, fontWeight:600 }}>{title}</h1>
        </div>
        {user && !back && (
          <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(255,255,255,0.12)", border:"none", borderRadius:20, padding:"6px 12px 6px 8px", cursor:"pointer", color:"rgba(255,255,255,0.85)", fontSize:13 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{user.name[0]}</div>
            {user.name}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── BOTTOM TAB BAR ───────────────────────────────────────────────────────────
function TabBar({ tab, setTab }) {
  const tabs = [
    { key:"home",    label:"Home",    icon:"🏠" },
    { key:"log",     label:"Log Shift",icon:"✏️" },
    { key:"clients", label:"Clients", icon:"👥" },
    { key:"chat",    label:"Chat",    icon:"💬" },
    { key:"more",    label:"More",    icon:"⚙️" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", paddingBottom:"env(safe-area-inset-bottom)", zIndex:100 }}>
      {tabs.map(t=>(
        <button key={t.key} onClick={()=>setTab(t.key)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 0 8px", background:"none", border:"none", cursor:"pointer", color:tab===t.key?C.navy:C.textMuted, transition:"color .15s" }}>
          <div style={{ width:36, height:24, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, background:tab===t.key?C.navyXLight:"transparent", transition:"background .15s" }}>{t.icon}</div>
          <span style={{ fontSize:10, fontWeight:tab===t.key?600:400, lineHeight:1 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d+"T12:00:00");
  return dt.toLocaleDateString("en-AU",{ weekday:"short", day:"numeric", month:"short", year:"numeric" });
}
function timeAgo(iso) {
  const s=(Date.now()-new Date(iso))/1000;
  if(s<60) return "just now";
  if(s<3600) return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function greeting() {
  const h = new Date().getHours();
  if (h<12) return "Good morning";
  if (h<17) return "Good afternoon";
  return "Good evening";
}
function todayLabel() {
  return new Date().toLocaleDateString("en-AU",{ weekday:"long", day:"numeric", month:"long" });
}
const MOOD_COLORS = {
  "Happy and engaged": { bg:C.greenLight, color:C.green },
  "Calm":              { bg:"#eff6ff", color:"#1d4ed8" },
  "Quiet/withdrawn":   { bg:"#f9fafb", color:C.textMuted },
  "Tired":             { bg:"#f9fafb", color:C.textMuted },
  "Anxious":           { bg:C.amberLight, color:C.amber },
  "Agitated":          { bg:C.amberLight, color:C.amber },
  "Up and down":       { bg:C.amberLight, color:C.amber },
  "Upset":             { bg:C.redLight, color:C.red },
};

// ─── HOME DASHBOARD ───────────────────────────────────────────────────────────
function HomeDashboard({ user, notes, clients=DEMO_CLIENTS, setTab }) {
  const accessible = notes.filter(n=>user.clients.includes(n.clientId));
  const todayNotes = accessible.filter(n=>n.shiftDate===today()||n.submittedAt?.startsWith(today()));
  const recentNotes = [...accessible].sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt)).slice(0,4);
  const incidents = accessible.filter(n=>n.incidents&&n.incidents!=="No incidents"&&!n.incidents.includes("No —"));
  const isAdmin = user.role==="admin";

  return (
    <div style={{ paddingBottom:100 }}>
      {/* Hero */}
      <div style={{ background:C.navy, padding:"20px 20px 28px" }}>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:13, marginBottom:2 }}>{greeting()},</p>
        <h2 style={{ color:"#fff", fontSize:24, fontWeight:600, marginBottom:4 }}>{user.name} 👋</h2>
        <p style={{ color:"rgba(255,255,255,0.45)", fontSize:13 }}>{todayLabel()}</p>

        {/* Log shift CTA */}
        <button onClick={()=>setTab("log")} style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)",
          borderRadius:14, padding:"14px 18px", cursor:"pointer", marginTop:20,
          color:"#fff",
        }}>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontWeight:600, fontSize:16 }}>Log a shift</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2 }}>Record today's support notes</div>
          </div>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✏️</div>
        </button>
      </div>

      {/* Today's activity */}
      <SectionLabel>Today's shifts</SectionLabel>
      {todayNotes.length===0 ? (
        <div style={{ margin:"0 16px", background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, padding:"20px", textAlign:"center" }}>
          <p style={{ color:C.textMuted, fontSize:14 }}>No shifts logged today yet</p>
          <button onClick={()=>setTab("log")} style={{ color:C.navy, fontWeight:600, fontSize:13, background:"none", border:"none", cursor:"pointer", marginTop:6 }}>Be the first →</button>
        </div>
      ) : (
        <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:8 }}>
          {todayNotes.map(n=>{
            const client=clients[n.clientId];
            const mood=MOOD_COLORS[n.mood]||{bg:"#f9fafb",color:C.textMuted};
            return (
              <Card key={n.id} style={{ padding:"12px 16px" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ width:38,height:38,borderRadius:10,background:client?.color+"18",border:`1px solid ${client?.color+"30"}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:client?.color,flexShrink:0 }}>{client?.initials}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{client?.name}</div>
                    <div style={{ fontSize:12, color:C.textMuted }}>{n.authorName} · {timeAgo(n.submittedAt)}</div>
                  </div>
                  <span style={{ background:mood.bg, color:mood.color, fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:12 }}>{n.mood}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Incidents alert */}
      {incidents.length>0 && (
        <>
          <SectionLabel>Recent incidents</SectionLabel>
          <div style={{ margin:"0 16px" }}>
            <Card style={{ padding:"12px 16px", border:`1px solid ${C.redBorder}`, background:C.redLight }}>
              <div style={{ color:C.red, fontWeight:600, fontSize:13, marginBottom:4 }}>⚠ {incidents.length} incident{incidents.length>1?"s":""} in recent notes</div>
              {incidents.slice(0,2).map(n=>(
                <div key={n.id} style={{ fontSize:12, color:C.textMid, marginTop:4 }}>
                  {clients[n.clientId]?.name} · {n.authorName} · {timeAgo(n.submittedAt)}
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      {/* Recent team activity */}
      <SectionLabel>Recent team notes</SectionLabel>
      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:8 }}>
        {recentNotes.length===0 && (
          <Card style={{ padding:20, textAlign:"center" }}>
            <p style={{ color:C.textMuted, fontSize:14 }}>No notes yet — log the first shift!</p>
          </Card>
        )}
        {recentNotes.map(n=>{
          const client=clients[n.clientId];
          return (
            <Card key={n.id} style={{ padding:"12px 16px" }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ width:36,height:36,borderRadius:9,background:client?.color+"18",border:`1px solid ${client?.color+"30"}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:client?.color,flexShrink:0 }}>{client?.initials}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:2 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{client?.name}</div>
                    <div style={{ fontSize:11, color:C.textMuted, flexShrink:0, marginLeft:8 }}>{timeAgo(n.submittedAt)}</div>
                  </div>
                  <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>{n.authorName} · {formatDate(n.shiftDate||n.weekOf)}</div>
                  <p style={{ fontSize:13, color:C.textMid, lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                    {n.progressNote}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOG SHIFT FORM ───────────────────────────────────────────────────────────
const ACTIVITIES = [
  "Walk / outdoor exercise","Grocery shopping","Community outing","Cooking / meal prep",
  "Movie / TV watching","Board games / cards","Artwork / drawing","Home tasks / cleaning",
  "Personal care support","Medication assistance","Transport / travel","Medical appointment",
  "Social activity","Swimming / sport","Reading / education","Music / entertainment",
  "Work / vocational","Phone / technology support","Relaxation / rest","Other",
];
const GOALS_OPTIONS = [
  "Independence skills","Social participation","Health & wellbeing","Community access",
  "Communication","Daily living skills","Emotional regulation","Physical activity",
  "Personal care","Nutrition goals","Employment / education",
];

function LogShift({ user, setNotes, clients=DEMO_CLIENTS, onSubmit }) {
  const [clientId, setClientId] = useState(user.clients[0]||"");
  const [shiftDate, setShiftDate] = useState(today());
  const [mood, setMood] = useState("");
  const [activities, setActivities] = useState([]);
  const [progressNote, setNote] = useState("");
  const [goalsWorked, setGoals] = useState([]);
  const [hasIncident, setHasIncident] = useState(false);
  const [incidentDetail, setIncidentDetail] = useState("");
  const [followUps, setFollowUps] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e={};
    if (!mood) e.mood=true;
    if (!progressNote.trim()) e.note=true;
    return e;
  };

  const handleSubmit = () => {
    const e=validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const note = {
      id:"n"+Date.now(), authorId:user.id, authorName:user.name,
      clientId, shiftDate, weekOf:shiftDate,
      shifts:1, activities, mood,
      goalsWorked, progressNote,
      incidents: hasIncident?"Yes — see details":"No incidents",
      incidentDetail: hasIncident?incidentDetail:"",
      followUps, submittedAt:new Date().toISOString(),
    };
    if (onSubmit) onSubmit(note);
    else setNotes(prev=>[note,...prev]);
    setSubmitted(true);
  };

  const reset = () => {
    setMood(""); setActivities([]); setNote(""); setGoals([]);
    setHasIncident(false); setIncidentDetail(""); setFollowUps("");
    setErrors({}); setSubmitted(false); setShiftDate(today());
  };

  if (submitted) return (
    <div className="fu" style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ width:64,height:64,borderRadius:"50%",background:C.greenLight,border:`2px solid ${C.greenBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px" }}>✅</div>
      <h2 style={{ fontSize:22, fontWeight:600, marginBottom:8 }}>Shift logged</h2>
      <p style={{ color:C.textMuted, lineHeight:1.7, marginBottom:28 }}>
        Your note for <strong style={{ color:C.text }}>{clients[clientId]?.name}</strong> has been saved and is visible to the team.
      </p>
      <Btn onClick={reset}>Log another shift</Btn>
    </div>
  );

  return (
    <div style={{ padding:"0 16px 120px" }}>

      {/* Client + Date */}
      <SectionLabel>Who and when</SectionLabel>
      <Card style={{ padding:"14px 16px", marginBottom:12 }}>
        {user.clients.length>1 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.textMid, marginBottom:8 }}>Client</div>
            <div style={{ display:"flex", gap:8 }}>
              {user.clients.map(id=>(
                <button key={id} onClick={()=>setClientId(id)} style={{ flex:1, padding:"10px", borderRadius:10, fontSize:14, fontWeight:600, background:clientId===id?C.navy:C.surface, color:clientId===id?"#fff":C.textMid, border:`1px solid ${clientId===id?C.navy:C.border}`, cursor:"pointer", transition:"all .15s" }}>
                  <div style={{ fontSize:16, marginBottom:2 }}>{clients[id]?.initials}</div>
                  <div style={{ fontSize:12 }}>{clients[id]?.name?.split(" ")[0]}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:C.textMid, marginBottom:8 }}>Shift date</div>
          <Input type="date" value={shiftDate} onChange={e=>setShiftDate(e.target.value)} />
        </div>
      </Card>

      {/* Mood */}
      <SectionLabel>How was the participant?</SectionLabel>
      <Card style={{ padding:"14px 16px", marginBottom:12 }}>
        <RadioChips
          options={["Happy and engaged","Calm","Quiet/withdrawn","Tired","Anxious","Agitated","Up and down","Upset"]}
          value={mood} onChange={setMood}
          colorMap={{ "Happy and engaged":C.green,"Calm":C.navy,"Quiet/withdrawn":C.textMuted,"Tired":C.textMuted,"Anxious":C.amber,"Agitated":C.amber,"Up and down":C.amber,"Upset":C.red }}
        />
        {errors.mood && <div style={{ color:C.red, fontSize:12, marginTop:8 }}>Please select a mood</div>}
      </Card>

      {/* Activities */}
      <SectionLabel>Activities this shift</SectionLabel>
      <Card style={{ padding:"14px 16px", marginBottom:12 }}>
        <ChipSelect options={ACTIVITIES} value={activities} onChange={setActivities} />
      </Card>

      {/* Goals */}
      <SectionLabel>NDIS goals worked on</SectionLabel>
      <Card style={{ padding:"14px 16px", marginBottom:12 }}>
        <ChipSelect options={GOALS_OPTIONS} value={goalsWorked} onChange={setGoals} />
      </Card>

      {/* Shift summary */}
      <SectionLabel>Shift summary</SectionLabel>
      <Card style={{ padding:"14px 16px", marginBottom:12 }}>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:8, lineHeight:1.5 }}>
          Brief, clear, person-centred. What happened? How did they engage? Anything the next worker should know?
        </div>
        <Input
          rows={5} value={progressNote} onChange={e=>setNote(e.target.value)}
          placeholder={`${clients[clientId]?.name?.split(" ")[0]||"The participant"} presented well today. We focused on…`}
        />
        {errors.note && <div style={{ color:C.red, fontSize:12, marginTop:4 }}>A shift summary is required</div>}
      </Card>

      {/* Incident toggle */}
      <SectionLabel>Incidents or concerns</SectionLabel>
      <Card style={{ padding:"14px 16px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:600, fontSize:15, color:hasIncident?C.red:C.text }}>
              {hasIncident?"⚠ Incident to report":"No incidents this shift"}
            </div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>Tap to toggle</div>
          </div>
          <button onClick={()=>setHasIncident(h=>!h)} style={{
            width:50, height:28, borderRadius:14, border:"none", cursor:"pointer", transition:"all .2s",
            background:hasIncident?C.red:C.borderMid, position:"relative",
          }}>
            <div style={{ width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,transition:"left .2s",left:hasIncident?25:3 }} />
          </button>
        </div>
        {hasIncident && (
          <div className="su" style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.textMid, marginBottom:8 }}>Incident details</div>
            <Input rows={4} value={incidentDetail} onChange={e=>setIncidentDetail(e.target.value)}
              placeholder="What happened? When? How did you respond? Who was notified?" />
          </div>
        )}
      </Card>

      {/* Follow-ups */}
      <SectionLabel>Follow-ups for the team</SectionLabel>
      <Card style={{ padding:"14px 16px", marginBottom:16 }}>
        <Input value={followUps} onChange={e=>setFollowUps(e.target.value)}
          placeholder="e.g. Dentist Friday 14th, medication review due, mention to coordinator…" />
      </Card>

      {Object.keys(errors).length>0 && (
        <div style={{ background:C.redLight, border:`1px solid ${C.redBorder}`, borderRadius:10, padding:"11px 14px", marginBottom:12, fontSize:13, color:C.red }}>
          Please fill in all required fields before submitting.
        </div>
      )}

      <Btn full onClick={handleSubmit}>Submit shift note →</Btn>
    </div>
  );
}

// ─── CLIENTS TAB ─────────────────────────────────────────────────────────────
function ClientsTab({ user, notes, clients=DEMO_CLIENTS, onSelect }) {
  const accessible = user.clients.map(id=>({ id, ...clients[id] })).filter(Boolean);

  return (
    <div style={{ padding:"0 16px 100px" }}>
      <div style={{ padding:"12px 0 4px", color:C.textMuted, fontSize:13 }}>
        {accessible.length} client{accessible.length!==1?"s":""} assigned to you
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
        {accessible.map(c => {
          const lastNote = notes.filter(n=>n.clientId===c.id).sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt))[0];
          return (
            <Card key={c.id} onClick={()=>onSelect&&onSelect(c.id)} style={{ overflow:"hidden" }}>
              <div style={{ height:4, background:c.color }} />
              <div style={{ padding:"16px" }}>
                <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                  <div style={{ width:52,height:52,borderRadius:14,background:c.color+"18",border:`1.5px solid ${c.color+"30"}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:17,color:c.color,flexShrink:0 }}>{c.initials}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:17, color:C.text }}>{c.name}</div>
                    <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
                      {c.ndisNumber || "NDIS number not set"}
                    </div>
                    {lastNote && (
                      <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>
                        Last note: {timeAgo(lastNote.submittedAt)} by {lastNote.authorName}
                      </div>
                    )}
                    {!lastNote && (
                      <div style={{ fontSize:12, color:C.amber, marginTop:4 }}>No notes yet</div>
                    )}
                  </div>
                  <div style={{ color:C.textMuted, fontSize:20 }}>›</div>
                </div>

                {/* Goals preview */}
                {c.goals && c.goals.length>0 && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:.6, marginBottom:6 }}>NDIS Goals</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {c.goals.slice(0,3).map(g=>(
                        <span key={g} style={{ background:C.navyXLight, color:C.navy, fontSize:11, fontWeight:500, padding:"3px 8px", borderRadius:12 }}>{g}</span>
                      ))}
                      {c.goals.length>3 && <span style={{ color:C.textMuted, fontSize:11, padding:"3px 4px" }}>+{c.goals.length-3} more</span>}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── CLIENT DETAIL ────────────────────────────────────────────────────────────
function ClientDetail({ client, notes, onBack }) {
  if (!client) return null;
  return (
    <div style={{ paddingBottom:100 }}>
      {/* Profile header */}
      <div style={{ background:client.color, padding:"20px 20px 24px" }}>
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          <div style={{ width:60,height:60,borderRadius:16,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:"#fff",flexShrink:0 }}>{client.initials}</div>
          <div>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:700 }}>{client.name}</h2>
            <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginTop:2 }}>{client.ndisNumber||"NDIS number not set"}</p>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <SectionLabel>Contact information</SectionLabel>
      <Card style={{ margin:"0 16px", overflow:"hidden" }}>
        {[
          ["📅","Date of birth", client.dob],
          ["📍","Address", client.address],
          ["🚨","Emergency contact", client.emergencyContact],
          ["📞","Emergency phone", client.emergencyPhone],
        ].filter(([,,v])=>v).map(([icon,label,val])=>(
          <div key={label} style={{ display:"flex", gap:12, padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:18, width:28, textAlign:"center", flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:.5 }}>{label}</div>
              <div style={{ fontSize:14, color:C.text, marginTop:2 }}>{val}</div>
            </div>
          </div>
        ))}
        {client.medicalNotes && (
          <div style={{ padding:"12px 16px", background:C.amberLight, borderTop:`1px solid ${C.amberBorder}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.amber, textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>⚕ Medical notes</div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{client.medicalNotes}</div>
          </div>
        )}
      </Card>

      {/* NDIS Goals */}
      {client.goals && client.goals.length>0 && (
        <>
          <SectionLabel>NDIS goals</SectionLabel>
          <Card style={{ margin:"0 16px", overflow:"hidden" }}>
            {client.goals.map((g,i)=>(
              <div key={i} style={{ display:"flex", gap:12, padding:"12px 16px", borderBottom:i<client.goals.length-1?`1px solid ${C.border}`:"none", alignItems:"center" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:client.color,flexShrink:0 }} />
                <div style={{ fontSize:14, color:C.text }}>{g}</div>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* Shift notes history */}
      <SectionLabel>{notes.length} shift note{notes.length!==1?"s":""} on file</SectionLabel>
      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:8 }}>
        {notes.length===0 && (
          <Card style={{ padding:24, textAlign:"center" }}>
            <p style={{ color:C.textMuted, fontSize:14 }}>No shift notes yet for this client</p>
          </Card>
        )}
        {notes.map(n=>{
          const mood = MOOD_COLORS[n.mood]||{bg:"#f9fafb",color:C.textMuted};
          return (
            <Card key={n.id} style={{ overflow:"hidden" }}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{n.authorName}</div>
                    <div style={{ fontSize:12, color:C.textMuted }}>{formatDate(n.shiftDate||n.weekOf)}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    <span style={{ background:mood.bg, color:mood.color, fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:12 }}>{n.mood}</span>
                    {n.incidents&&n.incidents!=="No incidents"&&!n.incidents.includes("No —") && (
                      <span style={{ background:C.redLight, color:C.red, fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:12 }}>⚠ Incident</span>
                    )}
                  </div>
                </div>
                {n.activities?.length>0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                    {n.activities.slice(0,4).map(a=><span key={a} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"3px 8px", fontSize:11, color:C.textMid }}>{a}</span>)}
                    {n.activities.length>4 && <span style={{ color:C.textMuted, fontSize:11, padding:"3px 4px" }}>+{n.activities.length-4}</span>}
                  </div>
                )}
                <p style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>{n.progressNote}</p>
                {n.followUps && (
                  <div style={{ marginTop:10, padding:"8px 12px", background:C.navyXLight, borderRadius:8 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:C.navy }}>📌 </span>
                    <span style={{ fontSize:12, color:C.navy }}>{n.followUps}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── TEAM CHAT ────────────────────────────────────────────────────────────────
const AVATAR_COLORS_LIST = ["#2563B0","#16A34A","#DC2626","#D97706","#7C3AED","#0891B2"];

function TeamChat({ user, messages, setMessages, users=DEMO_USERS, onSendMessage }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const send = () => {
    const trimmed=text.trim(); if (!trimmed) return;
    const msg={id:"m"+Date.now(),authorId:user.id,authorName:user.name,text:trimmed,sentAt:new Date().toISOString()};
    if (onSendMessage) onSendMessage(msg); else setMessages(prev=>[...prev,msg]);
    setText("");
  };

  const grouped = messages.map((m,i)=>({ ...m, isFirst:i===0||messages[i-1].authorId!==m.authorId, isLast:i===messages.length-1||messages[i+1].authorId!==m.authorId }));
  const getColor = id => { const idx=users.findIndex(u=>u.id===id); return AVATAR_COLORS_LIST[idx>=0?idx%AVATAR_COLORS_LIST.length:0]; };
  const chatTime = iso => { const s=(Date.now()-new Date(iso))/1000; if(s<60)return"now"; if(s<3600)return`${Math.floor(s/60)}m`; if(s<86400)return`${Math.floor(s/3600)}h`; return new Date(iso).toLocaleDateString("en-AU",{day:"numeric",month:"short"}); };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 130px)" }}>
      <div style={{ display:"flex", gap:6, padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:C.surface, overflowX:"auto" }}>
        {users.map(u=>(
          <div key={u.id} style={{ display:"flex", alignItems:"center", gap:6, background:C.bg, borderRadius:20, padding:"4px 10px 4px 6px", fontSize:12, flexShrink:0 }}>
            <div style={{ width:22,height:22,borderRadius:"50%",background:getColor(u.id),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:10 }}>{u.name[0]}</div>
            <span style={{ fontWeight:u.id===user.id?600:400, color:C.text }}>{u.name}</span>
            {u.id===user.id&&<span style={{ color:C.textMuted }}>(you)</span>}
          </div>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:2 }}>
        {grouped.map(m=>{
          const own=m.authorId===user.id;
          return (
            <div key={m.id} style={{ display:"flex", flexDirection:own?"row-reverse":"row", alignItems:"flex-end", gap:7, marginBottom:m.isLast?10:2 }}>
              <div style={{ width:26, flexShrink:0 }}>
                {m.isLast&&<div style={{ width:26,height:26,borderRadius:"50%",background:getColor(m.authorId),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:10 }}>{m.authorName[0]}</div>}
              </div>
              <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", alignItems:own?"flex-end":"flex-start" }}>
                {m.isFirst&&<div style={{ fontSize:11,color:C.textMuted,marginBottom:3,paddingLeft:own?0:2,paddingRight:own?2:0 }}>{!own&&<span style={{ fontWeight:600,color:C.textMid,marginRight:5 }}>{m.authorName}</span>}{chatTime(m.sentAt)}</div>}
                <div style={{ background:own?C.navy:C.surface, color:own?"#fff":C.text, border:own?"none":`1px solid ${C.border}`, borderRadius:own?(m.isFirst?"18px 18px 4px 18px":"18px 4px 4px 18px"):(m.isFirst?"18px 18px 18px 4px":"4px 18px 18px 4px"), padding:"10px 14px", fontSize:14, lineHeight:1.6 }}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:"10px 16px 100px", background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"flex-end" }}>
        <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }} placeholder="Message the team…" rows={1}
          style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:20, color:C.text, padding:"10px 14px", fontSize:14, outline:"none", resize:"none", lineHeight:1.5, maxHeight:100 }}
          onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor=C.border}
        />
        <button onClick={send} disabled={!text.trim()} style={{ width:40,height:40,borderRadius:"50%",background:text.trim()?C.navy:C.border,border:"none",color:"#fff",fontSize:16,cursor:text.trim()?"pointer":"default",transition:"all .15s",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>➤</button>
      </div>
    </div>
  );
}

// ─── MORE TAB ─────────────────────────────────────────────────────────────────
function MoreTab({ user, orgName, onLogout }) {
  const Row=({icon,label,sub,danger})=>(
    <div style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:`1px solid ${C.border}`,cursor:"pointer" }}>
      <div style={{ fontSize:20,width:32,textAlign:"center" }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15,fontWeight:500,color:danger?C.red:C.text }}>{label}</div>
        {sub&&<div style={{ fontSize:12,color:C.textMuted,marginTop:1 }}>{sub}</div>}
      </div>
      <div style={{ color:C.textMuted,fontSize:16 }}>›</div>
    </div>
  );
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:C.navy, padding:"20px 20px 24px", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:52,height:52,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:700 }}>{user.name[0]}</div>
        <div>
          <div style={{ color:"#fff",fontSize:18,fontWeight:600 }}>{user.name}</div>
          <div style={{ color:"rgba(255,255,255,0.5)",fontSize:13 }}>{user.role==="admin"?"Administrator":"Support Worker"} · {orgName}</div>
        </div>
      </div>
      <SectionLabel>Organisation</SectionLabel>
      <Card style={{ borderRadius:0, margin:0 }}>
        <Row icon="🏢" label="Organisation settings" sub="Manage staff and clients" />
        <Row icon="📊" label="Reports & exports" sub="NDIS audit-ready shift logs" />
        <Row icon="🔔" label="Notifications" sub="Push notification settings" />
      </Card>
      <SectionLabel>Account</SectionLabel>
      <Card style={{ borderRadius:0, margin:0 }}>
        <Row icon="🔑" label="Change my PIN" sub="Update your 4-digit login PIN" />
        <Row icon="ℹ️" label="About" sub="Exceed Support Portal v2.0" />
        <div onClick={onLogout} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 20px",cursor:"pointer" }}>
          <div style={{ fontSize:20,width:32,textAlign:"center" }}>🔒</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15,fontWeight:500,color:C.red }}>Lock screen</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_NOTES = [
  { id:"n1",authorId:"sarah",authorName:"Sarah",clientId:"aaron",shiftDate:today(),weekOf:today(),shifts:1,
    activities:["Walk / outdoor exercise","Cooking / meal prep"],mood:"Happy and engaged",
    goalsWorked:["Independence skills","Daily living skills"],
    progressNote:"Aaron was in great spirits today. We went for a walk to the local park then came back and made pasta together for lunch — he's getting more confident in the kitchen. Reminded him about the dentist on Friday.",
    incidents:"No incidents",incidentDetail:"",followUps:"Dentist appointment Friday — please remind Aaron Thursday night.",
    submittedAt:new Date(Date.now()-2*60*60*1000).toISOString() },
  { id:"n2",authorId:"james",authorName:"James",clientId:"aaron",shiftDate:new Date(Date.now()-86400000).toISOString().split("T")[0],weekOf:new Date(Date.now()-86400000).toISOString().split("T")[0],shifts:1,
    activities:["Community outing","Board games / cards"],mood:"Calm",
    goalsWorked:["Social participation"],
    progressNote:"Aaron was calm and cooperative. We went to Highpoint and he enjoyed browsing at his own pace. Played cards when we got back. Worth noting he was in the same clothes from the previous visit — clothing change remains a focus.",
    incidents:"No incidents",incidentDetail:"",followUps:"",
    submittedAt:new Date(Date.now()-28*60*60*1000).toISOString() },
  { id:"n3",authorId:"blake",authorName:"Blake",clientId:"col",shiftDate:today(),weekOf:today(),shifts:1,
    activities:["Home tasks / cleaning","Relaxation / rest"],mood:"Quiet/withdrawn",
    goalsWorked:["Daily living skills"],
    progressNote:"Col was quiet today but cooperative. We did a light tidy of the living areas and spent some time watching TV. He mentioned feeling tired. No concerning behaviours, just a low-energy day.",
    incidents:"No incidents",incidentDetail:"",followUps:"Monitor energy levels — may be worth flagging to coordinator if continues.",
    submittedAt:new Date(Date.now()-4*60*60*1000).toISOString() },
];
const SEED_MESSAGES = [
  { id:"m1",authorId:"sarah",authorName:"Sarah",text:"Just finished with Aaron — good visit today! He's in great spirits. Heads up re the dentist Friday.",sentAt:new Date(Date.now()-2*60*60*1000).toISOString() },
  { id:"m2",authorId:"james",authorName:"James",text:"Thanks Sarah! I've got him Wednesday morning. Will remind him.",sentAt:new Date(Date.now()-90*60*1000).toISOString() },
];

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [orgId,   setOrgId]   = useState(()=>supabaseConfigured?localStorage.getItem("exceed_org_id"):null);
  const [orgName, setOrgName] = useState(()=>supabaseConfigured?(localStorage.getItem("exceed_org_name")||"Exceed Support"):"Exceed Support");
  const [orgError, setOrgError] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [dbUsers,   setDbUsers]   = useState([]);
  const [dbClients, setDbClients] = useState({});
  const [user,  setUser]  = useState(null);
  const [tab,   setTab]   = useState("home");
  const [notes, setNotes] = useState(supabaseConfigured?[]:SEED_NOTES);
  const [messages, setMessages] = useState(supabaseConfigured?[]:SEED_MESSAGES);
  const [clientView, setClientView] = useState(null);

  const active = { users:supabaseConfigured&&orgId?dbUsers:DEMO_USERS, clients:supabaseConfigured&&orgId?dbClients:DEMO_CLIENTS };

  const toNote = n=>({ id:n.id,authorId:n.author_id,authorName:n.author_name,clientId:n.client_id,shiftDate:n.shift_date||n.week_of,weekOf:n.week_of,shifts:n.shifts,activities:n.activities||[],mood:n.mood,goalsWorked:n.goals_worked||[],progressNote:n.progress_note,incidents:n.incidents,incidentDetail:n.incident_detail,followUps:n.follow_ups,submittedAt:n.submitted_at });
  const toMsg  = m=>({ id:m.id,authorId:m.author_id,authorName:m.author_name,text:m.text,sentAt:m.sent_at });
  const toClient = c=>({ name:c.name,initials:c.initials,color:c.color,ndisNumber:c.ndis_number,dob:c.date_of_birth,address:c.address,emergencyContact:c.emergency_contact,emergencyPhone:c.emergency_phone,medicalNotes:c.medical_notes,goals:c.ndis_goals||[] });

  const loadOrg = useCallback(async id=>{
    if (!supabaseConfigured||!id) return;
    setOrgLoading(true);
    try {
      const {data:org} = await supabase.from("organisations").select("id,name").eq("id",id).single();
      if (org) { setOrgName(org.name); localStorage.setItem("exceed_org_name",org.name); }
      const {data:usersData} = await supabase.from("users").select("id,name,pin,role,user_clients(client_id)").eq("org_id",id).eq("is_active",true);
      if (usersData) setDbUsers(usersData.map(u=>({ id:u.id,name:u.name,pin:u.pin,role:u.role,clients:(u.user_clients||[]).map(uc=>uc.client_id) })));
      const {data:clientsData} = await supabase.from("clients").select("*").eq("org_id",id).eq("is_active",true);
      if (clientsData) { const m={}; clientsData.forEach(c=>{ m[c.id]=toClient(c); }); setDbClients(m); }
      const {data:notesData} = await supabase.from("notes").select("*").eq("org_id",id).order("submitted_at",{ascending:false}).limit(300);
      if (notesData) setNotes(notesData.map(toNote));
      const {data:msgsData} = await supabase.from("messages").select("*").eq("org_id",id).order("sent_at",{ascending:true}).limit(300);
      if (msgsData) setMessages(msgsData.map(toMsg));
    } catch(err) { console.error("loadOrg:",err); }
    setOrgLoading(false);
  },[]);

  useEffect(()=>{ if (!supabaseConfigured||!orgId||!user) return;
    const ch=supabase.channel(`org-${orgId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notes",filter:`org_id=eq.${orgId}`},({new:n})=>setNotes(prev=>prev.find(x=>x.id===n.id)?prev:[toNote(n),...prev]))
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`org_id=eq.${orgId}`},({new:m})=>setMessages(prev=>prev.find(x=>x.id===m.id)?prev:[...prev,toMsg(m)]))
      .subscribe();
    return ()=>{ ch.unsubscribe(); };
  },[orgId,user]);

  useEffect(()=>{ loadOrg(orgId); },[orgId,loadOrg]);

  const handleSubmitNote = async note=>{
    setNotes(prev=>[note,...prev]);
    if (!supabaseConfigured||!orgId) return;
    await supabase.from("notes").insert({ id:note.id,org_id:orgId,author_id:note.authorId,author_name:note.authorName,client_id:note.clientId,week_of:note.shiftDate,shift_date:note.shiftDate,shifts:note.shifts,activities:note.activities,mood:note.mood,goals_worked:note.goalsWorked,progress_note:note.progressNote,incidents:note.incidents,incident_detail:note.incidentDetail,follow_ups:note.followUps,submitted_at:note.submittedAt });
  };
  const handleSendMessage = async msg=>{
    setMessages(prev=>[...prev,msg]);
    if (!supabaseConfigured||!orgId) return;
    await supabase.from("messages").insert({ id:msg.id,org_id:orgId,author_id:msg.authorId,author_name:msg.authorName,text:msg.text,sent_at:msg.sentAt });
  };
  const handleOrgSetup = async code=>{
    setOrgError("");
    const {data}=await supabase.from("organisations").select("id,name").eq("access_code",code).single();
    if (!data) { setOrgError("Invalid organisation code. Please check and try again."); return; }
    localStorage.setItem("exceed_org_id",data.id); localStorage.setItem("exceed_org_name",data.name);
    setOrgId(data.id); setOrgName(data.name);
  };

  const TAB_TITLES = { home:"Home", log:"Log shift", clients:"Clients", chat:"Team chat", more:"More" };

  if (supabaseConfigured&&!orgId) return <><style>{CSS}</style><OrgSetup onSetup={handleOrgSetup} error={orgError}/></>;
  if (orgLoading) return <><style>{CSS}</style><div style={{ minHeight:"100vh",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center" }}><p style={{ color:"rgba(255,255,255,0.6)" }}>Loading…</p></div></>;

  // Client detail view overrides tab
  const showClientDetail = tab==="clients"&&clientView;

  return (
    <>
      <style>{CSS}</style>
      {!user ? (
        <PinScreen onLogin={u=>{ setUser(u); setTab("home"); }} users={active.users} orgName={orgName} isDemo={!supabaseConfigured} />
      ) : (
        <>
          <Header
            title={showClientDetail?active.clients[clientView]?.name:TAB_TITLES[tab]}
            user={!showClientDetail?user:null}
            onLogout={()=>setUser(null)}
            back={showClientDetail}
            onBack={()=>setClientView(null)}
          />
          <main>
            {tab==="home"    && <HomeDashboard user={user} notes={notes} clients={active.clients} setTab={setTab} />}
            {tab==="log"     && <LogShift user={user} setNotes={setNotes} clients={active.clients} onSubmit={handleSubmitNote} />}
            {tab==="clients" && !showClientDetail && (
              <ClientsTab user={user} notes={notes} clients={active.clients} onSelect={setClientView} />
            )}
            {tab==="clients" && showClientDetail && (
              <ClientDetail client={active.clients[clientView]} notes={notes.filter(n=>n.clientId===clientView).sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt))} onBack={()=>setClientView(null)} />
            )}
            {tab==="chat"    && <TeamChat messages={messages} setMessages={setMessages} user={user} users={active.users} onSendMessage={handleSendMessage} />}
            {tab==="more"    && <MoreTab user={user} orgName={orgName} onLogout={()=>setUser(null)} />}
          </main>
          <TabBar tab={tab} setTab={t=>{ setClientView(null); setTab(t); }} />
        </>
      )}
    </>
  );
}
