'use client';
import { useState, useEffect, useCallback, useRef } from "react";

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const storage = {
  async get(k) { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; } },
  async set(k, v) { try { await window.storage.set(k, JSON.stringify(v)); } catch {} },
};

function useStore(key, def) {
  const [d, setD] = useState(def);
  const [loading, setL] = useState(true);
  useEffect(() => { storage.get(key).then(v => { if (v) setD(v); setL(false); }); }, [key]);
  const save = useCallback(n => { setD(n); storage.set(key, n); }, [key]);
  return [d, save, loading];
}

const DEFAULT_UNITS = [
  { id: "u1", name: { he: "סוויטת הזית", en: "The Olive Suite" }, description: { he: "סוויטה רומנטית עם נוף פנורמי לגליל, ג'קוזי פרטי ומרפסת מרווחת מול השקיעה", en: "Romantic suite with panoramic Galilee views, private jacuzzi and spacious sunset terrace" }, type: "couple", capacity: 2, amenities: ["ג'קוזי פרטי", "מרפסת נוף", "מיני בר", "WiFi", "מקרן", "חלוקי רחצה"], prices: { regular: 1450, weekend: 1750, holiday: 2100 }, active: true, order: 1 },
  { id: "u2", name: { he: "בקתת האלון", en: "The Oak Cabin" }, description: { he: "בקתת עץ אותנטית עם אח, מוקפת טבע ושקט מוחלט. חוויה כפרית אמיתית", en: "Authentic wooden cabin with fireplace, surrounded by nature and complete silence" }, type: "couple", capacity: 2, amenities: ["אח", "מטבחון", "חצר פרטית", "WiFi", "ערסל", "מנגל"], prices: { regular: 1200, weekend: 1500, holiday: 1800 }, active: true, order: 2 },
  { id: "u3", name: { he: "סוויטת הגפן", en: "The Vine Suite" }, description: { he: "סוויטה מעוצבת בהשראת כרמי הגליל, עם בריכה פרטית מחוממת וסאונה יבשה", en: "Suite inspired by Galilee vineyards, with heated private pool and dry sauna" }, type: "couple", capacity: 2, amenities: ["בריכה פרטית", "סאונה", "מיני בר", "WiFi", "מקרן", "חלוקי רחצה"], prices: { regular: 1850, weekend: 2200, holiday: 2600 }, active: true, order: 3 },
  { id: "u4", name: { he: "הבית בכרם", en: "The Vineyard House" }, description: { he: "יחידה משפחתית מרווחת עם גינה ירוקה, נדנדה ופינת משחקים לילדים", en: "Spacious family unit with green garden, swing and children's play area" }, type: "family", capacity: 6, amenities: ["גינה", "מטבח מלא", "מנגל", "WiFi", "חניה", "עריסה"], prices: { regular: 1600, weekend: 1900, holiday: 2300 }, active: true, order: 4 },
  { id: "u5", name: { he: "פנטהאוז הגליל", en: "Galilee Penthouse" }, description: { he: "יחידה יוקרתית בקומה העליונה עם נוף 360 מעלות, מתאימה למשפחות גדולות", en: "Luxury top-floor unit with 360 views, perfect for large families" }, type: "family", capacity: 8, amenities: ["גג פרטי", "ג'קוזי", "מטבח מלא", "WiFi", "מנגל", "חניה"], prices: { regular: 2200, weekend: 2600, holiday: 3000 }, active: true, order: 5 },
  { id: "u6", name: { he: "אכסניית הגורן", en: "The Goren Lodge" }, description: { he: "מתחם מרווח לקבוצות עם סלון גדול, מטבח תעשייתי ושטח פתוח נרחב", en: "Spacious compound for groups with large lounge, industrial kitchen and open grounds" }, type: "group", capacity: 16, amenities: ["סלון גדול", "מטבח תעשייתי", "בריכה", "WiFi", "מנגל", "חניה"], prices: { regular: 4500, weekend: 5500, holiday: 6500 }, active: true, order: 6 },
  { id: "u7", name: { he: "חדר השמש", en: "The Sun Room" }, description: { he: "סטודיו אינטימי ומואר עם חלונות גדולים, מושלם לזוג שמחפש פשטות ויוקרה", en: "Intimate sunlit studio with large windows, perfect for couples seeking simplicity and luxury" }, type: "couple", capacity: 2, amenities: ["מרפסת", "מיני בר", "WiFi", "מקרן", "חלוקי רחצה"], prices: { regular: 950, weekend: 1200, holiday: 1450 }, active: true, order: 7 },
  { id: "u8", name: { he: "הווילה", en: "The Villa" }, description: { he: "וילה ענקית ומפוארת עם גינה פרטית נרחבת, בריכה, מטבח שף מאובזר ומרחבי אירוח יוקרתיים. מושלמת לאירועים, חגיגות משפחתיות ושהייה בלתי נשכחת", en: "Magnificent grand villa with expansive private garden, pool, fully-equipped chef's kitchen and luxurious hosting spaces. Perfect for events, family celebrations and unforgettable stays" }, type: "villa", capacity: 20, amenities: ["בריכה פרטית", "גינה ענקית", "מטבח שף", "סלון מרווח", "6 חדרי שינה", "4 חדרי רחצה", "מנגל", "WiFi", "חניה פרטית", "ג'קוזי"], prices: { regular: 6500, weekend: 8000, holiday: 9500 }, active: true, order: 8 },
];

const DEFAULT_REVIEWS = [
  { id: "r1", guestName: "מיכל ורון", unitId: "u1", rating: 5, text: { he: "חוויה מושלמת! הנוף עוצר נשימה והשירות חם ואישי. חזרנו כבר פעמיים.", en: "Perfect experience! Breathtaking views and warm personal service." }, date: "2026-03-15", visible: true },
  { id: "r2", guestName: "דנה כ.", unitId: "u3", rating: 5, text: { he: "הבריכה הפרטית הייתה חלום. ישבנו על המרפסת עם כוס יין ולא רצינו לעזוב.", en: "The private pool was a dream. We didn't want to leave." }, date: "2026-02-20", visible: true },
  { id: "r3", guestName: "עומר ושירה", unitId: "u4", rating: 5, text: { he: "הילדים השתגעו מהגינה. הכל היה מושלם עד הפרט האחרון.", en: "The kids loved the garden. Everything was perfect." }, date: "2026-01-10", visible: true },
  { id: "r4", guestName: "יעל ואלון", unitId: "u2", rating: 5, text: { he: "הבקתה מדהימה. האח, השקט, הטבע — בדיוק מה שהיינו צריכים.", en: "Amazing cabin. The fireplace, silence, nature — exactly what we needed." }, date: "2025-12-25", visible: true },
];

const DEFAULT_SETTINGS = { whatsapp: "972501234567", email: "info@shiluvim-bateva.co.il", phone: "04-1234567", address: { he: "שתולה, גליל המערבי", en: "Shtula, Western Galilee, Israel" }, siteName: { he: "שילובים בטבע", en: "Shiluvim BaTeva" }, social: { instagram: "https://instagram.com/shiluvim.bateva", facebook: "https://facebook.com/shiluvimbateva" } };

export default function AdminApp() {
  const [page, setPage] = useState("login");
  const [units, setUnits] = useStore("site-units", DEFAULT_UNITS);
  const [reviews, setReviews] = useStore("site-reviews", DEFAULT_REVIEWS);
  const [settings, setSettings] = useStore("site-settings", DEFAULT_SETTINGS);
  const [inquiries, setInquiries] = useStore("site-inquiries", []);
  const [tasks, setTasks] = useStore("site-tasks", []);
  const [calls, setCalls] = useStore("site-calls", []);
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState(null);

  const go = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleLogout = async () => {
    try {
      const app = getApps()[0];
      if (app) await signOut(getAuth(app));
    } catch {}
    setAuth(false); setUser(null); go("login");
  };

  return (
    <div style={{ direction: "rtl", fontFamily: "'Heebo',sans-serif", minHeight: "100vh", background: "#f4f5f7" }}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.gb{background:#1B4332;color:#FAF8F2;border:none;padding:14px 36px;font-family:'Heebo',sans-serif;font-size:15px;font-weight:500;letter-spacing:.5px;cursor:pointer;transition:all .3s}
.gb:hover{background:#143728}
.go{background:transparent;color:#1B4332;border:1.5px solid #1B4332;padding:12px 32px;font-family:'Heebo',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .3s}
.go:hover{background:#1B4332;color:#FAF8F2}
input,textarea,select{font-family:'Heebo',sans-serif;font-size:15px;border:1px solid #d4cfc4;padding:12px 16px;background:#fff;color:#1a1a18;width:100%;transition:border-color .3s;outline:none}
input:focus,textarea:focus,select:focus{border-color:#1B4332}
      `}</style>

      {!auth && <AdminLogin settings={settings} onSuccess={(u) => { setAuth(true); setUser(u); go("admin-dash"); }} />}
      {auth && <AdminPanel page={page} go={go} user={user} units={units} setUnits={setUnits} inquiries={inquiries} setInquiries={setInquiries} reviews={reviews} setReviews={setReviews} tasks={tasks} setTasks={setTasks} calls={calls} setCalls={setCalls} settings={settings} setSettings={setSettings} onLogout={handleLogout} />}
    </div>
  );
}

// ADMIN COMPONENTS
// ============================================================

const AS = { bg: "#f4f5f7", card: "#fff", border: "#e2e4e8", green: "#1B4332", gold: "#B8955A", red: "#d44", blue: "#2563eb", orange: "#ea8c00" };

function AdminLogin({ settings, onSuccess }) {
  const [mode, setMode] = useState("email");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef(null);

  const getFirebase = async () => {
    
    const envKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!envKey) return null;
    const cfg = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID };
    return getApps().length === 0 ? initializeApp(cfg) : getApps()[0];
  };

  const handleEmailLogin = async () => {
    if (!email || !pw) { setErr("נא למלא אימייל וסיסמה"); return; }
    setLoading(true); setErr("");
    try {
      const app = await getFirebase();
      if (app) {
        
        const cred = await signInWithEmailAndPassword(getAuth(app), email, pw);
        onSuccess(cred.user); setLoading(false); return;
      }
    } catch (e) {
      const code = e?.code || "";
      if (code.includes("invalid") || code.includes("wrong") || code.includes("not-found")) { setErr("אימייל או סיסמה שגויים"); setLoading(false); return; }
      if (code.includes("too-many")) { setErr("יותר מדי ניסיונות, נסה מאוחר יותר"); setLoading(false); return; }
      if (code.includes("network")) { setErr("בעיית חיבור, נסה שוב"); setLoading(false); return; }
    }
    if (pw === (settings.adminPassword || "admin1234")) { onSuccess({ email, displayName: "Admin" }); }
    else { setErr("אימייל או סיסמה שגויים"); }
    setLoading(false);
  };

  const handleSendCode = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 9) { setErr("נא להזין מספר טלפון תקין"); return; }
    const fullPhone = cleaned.startsWith("972") ? "+" + cleaned : cleaned.startsWith("0") ? "+972" + cleaned.slice(1) : "+972" + cleaned;
    setLoading(true); setErr("");
    try {
      const app = await getFirebase();
      if (app) {
        // Phone auth uses top-level imports
        const auth = getAuth(app);
        if (!window._recaptchaVerifier) {
          window._recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible" });
        }
        const result = await signInWithPhoneNumber(auth, fullPhone, window._recaptchaVerifier);
        setConfirmResult(result);
        setCodeSent(true);
        setLoading(false);
        return;
      }
    } catch (e) {
      const c = e?.code || "";
      if (c.includes("invalid-phone")) { setErr("מספר טלפון לא תקין"); }
      else if (c.includes("too-many")) { setErr("יותר מדי ניסיונות, נסה מאוחר יותר"); }
      else { setErr("שגיאה בשליחת SMS. ודא שהטלפון נכון"); }
      setLoading(false); return;
    }
    setErr("אימות טלפון זמין רק באתר החי"); setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 4) { setErr("נא להזין את הקוד שנשלח"); return; }
    setLoading(true); setErr("");
    try {
      if (confirmResult) {
        const cred = await confirmResult.confirm(code);
        onSuccess(cred.user); setLoading(false); return;
      }
    } catch (e) {
      if (e?.code?.includes("invalid-verification")) { setErr("קוד שגוי, נסה שוב"); }
      else if (e?.code?.includes("expired")) { setErr("הקוד פג תוקף, שלח קוד חדש"); setCodeSent(false); }
      else { setErr("שגיאה באימות הקוד"); }
    }
    setLoading(false);
  };

  const tabStyle = (active) => ({ flex: 1, padding: "10px 0", textAlign: "center", fontSize: 14, fontWeight: 500, cursor: "pointer", background: active ? AS.green : "transparent", color: active ? "#fff" : AS.green, border: "1px solid " + AS.green, transition: "all .2s" });

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: AS.bg }}>
      <div style={{ background: AS.card, padding: 40, width: 400, borderRadius: 12 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: AS.green, marginBottom: 6 }}>ממשק ניהול</div>
          <div style={{ fontSize: 14, color: "#888" }}>שילובים בטבע — Family Resort</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: 24, borderRadius: 6, overflow: "hidden" }}>
          <div onClick={() => { setMode("email"); setErr(""); setCodeSent(false); }} style={tabStyle(mode === "email")}>אימייל וסיסמה</div>
          <div onClick={() => { setMode("phone"); setErr(""); }} style={tabStyle(mode === "phone")}>SMS לטלפון</div>
        </div>

        {mode === "email" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 13, color: "#666" }}>אימייל
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} dir="ltr" style={{ marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 13, color: "#666" }}>סיסמה
              <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && handleEmailLogin()} style={{ marginTop: 4 }} />
            </label>
            {err && <div style={{ color: AS.red, fontSize: 13, textAlign: "center", padding: "4px 0" }}>{err}</div>}
            <button className="gb" onClick={handleEmailLogin} disabled={loading} style={{ width: "100%", marginTop: 4, opacity: loading ? .6 : 1, cursor: loading ? "wait" : "pointer" }}>
              {loading ? "מתחבר..." : "כניסה"}
            </button>
          </div>
        )}

        {mode === "phone" && !codeSent && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 13, color: "#666" }}>מספר טלפון
              <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setErr(""); }} dir="ltr" placeholder="050-1234567" style={{ marginTop: 4 }} />
            </label>
            {err && <div style={{ color: AS.red, fontSize: 13, textAlign: "center", padding: "4px 0" }}>{err}</div>}
            <button className="gb" onClick={handleSendCode} disabled={loading} style={{ width: "100%", marginTop: 4, opacity: loading ? .6 : 1, cursor: loading ? "wait" : "pointer" }}>
              {loading ? "שולח..." : "שלח קוד SMS"}
            </button>
            <div ref={recaptchaRef} />
          </div>
        )}

        {mode === "phone" && codeSent && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ textAlign: "center", fontSize: 14, color: "#666", marginBottom: 4 }}>
              קוד נשלח ל-<span style={{ fontWeight: 600, color: AS.green }}>{phone}</span>
            </div>
            <label style={{ fontSize: 13, color: "#666" }}>הזן את הקוד
              <input type="text" value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setErr(""); }} dir="ltr" placeholder="123456" maxLength={6} style={{ marginTop: 4, textAlign: "center", fontSize: 24, letterSpacing: 8 }} onKeyDown={e => e.key === "Enter" && handleVerifyCode()} />
            </label>
            {err && <div style={{ color: AS.red, fontSize: 13, textAlign: "center", padding: "4px 0" }}>{err}</div>}
            <button className="gb" onClick={handleVerifyCode} disabled={loading} style={{ width: "100%", marginTop: 4, opacity: loading ? .6 : 1, cursor: loading ? "wait" : "pointer" }}>
              {loading ? "מאמת..." : "אימות"}
            </button>
            <button onClick={() => { setCodeSent(false); setCode(""); setErr(""); }} style={{ background: "none", border: "none", color: AS.green, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              שלח קוד חדש
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPanel({ page, go, user, units, setUnits, inquiries, setInquiries, reviews, setReviews, tasks, setTasks, calls, setCalls, settings, setSettings, onLogout }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const menu = [
    { id: "admin-dash", label: "דשבורד", icon: "📊" },
    { id: "admin-inquiries", label: "פניות", icon: "📋" },
    { id: "admin-calendar", label: "יומן", icon: "📅" },
    { id: "admin-units", label: "יחידות", icon: "🏠" },
    { id: "admin-tasks", label: "משימות", icon: "✅" },
    { id: "admin-calls", label: "שיחות", icon: "📞" },
    { id: "admin-reviews", label: "חוות דעת", icon: "⭐" },
    { id: "admin-settings", label: "הגדרות", icon: "⚙️" },
  ];
  const pendingCount = inquiries.filter(i => i.status === "pending").length;

  const mobileNav = menu.slice(0, 4);
  const currentLabel = menu.find(m => m.id === page)?.label || "דשבורד";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: AS.bg, direction: "rtl" }}>
      <style>{`
.a-side{width:220px;position:fixed;top:0;right:0;bottom:0;z-index:150;display:block}
.a-main{margin-right:220px;flex:1;padding:28px;min-height:100vh}
.a-top{display:none}
.a-bot{display:none}
.a-over{display:none}
@media(max-width:768px){
.a-side{display:none !important}
.a-main{margin-right:0 !important;padding:16px 12px 100px !important;padding-top:60px !important}
.a-top{display:flex !important;position:fixed;top:0;left:0;right:0;z-index:140;background:#fff;padding:12px 16px;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e4e8}
.a-bot{display:flex !important;position:fixed;bottom:0;left:0;right:0;z-index:140;background:#fff;border-top:1px solid #e2e4e8;padding:6px 0}
.a-over.open{display:flex !important;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.5);align-items:flex-end}
.a-over.open > div{background:#fff;width:100%;border-radius:16px 16px 0 0;padding:20px;max-height:70vh;overflow-y:auto}
}
      `}</style>

      {/* Desktop Sidebar */}
      <div className="a-side" style={{ background: AS.green, color: "#fff", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,.1)", marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>שילובים בטבע</div>
          <div style={{ fontSize: 12, opacity: .6 }}>ממשק ניהול</div>
        </div>
        {menu.map(m => (
          <div key={m.id} onClick={() => go(m.id)} style={{ padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 14, background: page === m.id ? "rgba(255,255,255,.12)" : "transparent", borderLeft: page === m.id ? "3px solid " + AS.gold : "3px solid transparent", transition: "all .2s" }}>
            <span style={{ fontSize: 16 }}>{m.icon}</span> {m.label}
            {m.id === "admin-inquiries" && pendingCount > 0 && <span style={{ background: AS.gold, color: "#fff", fontSize: 11, padding: "1px 7px", borderRadius: 10, marginInlineStart: "auto" }}>{pendingCount}</span>}
          </div>
        ))}
        <div onClick={onLogout} style={{ padding: "10px 20px", cursor: "pointer", fontSize: 14, opacity: .6, marginTop: 20, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 16 }}>🚪 יציאה</div>
        {user?.email && <div style={{ padding: "8px 20px", fontSize: 11, opacity: .4 }}>{user.email}</div>}
      </div>

      {/* Mobile Top Bar */}
      <div className="a-top">
        <div style={{ fontSize: 16, fontWeight: 600, color: AS.green }}>{currentLabel}</div>
        <span onClick={() => setMobileMenu(true)} style={{ fontSize: 22, cursor: "pointer", color: AS.green }}>☰</span>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="a-bot">
        {mobileNav.map(m => (
          <div key={m.id} onClick={() => go(m.id)} style={{ flex: 1, textAlign: "center", padding: "8px 0", cursor: "pointer" }}>
            <div style={{ fontSize: 20 }}>{m.icon}</div>
            <div style={{ fontSize: 10, color: page === m.id ? AS.green : "#888", fontWeight: page === m.id ? 600 : 400 }}>{m.label}</div>
          </div>
        ))}
        <div onClick={() => setMobileMenu(true)} style={{ flex: 1, textAlign: "center", padding: "8px 0", cursor: "pointer" }}>
          <div style={{ fontSize: 20 }}>⋯</div>
          <div style={{ fontSize: 10, color: "#888" }}>עוד</div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`a-over ${mobileMenu ? "open" : ""}`} onClick={() => setMobileMenu(false)}>
        <div onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: AS.green }}>תפריט</div>
            <span onClick={() => setMobileMenu(false)} style={{ fontSize: 22, cursor: "pointer", color: "#888" }}>✕</span>
          </div>
          {menu.map(m => (
            <div key={m.id} onClick={() => { go(m.id); setMobileMenu(false); }} style={{ padding: "14px 0", display: "flex", alignItems: "center", gap: 12, fontSize: 15, borderBottom: "1px solid #f0f0f0", cursor: "pointer", color: page === m.id ? AS.green : "#333", fontWeight: page === m.id ? 600 : 400 }}>
              <span style={{ fontSize: 18 }}>{m.icon}</span> {m.label}
              {m.id === "admin-inquiries" && pendingCount > 0 && <span style={{ background: AS.gold, color: "#fff", fontSize: 11, padding: "1px 7px", borderRadius: 10, marginInlineStart: "auto" }}>{pendingCount}</span>}
            </div>
          ))}
          <div onClick={() => { onLogout(); setMobileMenu(false); }} style={{ padding: "14px 0", display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: AS.red, cursor: "pointer", marginTop: 8 }}>🚪 יציאה</div>
          {user?.email && <div style={{ fontSize: 12, color: "#888", marginTop: 12 }}>{user.email}</div>}
        </div>
      </div>

      {/* Content */}
      <div className="a-main">
        {page === "admin-dash" && <ADash inquiries={inquiries} units={units} tasks={tasks} calls={calls} go={go} />}
        {page === "admin-inquiries" && <AInquiries inquiries={inquiries} setInquiries={setInquiries} units={units} settings={settings} />}
        {page === "admin-calendar" && <ACalendar inquiries={inquiries} setInquiries={setInquiries} units={units} />}
        {page === "admin-units" && <AUnits units={units} setUnits={setUnits} />}
        {page === "admin-tasks" && <ATasks tasks={tasks} setTasks={setTasks} />}
        {page === "admin-calls" && <ACalls calls={calls} setCalls={setCalls} />}
        {page === "admin-reviews" && <AReviews reviews={reviews} setReviews={setReviews} units={units} />}
        {page === "admin-settings" && <ASettings settings={settings} setSettings={setSettings} />}
      </div>
    </div>
  );
}

// --- Admin Card ---
function ACard({ title, children, action }) {
  return (
    <div style={{ background: AS.card, borderRadius: 8, padding: 20, marginBottom: 16, border: "1px solid " + AS.border }}>
      {(title || action) && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        {title && <div style={{ fontSize: 16, fontWeight: 600, color: AS.green }}>{title}</div>}
        {action}
      </div>}
      {children}
    </div>
  );
}

// --- Admin Stat ---
function AStat({ label, value, color }) {
  return (
    <div style={{ background: AS.card, borderRadius: 8, padding: 16, border: "1px solid " + AS.border, textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || AS.green }}>{value}</div>
      <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// --- Status Badge ---
function SBadge({ status }) {
  const c = { pending: ["#fff3e0", AS.orange, "ממתין"], approved: ["#e8f5e9", "#2e7d32", "מאושר"], rejected: ["#fce4ec", AS.red, "נדחה"] };
  const [bg, color, text] = c[status] || c.pending;
  return <span style={{ background: bg, color, fontSize: 12, padding: "3px 12px", borderRadius: 12, fontWeight: 500 }}>{text}</span>;
}

// ============================================================
// DASHBOARD
// ============================================================
function ADash({ inquiries, units, tasks, calls, go }) {
  const pending = inquiries.filter(i => i.status === "pending");
  const approved = inquiries.filter(i => i.status === "approved");
  const thisMonth = inquiries.filter(i => { const d = new Date(i.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const openTasks = tasks.filter(t => t.status !== "done");
  const pendingCalls = calls.filter(c => !c.done);
  const revenue = approved.reduce((sum, i) => { const u = units.find(x => x.id === i.unitId); if (!u) return sum; const nights = Math.max(1, Math.round((new Date(i.checkout) - new Date(i.checkin)) / 86400000)); return sum + (u.prices?.regular || 0) * nights; }, 0);

  return <>
    <div style={{ fontSize: 22, fontWeight: 700, color: AS.green, marginBottom: 20 }}>דשבורד</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
      <AStat label="פניות ממתינות" value={pending.length} color={AS.orange} />
      <AStat label="הזמנות מאושרות" value={approved.length} color="#2e7d32" />
      <AStat label="פניות החודש" value={thisMonth.length} />
      <AStat label="הכנסות (מאושר)" value={"₪" + revenue.toLocaleString()} color={AS.green} />
      <AStat label="משימות פתוחות" value={openTasks.length} color={AS.blue} />
      <AStat label="שיחות לביצוע" value={pendingCalls.length} color={AS.gold} />
    </div>

    <ACard title="פניות אחרונות שממתינות" action={<button className="go" onClick={() => go("admin-inquiries")} style={{ padding: "6px 16px", fontSize: 12 }}>כל הפניות</button>}>
      {pending.length === 0 ? <div style={{ color: "#888", fontSize: 14 }}>אין פניות ממתינות</div> : pending.slice(0, 5).map(i => {
        const u = units.find(x => x.id === i.unitId);
        return <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{i.guestName}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{u?.name?.he || "גמיש"} • {i.checkin} → {i.checkout}</div>
          </div>
          <SBadge status={i.status} />
        </div>;
      })}
    </ACard>

    {openTasks.length > 0 && <ACard title="משימות פתוחות" action={<button className="go" onClick={() => go("admin-tasks")} style={{ padding: "6px 16px", fontSize: 12 }}>כל המשימות</button>}>
      {openTasks.slice(0, 3).map(t => <div key={t.id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 14 }}>{t.title} <span style={{ color: "#888", fontSize: 12 }}>• {t.dueDate}</span></div>)}
    </ACard>}
  </>;
}

// ============================================================
// INQUIRIES
// ============================================================
function AInquiries({ inquiries, setInquiries, units, settings }) {
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState(null);
  const filtered = filter === "all" ? inquiries : inquiries.filter(i => i.status === filter);
  const updateStatus = (id, status) => setInquiries(inquiries.map(i => i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i));
  const updateNotes = (id, adminNotes) => setInquiries(inquiries.map(i => i.id === id ? { ...i, adminNotes } : i));
  const waLink = (inq) => { const u = units.find(x => x.id === inq.unitId); return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`שלום ${inq.guestName}, לגבי הפנייה שלך ל${u?.name?.he || "שילובים בטבע"} בתאריכים ${inq.checkin} - ${inq.checkout}`)}`; };

  return <>
    <div style={{ fontSize: 22, fontWeight: 700, color: AS.green, marginBottom: 20 }}>ניהול פניות</div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {[["all", "הכל"], ["pending", "ממתין"], ["approved", "מאושר"], ["rejected", "נדחה"]].map(([v, l]) => (
        <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 16px", fontSize: 13, background: filter === v ? AS.green : "#fff", color: filter === v ? "#fff" : AS.green, border: "1px solid " + AS.green, borderRadius: 6, cursor: "pointer" }}>{l} ({v === "all" ? inquiries.length : inquiries.filter(i => i.status === v).length})</button>
      ))}
    </div>

    {sel ? (() => { const i = inquiries.find(x => x.id === sel); const u = units.find(x => x.id === i?.unitId); if (!i) return null; return (
      <ACard>
        <button onClick={() => setSel(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: AS.green, marginBottom: 12 }}>← חזרה לרשימה</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{i.guestName}</div>
            <div style={{ fontSize: 14, color: "#666", lineHeight: 2 }}>
              📞 {i.phone}<br/>
              ✉️ {i.email || "—"}<br/>
              🏠 {u?.name?.he || "גמיש"}<br/>
              📅 {i.checkin} → {i.checkout}<br/>
              👥 {i.guests?.adults} מבוגרים, {i.guests?.children} ילדים
            </div>
            {i.notes && <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 6, marginTop: 12, fontSize: 14 }}>💬 {i.notes}</div>}
          </div>
          <div>
            <div style={{ marginBottom: 12 }}>סטטוס: <SBadge status={i.status} /></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={() => updateStatus(i.id, "approved")} style={{ padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>✓ אשר</button>
              <button onClick={() => updateStatus(i.id, "rejected")} style={{ padding: "8px 20px", background: AS.red, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>✕ דחה</button>
              <button onClick={() => updateStatus(i.id, "pending")} style={{ padding: "8px 20px", background: AS.orange, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>⏳ ממתין</button>
            </div>
            <a href={waLink(i)} target="_blank" rel="noopener" style={{ display: "inline-block", padding: "8px 20px", background: "#25d366", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 13, marginBottom: 16 }}>💬 WhatsApp</a>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>הערות מנהל:</div>
              <textarea value={i.adminNotes || ""} onChange={e => updateNotes(i.id, e.target.value)} rows={3} placeholder="הוסף הערה פנימית..." />
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 16 }}>נוצר: {new Date(i.createdAt).toLocaleString("he-IL")}</div>
      </ACard>
    ); })() :
    <ACard>
      {filtered.length === 0 ? <div style={{ color: "#888", fontSize: 14, padding: 20, textAlign: "center" }}>אין פניות</div> :
      filtered.map(i => { const u = units.find(x => x.id === i.unitId); return (
        <div key={i.id} onClick={() => setSel(i.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", transition: "background .2s" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{i.guestName} <span style={{ color: "#888", fontWeight: 400 }}>• {i.phone}</span></div>
            <div style={{ fontSize: 12, color: "#888" }}>{u?.name?.he || "גמיש"} • {i.checkin} → {i.checkout} • {i.guests?.adults + (i.guests?.children || 0)} אורחים</div>
          </div>
          <SBadge status={i.status} />
        </div>
      ); })}
    </ACard>}
  </>;
}

// ============================================================
// CALENDAR
// ============================================================
function ACalendar({ inquiries, setInquiries, units }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [view, setView] = useState("month");
  const [weekStart, setWeekStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return new Date(d); });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ guestName: "", phone: "", unitId: "", checkin: "", checkout: "", guests: { adults: 2, children: 0 }, notes: "", email: "" });
  const year = month.getFullYear(); const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const active = inquiries.filter(i => i.status === "approved" || i.status === "pending");
  const monthName = month.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  const fmtDate = (d) => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`; };
  const isInRange = (date, checkin, checkout) => date >= checkin && date < checkout;
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const weekLabel = `${weekDays[0].toLocaleDateString("he-IL", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}`;

  const addBooking = () => {
    if (!addForm.guestName || !addForm.phone || !addForm.checkin || !addForm.checkout) return;
    const inq = { ...addForm, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), status: "approved", adminNotes: "נוסף מהיומן", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setInquiries([inq, ...inquiries]);
    setShowAdd(false);
    setAddForm({ guestName: "", phone: "", unitId: "", checkin: "", checkout: "", guests: { adults: 2, children: 0 }, notes: "", email: "" });
  };

  const activeUnits = units.filter(u => u.active);

  return <>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: AS.green }}>יומן תפוסה</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setView("month")} style={{ padding: "6px 16px", fontSize: 13, background: view === "month" ? AS.green : "#fff", color: view === "month" ? "#fff" : AS.green, border: "1px solid " + AS.green, borderRadius: 6, cursor: "pointer" }}>חודשי</button>
        <button onClick={() => setView("week")} style={{ padding: "6px 16px", fontSize: 13, background: view === "week" ? AS.green : "#fff", color: view === "week" ? "#fff" : AS.green, border: "1px solid " + AS.green, borderRadius: 6, cursor: "pointer" }}>שבועי</button>
        <button className="gb" onClick={() => setShowAdd(!showAdd)} style={{ padding: "6px 16px", fontSize: 13 }}>+ הזמנה חדשה</button>
      </div>
    </div>

    {showAdd && <ACard title="הוספת הזמנה">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <input value={addForm.guestName} onChange={e => setAddForm(p => ({ ...p, guestName: e.target.value }))} placeholder="שם האורח *" />
        <input value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} placeholder="טלפון *" dir="ltr" />
        <select value={addForm.unitId} onChange={e => setAddForm(p => ({ ...p, unitId: e.target.value }))}>
          <option value="">בחר יחידה</option>
          {activeUnits.map(u => <option key={u.id} value={u.id}>{u.name?.he}</option>)}
        </select>
        <input type="date" value={addForm.checkin} onChange={e => setAddForm(p => ({ ...p, checkin: e.target.value }))} />
        <input type="date" value={addForm.checkout} onChange={e => setAddForm(p => ({ ...p, checkout: e.target.value }))} />
        <input value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} placeholder="אימייל" dir="ltr" />
      </div>
      <input value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} placeholder="הערות" style={{ marginTop: 8 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="gb" onClick={addBooking} style={{ padding: "8px 24px", fontSize: 13 }}>הוסף הזמנה</button>
        <button className="go" onClick={() => setShowAdd(false)} style={{ padding: "8px 24px", fontSize: 13 }}>ביטול</button>
      </div>
    </ACard>}

    {/* ===== WEEKLY VIEW ===== */}
    {view === "week" && <ACard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} style={{ background: "none", border: "1px solid " + AS.border, padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}>→</button>
        <div style={{ fontSize: 16, fontWeight: 600, color: AS.green }}>{weekLabel}</div>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} style={{ background: "none", border: "1px solid " + AS.border, padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}>←</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px repeat(7, 1fr)", minWidth: 700 }}>
          {/* Header row */}
          <div style={{ padding: 8, fontWeight: 600, fontSize: 13, color: AS.green, borderBottom: "2px solid " + AS.border }}>יחידה</div>
          {weekDays.map((d, i) => {
            const isToday = fmtDate(d) === fmtDate(new Date());
            return <div key={i} style={{ padding: 8, textAlign: "center", fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? AS.green : "#666", borderBottom: "2px solid " + AS.border, background: isToday ? "#f0faf4" : "transparent" }}>
              {["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"][d.getDay()]}<br/>{d.getDate()}/{d.getMonth() + 1}
            </div>;
          })}
          {/* Unit rows */}
          {activeUnits.map(u => <>
            <div key={u.id} style={{ padding: "10px 8px", fontSize: 13, fontWeight: 500, borderBottom: "1px solid " + AS.border, display: "flex", alignItems: "center" }}>{u.name?.he}</div>
            {weekDays.map((d, i) => {
              const date = fmtDate(d);
              const bookings = active.filter(inq => inq.unitId === u.id && isInRange(date, inq.checkin, inq.checkout));
              const isToday = date === fmtDate(new Date());
              return <div key={i} style={{ padding: 4, borderBottom: "1px solid " + AS.border, borderRight: "1px solid #f0f0f0", minHeight: 48, background: isToday ? "#f0faf4" : "#fff" }}>
                {bookings.map(b => (
                  <div key={b.id} style={{ fontSize: 10, padding: "3px 6px", borderRadius: 4, marginBottom: 2, background: b.status === "approved" ? "#c8e6c9" : "#fff3e0", color: b.status === "approved" ? "#2e7d32" : AS.orange, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.guestName}
                  </div>
                ))}
              </div>;
            })}
          </>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12 }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "#c8e6c9", marginLeft: 4 }} />מאושר</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "#fff3e0", marginLeft: 4 }} />ממתין</span>
      </div>
    </ACard>}

    {/* ===== MONTHLY VIEW ===== */}
    {view === "month" && <ACard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => setMonth(new Date(year, m - 1, 1))} style={{ background: "none", border: "1px solid " + AS.border, padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}>→</button>
        <div style={{ fontSize: 18, fontWeight: 600, color: AS.green }}>{monthName}</div>
        <button onClick={() => setMonth(new Date(year, m + 1, 1))} style={{ background: "none", border: "1px solid " + AS.border, padding: "6px 14px", borderRadius: 6, cursor: "pointer" }}>←</button>
      </div>
      {/* Unit rows for month */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `100px repeat(${daysInMonth}, 1fr)`, minWidth: Math.max(700, daysInMonth * 28 + 100) }}>
          {/* Day headers */}
          <div style={{ padding: 4, fontWeight: 600, fontSize: 11, color: AS.green, borderBottom: "2px solid " + AS.border }}>יחידה</div>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const date = fmtDate(new Date(year, m, d));
            const isToday = date === fmtDate(new Date());
            const dayName = ["א", "ב", "ג", "ד", "ה", "ו", "ש"][new Date(year, m, d).getDay()];
            return <div key={i} style={{ padding: "2px 0", textAlign: "center", fontSize: 10, fontWeight: isToday ? 700 : 400, color: isToday ? AS.green : "#888", borderBottom: "2px solid " + AS.border, background: isToday ? "#f0faf4" : "transparent" }}>
              {dayName}<br/><span style={{ fontSize: 12 }}>{d}</span>
            </div>;
          })}
          {/* Unit rows */}
          {activeUnits.map(u => <>
            <div key={u.id} style={{ padding: "8px 4px", fontSize: 11, fontWeight: 500, borderBottom: "1px solid " + AS.border, display: "flex", alignItems: "center" }}>{u.name?.he}</div>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const date = fmtDate(new Date(year, m, d));
              const bookings = active.filter(inq => inq.unitId === u.id && isInRange(date, inq.checkin, inq.checkout));
              const isToday = date === fmtDate(new Date());
              const hasBooking = bookings.length > 0;
              const isApproved = bookings.some(b => b.status === "approved");
              return <div key={i} style={{ borderBottom: "1px solid " + AS.border, borderRight: "1px solid #f5f5f5", background: hasBooking ? (isApproved ? "#c8e6c9" : "#fff3e0") : (isToday ? "#f0faf4" : "#fff"), minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }} title={bookings.map(b => b.guestName).join(", ")}>
                {hasBooking && <div style={{ width: 6, height: 6, borderRadius: "50%", background: isApproved ? "#2e7d32" : AS.orange }} />}
              </div>;
            })}
          </>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12 }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "#c8e6c9", marginLeft: 4 }} />מאושר</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "#fff3e0", marginLeft: 4 }} />ממתין</span>
      </div>
    </ACard>}
  </>;
}

// ============================================================
// UNITS EDITOR
// ============================================================
function AUnits({ units, setUnits }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const startEdit = (u) => { setEditing(u.id); setForm({ ...u }); };
  const save = () => { setUnits(units.map(u => u.id === editing ? { ...form } : u)); setEditing(null); };
  const toggleActive = (id) => setUnits(units.map(u => u.id === id ? { ...u, active: !u.active } : u));
  const addUnit = () => {
    const newUnit = { id: "u" + Date.now(), name: { he: "יחידה חדשה", en: "New Unit" }, description: { he: "", en: "" }, type: "couple", capacity: 2, amenities: [], prices: { regular: 0, weekend: 0, holiday: 0 }, active: false, order: units.length + 1 };
    setUnits([...units, newUnit]);
    startEdit(newUnit);
  };

  return <>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: AS.green }}>ניהול יחידות</div>
      <button className="gb" onClick={addUnit} style={{ padding: "8px 20px", fontSize: 13 }}>+ יחידה חדשה</button>
    </div>

    {editing ? (
      <ACard title={"עריכת: " + form.name?.he}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ fontSize: 13 }}>שם (עברית)<input value={form.name?.he || ""} onChange={e => up("name", { ...form.name, he: e.target.value })} /></label>
          <label style={{ fontSize: 13 }}>שם (אנגלית)<input value={form.name?.en || ""} onChange={e => up("name", { ...form.name, en: e.target.value })} /></label>
          <label style={{ fontSize: 13, gridColumn: "1/3" }}>תיאור (עברית)<textarea rows={2} value={form.description?.he || ""} onChange={e => up("description", { ...form.description, he: e.target.value })} /></label>
          <label style={{ fontSize: 13, gridColumn: "1/3" }}>תיאור (אנגלית)<textarea rows={2} value={form.description?.en || ""} onChange={e => up("description", { ...form.description, en: e.target.value })} /></label>
          <label style={{ fontSize: 13 }}>סוג<select value={form.type || "couple"} onChange={e => up("type", e.target.value)}><option value="couple">זוגי</option><option value="family">משפחתי</option><option value="group">קבוצתי</option><option value="villa">וילה</option></select></label>
          <label style={{ fontSize: 13 }}>קיבולת<input type="number" value={form.capacity || 2} onChange={e => up("capacity", +e.target.value)} /></label>
          <label style={{ fontSize: 13 }}>מחיר רגיל<input type="number" value={form.prices?.regular || 0} onChange={e => up("prices", { ...form.prices, regular: +e.target.value })} /></label>
          <label style={{ fontSize: 13 }}>מחיר סופ"ש<input type="number" value={form.prices?.weekend || 0} onChange={e => up("prices", { ...form.prices, weekend: +e.target.value })} /></label>
          <label style={{ fontSize: 13 }}>מחיר חג/עונה<input type="number" value={form.prices?.holiday || 0} onChange={e => up("prices", { ...form.prices, holiday: +e.target.value })} /></label>
          <label style={{ fontSize: 13 }}>מתקנים (מופרדים בפסיק)<input value={(form.amenities || []).join(", ")} onChange={e => up("amenities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} /></label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="gb" onClick={save} style={{ padding: "8px 24px", fontSize: 13 }}>שמור</button>
          <button className="go" onClick={() => setEditing(null)} style={{ padding: "8px 24px", fontSize: 13 }}>ביטול</button>
        </div>
      </ACard>
    ) : (
      <ACard>
        {units.map(u => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{u.name?.he}</span>
              <span style={{ fontSize: 12, color: "#888", marginInlineStart: 8 }}>• {u.type} • {u.capacity} אורחים • ₪{u.prices?.regular?.toLocaleString()}</span>
              {!u.active && <span style={{ fontSize: 11, background: "#fce4ec", color: AS.red, padding: "2px 8px", borderRadius: 10, marginInlineStart: 8 }}>מוסתר</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => startEdit(u)} style={{ background: "none", border: "1px solid " + AS.border, padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>✏️ עריכה</button>
              <button onClick={() => toggleActive(u.id)} style={{ background: "none", border: "1px solid " + AS.border, padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>{u.active ? "🙈 הסתר" : "👁 הצג"}</button>
            </div>
          </div>
        ))}
      </ACard>
    )}
  </>;
}

// ============================================================
// TASKS
// ============================================================
function ATasks({ tasks, setTasks }) {
  const [form, setForm] = useState({ title: "", dueDate: "", priority: "medium" });
  const addTask = () => { if (!form.title) return; setTasks([{ ...form, id: "t" + Date.now(), status: "open", createdAt: new Date().toISOString() }, ...tasks]); setForm({ title: "", dueDate: "", priority: "medium" }); };
  const toggle = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === "done" ? "open" : "done" } : t));
  const del = (id) => setTasks(tasks.filter(t => t.id !== id));
  const priColor = { high: AS.red, medium: AS.orange, low: "#888" };

  return <>
    <div style={{ fontSize: 22, fontWeight: 700, color: AS.green, marginBottom: 20 }}>משימות</div>
    <ACard title="הוסף משימה">
      <div style={{ display: "flex", gap: 8 }}>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="תיאור המשימה..." style={{ flex: 1 }} />
        <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} style={{ width: 150 }} />
        <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ width: 100 }}>
          <option value="low">נמוכה</option><option value="medium">בינונית</option><option value="high">גבוהה</option>
        </select>
        <button className="gb" onClick={addTask} style={{ padding: "8px 20px", fontSize: 13 }}>הוסף</button>
      </div>
    </ACard>
    <ACard title={`משימות (${tasks.filter(t => t.status !== "done").length} פתוחות)`}>
      {tasks.length === 0 ? <div style={{ color: "#888", fontSize: 14, textAlign: "center", padding: 20 }}>אין משימות</div> :
      tasks.map(t => (
        <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0", opacity: t.status === "done" ? .5 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span onClick={() => toggle(t.id)} style={{ cursor: "pointer", fontSize: 18 }}>{t.status === "done" ? "☑️" : "⬜"}</span>
            <span style={{ fontSize: 14, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
            <span style={{ fontSize: 11, color: priColor[t.priority] || "#888", border: "1px solid", padding: "1px 6px", borderRadius: 8 }}>{t.priority === "high" ? "גבוהה" : t.priority === "medium" ? "בינונית" : "נמוכה"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#888" }}>{t.dueDate}</span>
            <button onClick={() => del(t.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: AS.red }}>🗑</button>
          </div>
        </div>
      ))}
    </ACard>
  </>;
}

// ============================================================
// CALLS
// ============================================================
function ACalls({ calls, setCalls }) {
  const [form, setForm] = useState({ contactName: "", phone: "", subject: "", reminder: "" });
  const addCall = () => { if (!form.contactName) return; setCalls([{ ...form, id: "c" + Date.now(), done: false, createdAt: new Date().toISOString() }, ...calls]); setForm({ contactName: "", phone: "", subject: "", reminder: "" }); };
  const toggle = (id) => setCalls(calls.map(c => c.id === id ? { ...c, done: !c.done } : c));
  const del = (id) => setCalls(calls.filter(c => c.id !== id));

  return <>
    <div style={{ fontSize: 22, fontWeight: 700, color: AS.green, marginBottom: 20 }}>שיחות לביצוע</div>
    <ACard title="הוסף שיחה">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
        <input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} placeholder="שם" />
        <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="טלפון" dir="ltr" />
        <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="נושא" />
        <button className="gb" onClick={addCall} style={{ padding: "8px 20px", fontSize: 13 }}>הוסף</button>
      </div>
    </ACard>
    <ACard title={`שיחות (${calls.filter(c => !c.done).length} לביצוע)`}>
      {calls.length === 0 ? <div style={{ color: "#888", fontSize: 14, textAlign: "center", padding: 20 }}>אין שיחות</div> :
      calls.map(c => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0", opacity: c.done ? .5 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span onClick={() => toggle(c.id)} style={{ cursor: "pointer", fontSize: 18 }}>{c.done ? "☑️" : "⬜"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.contactName} <span style={{ color: "#888", fontWeight: 400 }}>{c.phone}</span></div>
              <div style={{ fontSize: 12, color: "#888" }}>{c.subject}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`tel:${c.phone}`} style={{ fontSize: 12, color: AS.green }}>📞</a>
            <a href={`https://wa.me/${c.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener" style={{ fontSize: 12, color: "#25d366" }}>💬</a>
            <button onClick={() => del(c.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: AS.red }}>🗑</button>
          </div>
        </div>
      ))}
    </ACard>
  </>;
}

// ============================================================
// REVIEWS ADMIN
// ============================================================
function AReviews({ reviews, setReviews, units }) {
  const [form, setForm] = useState({ guestName: "", unitId: "", rating: 5, text: { he: "", en: "" }, date: new Date().toISOString().slice(0, 10), visible: true });
  const addReview = () => { if (!form.guestName || !form.text.he) return; setReviews([{ ...form, id: "r" + Date.now() }, ...reviews]); setForm({ guestName: "", unitId: "", rating: 5, text: { he: "", en: "" }, date: new Date().toISOString().slice(0, 10), visible: true }); };
  const toggleVisible = (id) => setReviews(reviews.map(r => r.id === id ? { ...r, visible: !r.visible } : r));
  const del = (id) => setReviews(reviews.filter(r => r.id !== id));

  return <>
    <div style={{ fontSize: 22, fontWeight: 700, color: AS.green, marginBottom: 20 }}>חוות דעת</div>
    <ACard title="הוסף חוות דעת">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <input value={form.guestName} onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))} placeholder="שם האורח" />
        <select value={form.unitId} onChange={e => setForm(p => ({ ...p, unitId: e.target.value }))}>
          <option value="">ללא יחידה</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name?.he}</option>)}
        </select>
        <select value={form.rating} onChange={e => setForm(p => ({ ...p, rating: +e.target.value }))}>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} כוכבים</option>)}
        </select>
      </div>
      <textarea rows={2} value={form.text.he} onChange={e => setForm(p => ({ ...p, text: { ...p.text, he: e.target.value } }))} placeholder="טקסט בעברית..." style={{ marginTop: 8 }} />
      <textarea rows={2} value={form.text.en} onChange={e => setForm(p => ({ ...p, text: { ...p.text, en: e.target.value } }))} placeholder="Text in English..." style={{ marginTop: 8 }} />
      <button className="gb" onClick={addReview} style={{ padding: "8px 20px", fontSize: 13, marginTop: 8 }}>הוסף</button>
    </ACard>
    <ACard title={`חוות דעת (${reviews.length})`}>
      {reviews.map(r => { const u = units.find(x => x.id === r.unitId); return (
        <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0", opacity: r.visible ? 1 : .4 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{r.guestName} <span style={{ color: AS.gold }}>{"★".repeat(r.rating)}</span> <span style={{ color: "#888", fontSize: 12 }}>{u?.name?.he}</span></div>
            <div style={{ fontSize: 13, color: "#666" }}>{r.text?.he?.slice(0, 60)}...</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => toggleVisible(r.id)} style={{ background: "none", border: "1px solid " + AS.border, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>{r.visible ? "🙈" : "👁"}</button>
            <button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: AS.red }}>🗑</button>
          </div>
        </div>
      ); })}
    </ACard>
  </>;
}

// ============================================================
// SETTINGS
// ============================================================
function ASettings({ settings, setSettings }) {
  const [form, setForm] = useState({ ...settings });
  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => setSettings({ ...form });

  return <>
    <div style={{ fontSize: 22, fontWeight: 700, color: AS.green, marginBottom: 20 }}>הגדרות</div>
    <ACard title="פרטי קשר">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ fontSize: 13 }}>טלפון<input value={form.phone || ""} onChange={e => up("phone", e.target.value)} /></label>
        <label style={{ fontSize: 13 }}>WhatsApp<input value={form.whatsapp || ""} onChange={e => up("whatsapp", e.target.value)} dir="ltr" /></label>
        <label style={{ fontSize: 13 }}>אימייל<input value={form.email || ""} onChange={e => up("email", e.target.value)} dir="ltr" /></label>
        <label style={{ fontSize: 13 }}>כתובת (עברית)<input value={form.address?.he || ""} onChange={e => up("address", { ...form.address, he: e.target.value })} /></label>
        <label style={{ fontSize: 13 }}>כתובת (אנגלית)<input value={form.address?.en || ""} onChange={e => up("address", { ...form.address, en: e.target.value })} /></label>
      </div>
    </ACard>
    <ACard title="רשתות חברתיות">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ fontSize: 13 }}>Instagram URL<input value={form.social?.instagram || ""} onChange={e => up("social", { ...form.social, instagram: e.target.value })} dir="ltr" /></label>
        <label style={{ fontSize: 13 }}>Facebook URL<input value={form.social?.facebook || ""} onChange={e => up("social", { ...form.social, facebook: e.target.value })} dir="ltr" /></label>
      </div>
    </ACard>
    <ACard title="שם האתר">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ fontSize: 13 }}>שם (עברית)<input value={form.siteName?.he || ""} onChange={e => up("siteName", { ...form.siteName, he: e.target.value })} /></label>
        <label style={{ fontSize: 13 }}>שם (אנגלית)<input value={form.siteName?.en || ""} onChange={e => up("siteName", { ...form.siteName, en: e.target.value })} /></label>
      </div>
    </ACard>
    <ACard title="אבטחה">
      <label style={{ fontSize: 13 }}>סיסמת מנהל<input type="password" value={form.adminPassword || ""} onChange={e => up("adminPassword", e.target.value)} /></label>
    </ACard>
    <button className="gb" onClick={save} style={{ padding: "12px 40px", fontSize: 15, marginTop: 8 }}>שמור הגדרות</button>
  </>;
}
