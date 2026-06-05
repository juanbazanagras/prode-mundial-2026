import { useState, useEffect } from "react";

// ============================================================
// DATA - Mundial 2026 Fixture completo
// ============================================================

const GROUPS = {
  A: ["México", "Ecuador", "Jamaica", "Países Bajos"],
  B: ["Portugal", "España", "Marruecos", "Bélgica"],
  C: ["Argentina", "Chile", "Perú", "Alemania"],
  D: ["Brasil", "Colombia", "Venezuela", "Japón"],
  E: ["Uruguay", "Bolivia", "Panamá", "Francia"],
  F: ["Estados Unidos", "Canadá", "Honduras", "Italia"],
  G: ["Inglaterra", "Polonia", "Turquía", "Senegal"],
  H: ["Australia", "Nigeria", "Ghana", "Corea del Sur"],
  I: ["Arabia Saudita", "Qatar", "Croacia", "Dinamarca"],
  J: ["Argelia", "Sudáfrica", "Nueva Zelanda", "Serbia"],
  K: ["Costa Rica", "El Salvador", "Camerún", "Suiza"],
  L: ["Irán", "Iraq", "Paraguay", "Austria"],
};

const FLAGS = {
  "México": "🇲🇽", "Ecuador": "🇪🇨", "Jamaica": "🇯🇲", "Países Bajos": "🇳🇱",
  "Portugal": "🇵🇹", "España": "🇪🇸", "Marruecos": "🇲🇦", "Bélgica": "🇧🇪",
  "Argentina": "🇦🇷", "Chile": "🇨🇱", "Perú": "🇵🇪", "Alemania": "🇩🇪",
  "Brasil": "🇧🇷", "Colombia": "🇨🇴", "Venezuela": "🇻🇪", "Japón": "🇯🇵",
  "Uruguay": "🇺🇾", "Bolivia": "🇧🇴", "Panamá": "🇵🇦", "Francia": "🇫🇷",
  "Estados Unidos": "🇺🇸", "Canadá": "🇨🇦", "Honduras": "🇭🇳", "Italia": "🇮🇹",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Polonia": "🇵🇱", "Turquía": "🇹🇷", "Senegal": "🇸🇳",
  "Australia": "🇦🇺", "Nigeria": "🇳🇬", "Ghana": "🇬🇭", "Corea del Sur": "🇰🇷",
  "Arabia Saudita": "🇸🇦", "Qatar": "🇶🇦", "Croacia": "🇭🇷", "Dinamarca": "🇩🇰",
  "Argelia": "🇩🇿", "Sudáfrica": "🇿🇦", "Nueva Zelanda": "🇳🇿", "Serbia": "🇷🇸",
  "Costa Rica": "🇨🇷", "El Salvador": "🇸🇻", "Camerún": "🇨🇲", "Suiza": "🇨🇭",
  "Irán": "🇮🇷", "Iraq": "🇮🇶", "Paraguay": "🇵🇾", "Austria": "🇦🇹",
  "TBD": "🏳️",
};

// Generar fixture de grupos
const generateGroupFixtures = () => {
  const fixtures = [];
  let id = 1;
  const groupDates = {
    A: "2026-06-11", B: "2026-06-11", C: "2026-06-12", D: "2026-06-12",
    E: "2026-06-13", F: "2026-06-13", G: "2026-06-14", H: "2026-06-14",
    I: "2026-06-15", J: "2026-06-15", K: "2026-06-16", L: "2026-06-16",
  };

  Object.entries(GROUPS).forEach(([group, teams]) => {
    const pairs = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairs.push([teams[i], teams[j]]);
      }
    }
    const rounds = [
      [pairs[0], pairs[5]],
      [pairs[1], pairs[4]],
      [pairs[2], pairs[3]],
    ];
    rounds.forEach((round, ri) => {
      round.forEach(([home, away]) => {
        const baseDate = new Date(groupDates[group]);
        baseDate.setDate(baseDate.getDate() + ri * 4);
        fixtures.push({
          id: id++,
          phase: "Grupos",
          group,
          home,
          away,
          date: baseDate.toISOString().split("T")[0],
          time: "18:00",
          homeScore: null,
          awayScore: null,
          status: "pending",
        });
      });
    });
  });
  return fixtures;
};

const generateKnockoutFixtures = () => {
  const ko = [];
  let id = 200;
  const phases = [
    { phase: "Octavos", count: 16, startDate: "2026-07-02" },
    { phase: "Cuartos", count: 8, startDate: "2026-07-11" },
    { phase: "Semifinal", count: 4, startDate: "2026-07-14" },
    { phase: "Tercer puesto", count: 2, startDate: "2026-07-18" },
    { phase: "Final", count: 2, startDate: "2026-07-19" },
  ];
  phases.forEach(({ phase, count, startDate }) => {
    const matches = count / 2;
    for (let i = 0; i < matches; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      ko.push({
        id: id++,
        phase,
        group: null,
        home: "TBD",
        away: "TBD",
        date: d.toISOString().split("T")[0],
        time: "18:00",
        homeScore: null,
        awayScore: null,
        status: "pending",
      });
    }
  });
  return ko;
};

const INITIAL_FIXTURES = [...generateGroupFixtures(), ...generateKnockoutFixtures()];

const ADMIN_USER = { username: "admin", password: "losvagos2026", role: "admin" };

// ============================================================
// STORAGE HELPERS
// ============================================================
const load = async (key, shared = false) => {
  try {
    const r = await window.storage.get(key, shared);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
};
const save = async (key, value, shared = false) => {
  try { await window.storage.set(key, JSON.stringify(value), shared); } catch {}
};

// ============================================================
// SCORING
// ============================================================
const calcScore = (pred, homeScore, awayScore) => {
  if (pred.homeScore === null || pred.awayScore === null) return 0;
  if (pred.homeScore === homeScore && pred.awayScore === awayScore) return 3;
  const realResult = homeScore > awayScore ? "H" : homeScore < awayScore ? "A" : "D";
  const predResult = pred.homeScore > pred.awayScore ? "H" : pred.homeScore < pred.awayScore ? "A" : "D";
  return realResult === predResult ? 1 : 0;
};

// ============================================================
// MAIN APP
// ============================================================
export default function ProdeApp() {
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [fixtures, setFixtures] = useState(INITIAL_FIXTURES);
  const [predictions, setPredictions] = useState({});
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("fixtures");
  const [selectedPhase, setSelectedPhase] = useState("Grupos");
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [bgImage, setBgImage] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await load("users", true);
      const f = await load("fixtures", true);
      const p = await load("predictions", true);
      const pu = await load("pendingUsers", true);
      const bg = await load("bgImage", true);
      if (u) setUsers(u);
      if (f) setFixtures(f);
      if (p) setPredictions(p);
      if (pu) setPendingUsers(pu);
      if (bg) setBgImage(bg);
      setLoaded(true);
    })();
  }, []);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const persistUsers = async (u) => { setUsers(u); await save("users", u, true); };
  const persistPending = async (u) => { setPendingUsers(u); await save("pendingUsers", u, true); };
  const persistFixtures = async (f) => { setFixtures(f); await save("fixtures", f, true); };
  const persistPredictions = async (p) => { setPredictions(p); await save("predictions", p, true); };

  // ---- AUTH ----
  const handleRegister = async (username, password, displayName) => {
    if (!username || !password || !displayName) return notify("Completá todos los campos", "error");
    if (users.find(u => u.username === username) || pendingUsers.find(u => u.username === username))
      return notify("Ese usuario ya existe", "error");
    const newUser = { username, password, displayName, role: "user", approved: false };
    await persistPending([...pendingUsers, newUser]);
    notify("Registro enviado. Esperá que el admin te apruebe.");
    setScreen("login");
  };

  const handleLogin = (username, password) => {
    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
      setCurrentUser({ ...ADMIN_USER, displayName: "Admin" });
      setScreen("app");
      setActiveTab("admin");
      return;
    }
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return notify("Usuario o contraseña incorrectos", "error");
    if (!user.approved) return notify("Tu cuenta todavía no fue aprobada", "error");
    setCurrentUser(user);
    setScreen("app");
    setActiveTab("fixtures");
  };

  const handleApprove = async (username) => {
    const user = pendingUsers.find(u => u.username === username);
    if (!user) return;
    const approved = { ...user, approved: true };
    await persistUsers([...users, approved]);
    await persistPending(pendingUsers.filter(u => u.username !== username));
    notify(`${user.displayName} aprobado ✓`);
  };

  const handleReject = async (username) => {
    await persistPending(pendingUsers.filter(u => u.username !== username));
    notify("Usuario rechazado");
  };

  // ---- PREDICTIONS ----
  const isLocked = (fixture) => {
    const matchTime = new Date(`${fixture.date}T${fixture.time}:00`);
    const lockTime = new Date(matchTime.getTime() - 60 * 60 * 1000);
    return new Date() >= lockTime || fixture.status === "finished";
  };

  const savePrediction = async (fixtureId, homeScore, awayScore) => {
    const key = `${currentUser.username}_${fixtureId}`;
    const updated = { ...predictions, [key]: { homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) } };
    await persistPredictions(updated);
    notify("Predicción guardada ✓");
  };

  // ---- RESULTS (ADMIN) ----
  const saveResult = async (fixtureId, homeScore, awayScore) => {
    const updated = fixtures.map(f =>
      f.id === fixtureId
        ? { ...f, homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), status: "finished" }
        : f
    );
    await persistFixtures(updated);
    notify("Resultado guardado ✓");
  };

  // ---- SCOREBOARD ----
  const getLeaderboard = () => {
    const finishedFixtures = fixtures.filter(f => f.status === "finished");
    return users
      .filter(u => u.approved)
      .map(user => {
        let pts = 0, exact = 0, correct = 0;
        finishedFixtures.forEach(f => {
          const pred = predictions[`${user.username}_${f.id}`];
          if (!pred) return;
          const s = calcScore(pred, f.homeScore, f.awayScore);
          pts += s;
          if (s === 3) exact++;
          if (s === 1) correct++;
        });
        return { ...user, pts, exact, correct, played: finishedFixtures.length };
      })
      .sort((a, b) => b.pts - a.pts || b.exact - a.exact);
  };

  // ---- PHASES ----
  const phases = ["Grupos", "Octavos", "Cuartos", "Semifinal", "Tercer puesto", "Final"];
  const groupKeys = Object.keys(GROUPS);

  const getFilteredFixtures = () => {
    if (selectedPhase === "Grupos") {
      return fixtures.filter(f => f.phase === "Grupos" && f.group === selectedGroup);
    }
    return fixtures.filter(f => f.phase === selectedPhase);
  };

  if (!loaded) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#c8a84b", fontFamily: "'Bebas Neue', cursive", fontSize: 32, letterSpacing: 4 }}>CARGANDO...</div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: bgImage
        ? `linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.82)) center/cover, url(${bgImage}) center/cover fixed`
        : "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)",
      fontFamily: "'Barlow Condensed', sans-serif",
      color: "#e8e8e8",
      paddingBottom: 80,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #c8a84b; border-radius: 2px; }
        input { outline: none; } button { cursor: pointer; border: none; }
        .tab-btn { background: none; color: #888; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 16px; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #c8a84b; border-bottom-color: #c8a84b; }
        .tab-btn:hover { color: #c8a84b; }
        .gold-btn { background: linear-gradient(135deg, #c8a84b, #e8c96a); color: #0a0a0a; font-family: 'Bebas Neue', cursive; letter-spacing: 2px; font-size: 16px; padding: 10px 28px; border-radius: 4px; transition: all 0.2s; }
        .gold-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(200,168,75,0.4); }
        .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
        .match-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 16px; margin-bottom: 10px; transition: border-color 0.2s; }
        .match-card:hover { border-color: rgba(200,168,75,0.3); }
        .score-input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-family: 'Bebas Neue', cursive; font-size: 22px; text-align: center; width: 44px; height: 44px; border-radius: 4px; transition: border-color 0.2s; }
        .score-input:focus { border-color: #c8a84b; background: rgba(200,168,75,0.1); }
        .phase-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #aaa; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; letter-spacing: 1px; font-size: 12px; padding: 6px 14px; border-radius: 20px; transition: all 0.2s; text-transform: uppercase; }
        .phase-btn.active { background: rgba(200,168,75,0.15); border-color: #c8a84b; color: #c8a84b; }
        .phase-btn:hover { border-color: #c8a84b; color: #c8a84b; }
        .group-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #888; font-family: 'Bebas Neue', cursive; font-size: 14px; letter-spacing: 1px; width: 36px; height: 36px; border-radius: 4px; transition: all 0.2s; }
        .group-btn.active { background: rgba(200,168,75,0.15); border-color: #c8a84b; color: #c8a84b; }
        .group-btn:hover { border-color: #c8a84b; color: #c8a84b; }
        .input-field { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; padding: 10px 14px; border-radius: 6px; width: 100%; transition: border-color 0.2s; }
        .input-field:focus { border-color: #c8a84b; background: rgba(200,168,75,0.05); }
        .input-field::placeholder { color: #555; }
        .notif { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 6px; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 15px; letter-spacing: 0.5px; z-index: 9999; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .pts-badge { display: inline-block; font-family: 'Bebas Neue', cursive; font-size: 11px; letter-spacing: 1px; padding: 2px 7px; border-radius: 3px; }
        .pts-3 { background: rgba(200,168,75,0.2); color: #c8a84b; border: 1px solid rgba(200,168,75,0.4); }
        .pts-1 { background: rgba(100,200,100,0.15); color: #7dd87d; border: 1px solid rgba(100,200,100,0.3); }
        .pts-0 { background: rgba(200,80,80,0.15); color: #e07070; border: 1px solid rgba(200,80,80,0.3); }
      `}</style>

      {/* NOTIFICATION */}
      {notification && (
        <div className="notif" style={{
          background: notification.type === "error" ? "rgba(200,60,60,0.95)" : "rgba(30,30,30,0.95)",
          border: `1px solid ${notification.type === "error" ? "#e07070" : "#c8a84b"}`,
          color: notification.type === "error" ? "#fff" : "#c8a84b",
        }}>{notification.msg}</div>
      )}

      {/* HEADER */}
      <div style={{ borderBottom: "1px solid rgba(200,168,75,0.2)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 3, color: "#c8a84b", lineHeight: 1 }}>LOS VAGOS</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 3, color: "#555", textTransform: "uppercase" }}>Mundial 2026</div>
        </div>
        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#888" }}>{currentUser.displayName || currentUser.username}</span>
            <button className="phase-btn" onClick={() => { setCurrentUser(null); setScreen("login"); }}>Salir</button>
          </div>
        )}
      </div>

      {/* ====== LOGIN ====== */}
      {screen === "login" && <LoginScreen onLogin={handleLogin} onGoRegister={() => setScreen("register")} />}
      {screen === "register" && <RegisterScreen onRegister={handleRegister} onBack={() => setScreen("login")} />}

      {/* ====== APP ====== */}
      {screen === "app" && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
          {/* TABS */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 20, marginTop: 8, gap: 4 }}>
            {currentUser?.role === "admin"
              ? ["admin", "fixtures", "leaderboard"].map(t => (
                <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                  {t === "admin" ? "⚙ Admin" : t === "fixtures" ? "📋 Partidos" : "🏆 Tabla"}
                </button>
              ))
              : ["fixtures", "leaderboard", "mypreds"].map(t => (
                <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                  {t === "fixtures" ? "📋 Partidos" : t === "leaderboard" ? "🏆 Tabla" : "⭐ Mis picks"}
                </button>
              ))
            }
          </div>

          {/* FIXTURES TAB */}
          {activeTab === "fixtures" && (
            <FixturesTab
              fixtures={fixtures}
              phases={phases}
              groupKeys={groupKeys}
              selectedPhase={selectedPhase}
              setSelectedPhase={setSelectedPhase}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              getFilteredFixtures={getFilteredFixtures}
              currentUser={currentUser}
              predictions={predictions}
              savePrediction={savePrediction}
              isLocked={isLocked}
              calcScore={calcScore}
            />
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === "leaderboard" && <LeaderboardTab leaderboard={getLeaderboard()} currentUser={currentUser} />}

          {/* MY PREDICTIONS TAB */}
          {activeTab === "mypreds" && (
            <MyPredsTab
              fixtures={fixtures}
              predictions={predictions}
              currentUser={currentUser}
              calcScore={calcScore}
              phases={phases}
            />
          )}

          {/* ADMIN TAB */}
          {activeTab === "admin" && currentUser?.role === "admin" && (
            <AdminTab
              pendingUsers={pendingUsers}
              onApprove={handleApprove}
              onReject={handleReject}
              fixtures={fixtures}
              phases={phases}
              groupKeys={groupKeys}
              selectedPhase={selectedPhase}
              setSelectedPhase={setSelectedPhase}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              getFilteredFixtures={getFilteredFixtures}
              saveResult={saveResult}
              bgImage={bgImage}
              onSaveBg={async (url) => { setBgImage(url); await save("bgImage", url, true); notify("Fondo actualizado ✓"); }}
              users={users}
              predictions={predictions}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LOGIN
// ============================================================
function LoginScreen({ onLogin, onGoRegister }) {
  const [u, setU] = useState(""); const [p, setP] = useState("");
  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, letterSpacing: 4, color: "#c8a84b", lineHeight: 1 }}>⚽</div>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, letterSpacing: 4, color: "#fff", marginTop: 8 }}>INGRESÁ</div>
      </div>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Usuario</div>
          <input className="input-field" value={u} onChange={e => setU(e.target.value)} placeholder="tu_usuario" onKeyDown={e => e.key === "Enter" && onLogin(u, p)} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Contraseña</div>
          <input className="input-field" type="password" value={p} onChange={e => setP(e.target.value)} placeholder="••••••" onKeyDown={e => e.key === "Enter" && onLogin(u, p)} />
        </div>
        <button className="gold-btn" style={{ width: "100%" }} onClick={() => onLogin(u, p)}>Entrar</button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#555" }}>
          ¿No tenés cuenta?{" "}
          <span style={{ color: "#c8a84b", cursor: "pointer" }} onClick={onGoRegister}>Registrate</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REGISTER
// ============================================================
function RegisterScreen({ onRegister, onBack }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [d, setD] = useState("");
  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, letterSpacing: 4, color: "#fff" }}>REGISTRATE</div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>El admin tiene que aprobar tu cuenta</div>
      </div>
      <div className="card" style={{ padding: 28 }}>
        {[["Nombre / Apodo", d, setD, "text", "El Pibe"], ["Usuario", u, setU, "text", "elpibe"], ["Contraseña", p, setP, "password", "••••••"]].map(([label, val, setter, type, ph]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <input className="input-field" type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph} />
          </div>
        ))}
        <button className="gold-btn" style={{ width: "100%", marginTop: 8 }} onClick={() => onRegister(u, p, d)}>Enviar solicitud</button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#555" }}>
          <span style={{ color: "#c8a84b", cursor: "pointer" }} onClick={onBack}>← Volver</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FIXTURES TAB
// ============================================================
function FixturesTab({ fixtures, phases, groupKeys, selectedPhase, setSelectedPhase, selectedGroup, setSelectedGroup, getFilteredFixtures, currentUser, predictions, savePrediction, isLocked, calcScore }) {
  const filtered = getFilteredFixtures();
  return (
    <div>
      {/* Phase selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {phases.map(p => (
          <button key={p} className={`phase-btn ${selectedPhase === p ? "active" : ""}`} onClick={() => setSelectedPhase(p)}>{p}</button>
        ))}
      </div>
      {/* Group selector */}
      {selectedPhase === "Grupos" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {groupKeys.map(g => (
            <button key={g} className={`group-btn ${selectedGroup === g ? "active" : ""}`} onClick={() => setSelectedGroup(g)}>{g}</button>
          ))}
        </div>
      )}
      {filtered.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>No hay partidos en esta fase todavía</div>}
      {filtered.map(f => (
        <MatchCard key={f.id} fixture={f} currentUser={currentUser} predictions={predictions} savePrediction={savePrediction} isLocked={isLocked} calcScore={calcScore} />
      ))}
    </div>
  );
}

// ============================================================
// MATCH CARD
// ============================================================
function MatchCard({ fixture: f, currentUser, predictions, savePrediction, isLocked, calcScore }) {
  const predKey = `${currentUser?.username}_${f.id}`;
  const pred = predictions[predKey];
  const locked = isLocked(f);
  const [h, setH] = useState(pred?.homeScore ?? "");
  const [a, setA] = useState(pred?.awayScore ?? "");
  const score = f.status === "finished" && pred ? calcScore(pred, f.homeScore, f.awayScore) : null;

  return (
    <div className="match-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 1 }}>
          {f.group ? `GRUPO ${f.group} · ` : ""}{f.date} {f.time}hs
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {f.status === "finished" && <span style={{ fontSize: 11, color: "#7dd87d", letterSpacing: 1 }}>✓ FINAL</span>}
          {locked && f.status !== "finished" && <span style={{ fontSize: 11, color: "#e07070", letterSpacing: 1 }}>🔒 CERRADO</span>}
          {score !== null && (
            <span className={`pts-badge ${score === 3 ? "pts-3" : score === 1 ? "pts-1" : "pts-0"}`}>
              {score === 3 ? "⭐ +3" : score === 1 ? "+1" : "0 pts"}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Home */}
        <div style={{ flex: 1, textAlign: "right" }}>
          <span style={{ fontSize: 11 }}>{FLAGS[f.home] || "🏳️"}</span>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 1, marginLeft: 6 }}>{f.home}</span>
        </div>

        {/* Score / Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {f.status === "finished" ? (
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: "#c8a84b", letterSpacing: 2, minWidth: 70, textAlign: "center" }}>
              {f.homeScore} - {f.awayScore}
            </div>
          ) : (
            <>
              <input className="score-input" type="number" min="0" max="20" value={h} onChange={e => setH(e.target.value)} disabled={locked} />
              <span style={{ color: "#444", fontSize: 20, fontFamily: "'Bebas Neue', cursive" }}>-</span>
              <input className="score-input" type="number" min="0" max="20" value={a} onChange={e => setA(e.target.value)} disabled={locked} />
            </>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 1, marginRight: 6 }}>{f.away}</span>
          <span style={{ fontSize: 11 }}>{FLAGS[f.away] || "🏳️"}</span>
        </div>
      </div>

      {/* Prediction display / save */}
      {f.status !== "finished" && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12, color: "#555" }}>
            {pred !== undefined ? `Tu pick: ${pred.homeScore} - ${pred.awayScore}` : (locked ? "Sin predicción" : "Cargá tu resultado")}
          </div>
          {!locked && (
            <button className="gold-btn" style={{ fontSize: 12, padding: "6px 16px" }}
              onClick={() => { if (h !== "" && a !== "") savePrediction(f.id, h, a); }}>
              Guardar
            </button>
          )}
        </div>
      )}
      {f.status === "finished" && pred && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
          Tu pick: {pred.homeScore} - {pred.awayScore}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LEADERBOARD
// ============================================================
function LeaderboardTab({ leaderboard, currentUser }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 3, color: "#c8a84b", marginBottom: 16 }}>TABLA DE POSICIONES</div>
      {leaderboard.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>Todavía no hay participantes aprobados</div>}
      {leaderboard.map((u, i) => (
        <div key={u.username} className="match-card" style={{
          display: "flex", alignItems: "center", gap: 16,
          background: u.username === currentUser?.username ? "rgba(200,168,75,0.06)" : undefined,
          borderColor: u.username === currentUser?.username ? "rgba(200,168,75,0.3)" : undefined,
        }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: i < 3 ? "#c8a84b" : "#555", minWidth: 32, textAlign: "center" }}>
            {medals[i] || i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 1 }}>{u.displayName}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
              ⭐ {u.exact} exactos · ✓ {u.correct} correctos
            </div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: "#c8a84b" }}>{u.pts}</div>
          <div style={{ fontSize: 11, color: "#555" }}>pts</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MY PREDICTIONS
// ============================================================
function MyPredsTab({ fixtures, predictions, currentUser, calcScore, phases }) {
  const myPreds = fixtures.filter(f => predictions[`${currentUser.username}_${f.id}`] !== undefined);
  const finished = myPreds.filter(f => f.status === "finished");
  const pending = myPreds.filter(f => f.status !== "finished");
  const totalPts = finished.reduce((acc, f) => acc + calcScore(predictions[`${currentUser.username}_${f.id}`], f.homeScore, f.awayScore), 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[["Puntos totales", totalPts, "#c8a84b"], ["Predicciones", myPreds.length, "#888"], ["Finalizados", finished.length, "#7dd87d"]].map(([label, val, color]) => (
          <div key={label} className="card" style={{ flex: 1, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color }}>{val}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>
      {pending.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Pendientes</div>
          {pending.map(f => {
            const pred = predictions[`${currentUser.username}_${f.id}`];
            return (
              <div key={f.id} className="match-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13 }}>{FLAGS[f.home]} {f.home} vs {f.away} {FLAGS[f.away]}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: "#888" }}>{pred.homeScore} - {pred.awayScore}</div>
              </div>
            );
          })}
        </>
      )}
      {finished.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", margin: "16px 0 10px" }}>Finalizados</div>
          {finished.map(f => {
            const pred = predictions[`${currentUser.username}_${f.id}`];
            const s = calcScore(pred, f.homeScore, f.awayScore);
            return (
              <div key={f.id} className="match-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13 }}>{FLAGS[f.home]} {f.home} vs {f.away} {FLAGS[f.away]}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>
                    Real: {f.homeScore}-{f.awayScore} · Tu pick: {pred.homeScore}-{pred.awayScore}
                  </div>
                </div>
                <span className={`pts-badge ${s === 3 ? "pts-3" : s === 1 ? "pts-1" : "pts-0"}`}>
                  {s === 3 ? "⭐ +3" : s === 1 ? "+1" : "0"}
                </span>
              </div>
            );
          })}
        </>
      )}
      {myPreds.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>Todavía no cargaste ninguna predicción</div>}
    </div>
  );
}

// ============================================================
// ADMIN TAB
// ============================================================
function AdminTab({ pendingUsers, onApprove, onReject, fixtures, phases, groupKeys, selectedPhase, setSelectedPhase, selectedGroup, setSelectedGroup, getFilteredFixtures, saveResult, bgImage, onSaveBg, users, predictions }) {
  const [bgUrl, setBgUrl] = useState(bgImage || "");
  const [resultInputs, setResultInputs] = useState({});
  const filtered = getFilteredFixtures();

  const setInput = (id, side, val) => setResultInputs(prev => ({ ...prev, [id]: { ...prev[id], [side]: val } }));

  return (
    <div>
      {/* Pending approvals */}
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 2, color: "#c8a84b", marginBottom: 12 }}>
        APROBACIONES PENDIENTES {pendingUsers.length > 0 && <span style={{ background: "#c8a84b", color: "#000", borderRadius: 10, padding: "2px 8px", fontSize: 14, marginLeft: 8 }}>{pendingUsers.length}</span>}
      </div>
      {pendingUsers.length === 0 && <div style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>No hay solicitudes pendientes</div>}
      {pendingUsers.map(u => (
        <div key={u.username} className="match-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16 }}>{u.displayName}</div>
            <div style={{ fontSize: 11, color: "#555" }}>@{u.username}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="gold-btn" style={{ fontSize: 13, padding: "6px 16px" }} onClick={() => onApprove(u.username)}>✓ Aprobar</button>
            <button style={{ background: "rgba(200,60,60,0.15)", border: "1px solid rgba(200,60,60,0.3)", color: "#e07070", fontFamily: "'Bebas Neue', cursive", fontSize: 13, padding: "6px 16px", borderRadius: 4, cursor: "pointer" }} onClick={() => onReject(u.username)}>✕</button>
          </div>
        </div>
      ))}

      {/* Approved users */}
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 2, color: "#c8a84b", margin: "24px 0 12px" }}>
        PARTICIPANTES ({users.filter(u => u.approved).length})
      </div>
      {users.filter(u => u.approved).map(u => (
        <div key={u.username} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
          <span style={{ color: "#888", minWidth: 20 }}>👤</span>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 15 }}>{u.displayName}</span>
          <span style={{ color: "#555", fontSize: 11 }}>@{u.username}</span>
          <span style={{ marginLeft: "auto", color: "#c8a84b", fontFamily: "'Bebas Neue', cursive", fontSize: 13 }}>
            {Object.keys(predictions).filter(k => k.startsWith(u.username + "_")).length} picks
          </span>
        </div>
      ))}

      {/* Load results */}
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 2, color: "#c8a84b", margin: "28px 0 12px" }}>CARGAR RESULTADOS</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {phases.map(p => (
          <button key={p} className={`phase-btn ${selectedPhase === p ? "active" : ""}`} onClick={() => setSelectedPhase(p)}>{p}</button>
        ))}
      </div>
      {selectedPhase === "Grupos" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {groupKeys.map(g => (
            <button key={g} className={`group-btn ${selectedGroup === g ? "active" : ""}`} onClick={() => setSelectedGroup(g)}>{g}</button>
          ))}
        </div>
      )}
      {filtered.map(f => (
        <div key={f.id} className="match-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, textAlign: "right", fontFamily: "'Bebas Neue', cursive", fontSize: 15 }}>{FLAGS[f.home]} {f.home}</div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: "#c8a84b", minWidth: 60, textAlign: "center" }}>
              {f.status === "finished" ? `${f.homeScore}-${f.awayScore}` : "vs"}
            </div>
            <div style={{ flex: 1, fontFamily: "'Bebas Neue', cursive", fontSize: 15 }}>{f.away} {FLAGS[f.away]}</div>
          </div>
          {f.status !== "finished" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="score-input" type="number" min="0" max="20" placeholder="0"
                value={resultInputs[f.id]?.home ?? ""}
                onChange={e => setInput(f.id, "home", e.target.value)} />
              <span style={{ color: "#444", fontFamily: "'Bebas Neue', cursive", fontSize: 18 }}>-</span>
              <input className="score-input" type="number" min="0" max="20" placeholder="0"
                value={resultInputs[f.id]?.away ?? ""}
                onChange={e => setInput(f.id, "away", e.target.value)} />
              <button className="gold-btn" style={{ fontSize: 13, padding: "8px 20px", marginLeft: 8 }}
                onClick={() => {
                  const h = resultInputs[f.id]?.home; const a = resultInputs[f.id]?.away;
                  if (h !== undefined && a !== undefined && h !== "" && a !== "") saveResult(f.id, h, a);
                }}>
                Confirmar
              </button>
            </div>
          )}
          {f.status === "finished" && <div style={{ fontSize: 11, color: "#7dd87d", letterSpacing: 1 }}>✓ RESULTADO CARGADO</div>}
        </div>
      ))}

      {/* Background image */}
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 2, color: "#c8a84b", margin: "28px 0 12px" }}>IMAGEN DE FONDO</div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>URL de imagen</div>
        <input className="input-field" value={bgUrl} onChange={e => setBgUrl(e.target.value)} placeholder="https://..." />
        <button className="gold-btn" style={{ marginTop: 12 }} onClick={() => onSaveBg(bgUrl)}>Aplicar fondo</button>
        {bgImage && <button style={{ marginTop: 12, marginLeft: 12, background: "none", border: "1px solid #444", color: "#888", fontFamily: "'Barlow Condensed', sans-serif", padding: "8px 16px", borderRadius: 4, fontSize: 13 }} onClick={() => { setBgUrl(""); onSaveBg(""); }}>Quitar fondo</button>}
      </div>
    </div>
  );
}
