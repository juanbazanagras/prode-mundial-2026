import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { FLAGS, INITIAL_FIXTURES, calcScore, PHASES, GROUP_KEYS } from "./data";

const ADMIN = { username: "admin", password: "losvagos2026", display_name: "Admin", role: "admin", approved: true };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#111}::-webkit-scrollbar-thumb{background:#c8a84b;border-radius:2px}
input{outline:none}button{cursor:pointer;border:none}
.tab-btn{background:none;color:#888;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;padding:8px 16px;border-bottom:2px solid transparent;transition:all .2s}
.tab-btn.active{color:#c8a84b;border-bottom-color:#c8a84b}.tab-btn:hover{color:#c8a84b}
.gold-btn{background:linear-gradient(135deg,#c8a84b,#e8c96a);color:#0a0a0a;font-family:'Bebas Neue',cursive;letter-spacing:2px;font-size:16px;padding:10px 28px;border-radius:4px;transition:all .2s}
.gold-btn:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(200,168,75,.4)}
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px}
.match-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:16px;margin-bottom:10px;transition:border-color .2s}
.match-card:hover{border-color:rgba(200,168,75,.3)}
.score-input{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-family:'Bebas Neue',cursive;font-size:22px;text-align:center;width:44px;height:44px;border-radius:4px;transition:border-color .2s}
.score-input:focus{border-color:#c8a84b;background:rgba(200,168,75,.1)}
.phase-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#aaa;font-family:'Barlow Condensed',sans-serif;font-weight:600;letter-spacing:1px;font-size:12px;padding:6px 14px;border-radius:20px;transition:all .2s;text-transform:uppercase}
.phase-btn.active{background:rgba(200,168,75,.15);border-color:#c8a84b;color:#c8a84b}.phase-btn:hover{border-color:#c8a84b;color:#c8a84b}
.group-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#888;font-family:'Bebas Neue',cursive;font-size:14px;letter-spacing:1px;width:36px;height:36px;border-radius:4px;transition:all .2s}
.group-btn.active{background:rgba(200,168,75,.15);border-color:#c8a84b;color:#c8a84b}.group-btn:hover{border-color:#c8a84b;color:#c8a84b}
.input-field{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:15px;padding:10px 14px;border-radius:6px;width:100%;transition:border-color .2s}
.input-field:focus{border-color:#c8a84b;background:rgba(200,168,75,.05)}.input-field::placeholder{color:#555}
.notif{position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:15px;letter-spacing:.5px;z-index:9999;animation:slideIn .3s ease}
@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}
.pts-badge{display:inline-block;font-family:'Bebas Neue',cursive;font-size:11px;letter-spacing:1px;padding:2px 7px;border-radius:3px}
.pts-3{background:rgba(200,168,75,.2);color:#c8a84b;border:1px solid rgba(200,168,75,.4)}
.pts-1{background:rgba(100,200,100,.15);color:#7dd87d;border:1px solid rgba(100,200,100,.3)}
.pts-0{background:rgba(200,80,80,.15);color:#e07070;border:1px solid rgba(200,80,80,.3)}
`;

export default function App() {
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [bgImage, setBgImage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("fixtures");
  const [selectedPhase, setSelectedPhase] = useState("Grupos");
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // INIT: seed fixtures if empty, load settings
  useEffect(() => {
    (async () => {
      const { data: existing } = await supabase.from("fixtures").select("id").limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("fixtures").insert(INITIAL_FIXTURES);
      }
      const { data: fx } = await supabase.from("fixtures").select("*").order("id");
      if (fx) setFixtures(fx);

      const { data: bg } = await supabase.from("settings").select("value").eq("key", "bg_image").single();
      if (bg) setBgImage(bg.value || "");

      setLoaded(true);
    })();
  }, []);

  const refreshFixtures = useCallback(async () => {
    const { data } = await supabase.from("fixtures").select("*").order("id");
    if (data) setFixtures(data);
  }, []);

  const refreshUsers = useCallback(async () => {
    const { data } = await supabase.from("users").select("*").order("created_at");
    if (data) setUsers(data);
  }, []);

  const refreshPredictions = useCallback(async (username) => {
    const q = supabase.from("predictions").select("*");
    const { data } = username ? await q.eq("username", username) : await q;
    if (data) setPredictions(data);
  }, []);

  // LOGIN
  const handleLogin = async (username, password) => {
    if (username === ADMIN.username && password === ADMIN.password) {
      setCurrentUser(ADMIN);
      await refreshUsers();
      await refreshFixtures();
      await refreshPredictions();
      setActiveTab("admin");
      setScreen("app");
      return;
    }
    const { data: user } = await supabase.from("users").select("*").eq("username", username).single();
    if (!user || user.password !== password) return notify("Usuario o contraseña incorrectos", "error");
    if (!user.approved) return notify("Tu cuenta todavía no fue aprobada", "error");
    setCurrentUser(user);
    await refreshFixtures();
    await refreshPredictions(username);
    setActiveTab("fixtures");
    setScreen("app");
  };

  const handleRegister = async (username, password, displayName) => {
    if (!username || !password || !displayName) return notify("Completá todos los campos", "error");
    const { data: ex } = await supabase.from("users").select("id").eq("username", username).single();
    if (ex) return notify("Ese usuario ya existe", "error");
    const { error } = await supabase.from("users").insert({ username, password, display_name: displayName, role: "user", approved: false });
    if (error) return notify("Error al registrarse", "error");
    notify("Solicitud enviada. Esperá que el admin te apruebe.");
    setScreen("login");
  };

  const handleApprove = async (id) => {
    await supabase.from("users").update({ approved: true }).eq("id", id);
    await refreshUsers();
    notify("Usuario aprobado ✓");
  };

  const handleReject = async (id) => {
    await supabase.from("users").delete().eq("id", id);
    await refreshUsers();
    notify("Usuario rechazado");
  };

  const isLocked = (fixture) => {
    const matchTime = new Date(`${fixture.date}T${fixture.time}:00`);
    return new Date() >= new Date(matchTime.getTime() - 60 * 60 * 1000) || fixture.status === "finished";
  };

  const savePrediction = async (fixtureId, homeScore, awayScore) => {
    const { error } = await supabase.from("predictions").upsert(
      { username: currentUser.username, fixture_id: fixtureId, home_score: parseInt(homeScore), away_score: parseInt(awayScore) },
      { onConflict: "username,fixture_id" }
    );
    if (error) return notify("Error al guardar", "error");
    await refreshPredictions(currentUser.username);
    notify("Predicción guardada ✓");
  };

  const saveResult = async (fixtureId, homeScore, awayScore) => {
    const { error } = await supabase.from("fixtures").update({ home_score: parseInt(homeScore), away_score: parseInt(awayScore), status: "finished" }).eq("id", fixtureId);
    if (error) return notify("Error al guardar resultado", "error");
    await refreshFixtures();
    notify("Resultado guardado ✓");
  };

  const getLeaderboard = () => {
    const finished = fixtures.filter(f => f.status === "finished");
    return users.filter(u => u.approved).map(user => {
      let pts = 0, exact = 0, correct = 0;
      finished.forEach(f => {
        const pred = predictions.find(p => p.username === user.username && p.fixture_id === f.id);
        if (!pred) return;
        const s = calcScore(pred, f.home_score, f.away_score);
        pts += s; if (s === 3) exact++; if (s === 1) correct++;
      });
      return { ...user, pts, exact, correct };
    }).sort((a, b) => b.pts - a.pts || b.exact - a.exact);
  };

  const getFilteredFixtures = () => {
    if (selectedPhase === "Grupos") return fixtures.filter(f => f.phase === "Grupos" && f.group === selectedGroup);
    return fixtures.filter(f => f.phase === selectedPhase);
  };

  const bgStyle = bgImage
    ? { background: `linear-gradient(rgba(0,0,0,0.82),rgba(0,0,0,0.82)) center/cover, url(${bgImage}) center/cover fixed` }
    : { background: "linear-gradient(135deg,#0a0a0a 0%,#111827 50%,#0a0a0a 100%)" };

  if (!loaded) return (
    <div style={{ ...bgStyle, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <div style={{ color: "#c8a84b", fontFamily: "'Bebas Neue',cursive", fontSize: 32, letterSpacing: 4 }}>CARGANDO...</div>
    </div>
  );

  return (
    <div style={{ ...bgStyle, minHeight: "100vh", fontFamily: "'Barlow Condensed',sans-serif", color: "#e8e8e8", paddingBottom: 80 }}>
      <style>{CSS}</style>

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
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, letterSpacing: 3, color: "#c8a84b", lineHeight: 1 }}>LOS VAGOS</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, letterSpacing: 3, color: "#555", textTransform: "uppercase" }}>Mundial 2026</div>
        </div>
        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#888" }}>{currentUser.display_name}</span>
            <button className="phase-btn" onClick={() => { setCurrentUser(null); setScreen("login"); }}>Salir</button>
          </div>
        )}
      </div>

      {screen === "login" && <LoginScreen onLogin={handleLogin} onGoRegister={() => setScreen("register")} />}
      {screen === "register" && <RegisterScreen onRegister={handleRegister} onBack={() => setScreen("login")} />}

      {screen === "app" && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
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

          {activeTab === "fixtures" && (
            <FixturesTab fixtures={getFilteredFixtures()} phases={PHASES} groupKeys={GROUP_KEYS}
              selectedPhase={selectedPhase} setSelectedPhase={setSelectedPhase}
              selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup}
              currentUser={currentUser} predictions={predictions}
              savePrediction={savePrediction} isLocked={isLocked} />
          )}
          {activeTab === "leaderboard" && <LeaderboardTab leaderboard={getLeaderboard()} currentUser={currentUser} />}
          {activeTab === "mypreds" && (
            <MyPredsTab fixtures={fixtures} predictions={predictions.filter(p => p.username === currentUser.username)}
              calcScore={calcScore} />
          )}
          {activeTab === "admin" && currentUser?.role === "admin" && (
            <AdminTab
              users={users} onApprove={handleApprove} onReject={handleReject}
              fixtures={getFilteredFixtures()} phases={PHASES} groupKeys={GROUP_KEYS}
              selectedPhase={selectedPhase} setSelectedPhase={setSelectedPhase}
              selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup}
              saveResult={saveResult} bgImage={bgImage}
              onSaveBg={async (url) => {
                await supabase.from("settings").upsert({ key: "bg_image", value: url }, { onConflict: "key" });
                setBgImage(url); notify("Fondo actualizado ✓");
              }}
              predictions={predictions}
            />
          )}
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin, onGoRegister }) {
  const [u, setU] = useState(""); const [p, setP] = useState("");
  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 52, color: "#c8a84b" }}>⚽</div>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 36, letterSpacing: 4, color: "#fff", marginTop: 8 }}>INGRESÁ</div>
      </div>
      <div className="card" style={{ padding: 28 }}>
        {[["Usuario", u, setU, "text", "tu_usuario"], ["Contraseña", p, setP, "password", "••••••"]].map(([label, val, setter, type, ph]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <input className="input-field" type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph} onKeyDown={e => e.key === "Enter" && onLogin(u, p)} />
          </div>
        ))}
        <button className="gold-btn" style={{ width: "100%", marginTop: 8 }} onClick={() => onLogin(u, p)}>Entrar</button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#555" }}>
          ¿No tenés cuenta? <span style={{ color: "#c8a84b", cursor: "pointer" }} onClick={onGoRegister}>Registrate</span>
        </div>
      </div>
    </div>
  );
}

function RegisterScreen({ onRegister, onBack }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [d, setD] = useState("");
  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 36, letterSpacing: 4, color: "#fff" }}>REGISTRATE</div>
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

function FixturesTab({ fixtures, phases, groupKeys, selectedPhase, setSelectedPhase, selectedGroup, setSelectedGroup, currentUser, predictions, savePrediction, isLocked }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {phases.map(p => <button key={p} className={`phase-btn ${selectedPhase === p ? "active" : ""}`} onClick={() => setSelectedPhase(p)}>{p}</button>)}
      </div>
      {selectedPhase === "Grupos" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {groupKeys.map(g => <button key={g} className={`group-btn ${selectedGroup === g ? "active" : ""}`} onClick={() => setSelectedGroup(g)}>{g}</button>)}
        </div>
      )}
      {fixtures.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>No hay partidos en esta fase todavía</div>}
      {fixtures.map(f => <MatchCard key={f.id} fixture={f} currentUser={currentUser} predictions={predictions} savePrediction={savePrediction} isLocked={isLocked} />)}
    </div>
  );
}

function MatchCard({ fixture: f, currentUser, predictions, savePrediction, isLocked }) {
  const pred = predictions.find(p => p.username === currentUser?.username && p.fixture_id === f.id);
  const locked = isLocked(f);
  const [h, setH] = useState(pred?.home_score ?? "");
  const [a, setA] = useState(pred?.away_score ?? "");
  const score = f.status === "finished" && pred ? calcScore(pred, f.home_score, f.away_score) : null;

  return (
    <div className="match-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 1 }}>
          {f.group ? `GRUPO ${f.group} · ` : ""}{f.date} {f.time}hs
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {f.status === "finished" && <span style={{ fontSize: 11, color: "#7dd87d", letterSpacing: 1 }}>✓ FINAL</span>}
          {locked && f.status !== "finished" && <span style={{ fontSize: 11, color: "#e07070", letterSpacing: 1 }}>🔒 CERRADO</span>}
          {score !== null && <span className={`pts-badge ${score === 3 ? "pts-3" : score === 1 ? "pts-1" : "pts-0"}`}>{score === 3 ? "⭐ +3" : score === 1 ? "+1" : "0 pts"}</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, textAlign: "right" }}>
          <span style={{ fontSize: 11 }}>{FLAGS[f.home] || "🏳️"}</span>
          <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, letterSpacing: 1, marginLeft: 6 }}>{f.home}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {f.status === "finished"
            ? <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: "#c8a84b", letterSpacing: 2, minWidth: 70, textAlign: "center" }}>{f.home_score} - {f.away_score}</div>
            : <>
              <input className="score-input" type="number" min="0" max="20" value={h} onChange={e => setH(e.target.value)} disabled={locked} />
              <span style={{ color: "#444", fontSize: 20, fontFamily: "'Bebas Neue',cursive" }}>-</span>
              <input className="score-input" type="number" min="0" max="20" value={a} onChange={e => setA(e.target.value)} disabled={locked} />
            </>
          }
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, letterSpacing: 1, marginRight: 6 }}>{f.away}</span>
          <span style={{ fontSize: 11 }}>{FLAGS[f.away] || "🏳️"}</span>
        </div>
      </div>
      {f.status !== "finished" && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12, color: "#555" }}>
            {pred ? `Tu pick: ${pred.home_score} - ${pred.away_score}` : locked ? "Sin predicción" : "Cargá tu resultado"}
          </div>
          {!locked && <button className="gold-btn" style={{ fontSize: 12, padding: "6px 16px" }} onClick={() => { if (h !== "" && a !== "") savePrediction(f.id, h, a); }}>Guardar</button>}
        </div>
      )}
      {f.status === "finished" && pred && <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>Tu pick: {pred.home_score} - {pred.away_score}</div>}
    </div>
  );
}

function LeaderboardTab({ leaderboard, currentUser }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, letterSpacing: 3, color: "#c8a84b", marginBottom: 16 }}>TABLA DE POSICIONES</div>
      {leaderboard.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>Todavía no hay participantes aprobados</div>}
      {leaderboard.map((u, i) => (
        <div key={u.username} className="match-card" style={{ display: "flex", alignItems: "center", gap: 16, background: u.username === currentUser?.username ? "rgba(200,168,75,0.06)" : undefined, borderColor: u.username === currentUser?.username ? "rgba(200,168,75,0.3)" : undefined }}>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: i < 3 ? "#c8a84b" : "#555", minWidth: 32, textAlign: "center" }}>{medals[i] || i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, letterSpacing: 1 }}>{u.display_name}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>⭐ {u.exact} exactos · ✓ {u.correct} correctos</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: "#c8a84b" }}>{u.pts}</div>
          <div style={{ fontSize: 11, color: "#555" }}>pts</div>
        </div>
      ))}
    </div>
  );
}

function MyPredsTab({ fixtures, predictions, calcScore }) {
  const finished = fixtures.filter(f => f.status === "finished");
  const myFinished = finished.filter(f => predictions.find(p => p.fixture_id === f.id));
  const myPending = fixtures.filter(f => f.status !== "finished" && predictions.find(p => p.fixture_id === f.id));
  const totalPts = myFinished.reduce((acc, f) => acc + calcScore(predictions.find(p => p.fixture_id === f.id), f.home_score, f.away_score), 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[["Puntos totales", totalPts, "#c8a84b"], ["Predicciones", predictions.length, "#888"], ["Finalizados", myFinished.length, "#7dd87d"]].map(([label, val, color]) => (
          <div key={label} className="card" style={{ flex: 1, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color }}>{val}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>
      {myPending.length > 0 && <>
        <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Pendientes</div>
        {myPending.map(f => { const pred = predictions.find(p => p.fixture_id === f.id); return (
          <div key={f.id} className="match-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13 }}>{FLAGS[f.home]} {f.home} vs {f.away} {FLAGS[f.away]}</div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: "#888" }}>{pred.home_score} - {pred.away_score}</div>
          </div>
        );})}
      </>}
      {myFinished.length > 0 && <>
        <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", margin: "16px 0 10px" }}>Finalizados</div>
        {myFinished.map(f => { const pred = predictions.find(p => p.fixture_id === f.id); const s = calcScore(pred, f.home_score, f.away_score); return (
          <div key={f.id} className="match-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13 }}>{FLAGS[f.home]} {f.home} vs {f.away} {FLAGS[f.away]}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>Real: {f.home_score}-{f.away_score} · Tu pick: {pred.home_score}-{pred.away_score}</div>
            </div>
            <span className={`pts-badge ${s === 3 ? "pts-3" : s === 1 ? "pts-1" : "pts-0"}`}>{s === 3 ? "⭐ +3" : s === 1 ? "+1" : "0"}</span>
          </div>
        );})}
      </>}
      {predictions.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: 40 }}>Todavía no cargaste ninguna predicción</div>}
    </div>
  );
}

function AdminTab({ users, onApprove, onReject, fixtures, phases, groupKeys, selectedPhase, setSelectedPhase, selectedGroup, setSelectedGroup, saveResult, bgImage, onSaveBg, predictions }) {
  const [bgUrl, setBgUrl] = useState(bgImage || "");
  const [resultInputs, setResultInputs] = useState({});
  const pending = users.filter(u => !u.approved);
  const approved = users.filter(u => u.approved);
  const setInput = (id, side, val) => setResultInputs(prev => ({ ...prev, [id]: { ...prev[id], [side]: val } }));

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 2, color: "#c8a84b", marginBottom: 12 }}>
        APROBACIONES PENDIENTES {pending.length > 0 && <span style={{ background: "#c8a84b", color: "#000", borderRadius: 10, padding: "2px 8px", fontSize: 14, marginLeft: 8 }}>{pending.length}</span>}
      </div>
      {pending.length === 0 && <div style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>No hay solicitudes pendientes</div>}
      {pending.map(u => (
        <div key={u.id} className="match-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16 }}>{u.display_name}</div>
            <div style={{ fontSize: 11, color: "#555" }}>@{u.username}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="gold-btn" style={{ fontSize: 13, padding: "6px 16px" }} onClick={() => onApprove(u.id)}>✓ Aprobar</button>
            <button style={{ background: "rgba(200,60,60,0.15)", border: "1px solid rgba(200,60,60,0.3)", color: "#e07070", fontFamily: "'Bebas Neue',cursive", fontSize: 13, padding: "6px 16px", borderRadius: 4, cursor: "pointer" }} onClick={() => onReject(u.id)}>✕</button>
          </div>
        </div>
      ))}

      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 2, color: "#c8a84b", margin: "24px 0 12px" }}>PARTICIPANTES ({approved.length})</div>
      {approved.map(u => (
        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
          <span style={{ color: "#888" }}>👤</span>
          <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 15 }}>{u.display_name}</span>
          <span style={{ color: "#555", fontSize: 11 }}>@{u.username}</span>
          <span style={{ marginLeft: "auto", color: "#c8a84b", fontFamily: "'Bebas Neue',cursive", fontSize: 13 }}>
            {predictions.filter(p => p.username === u.username).length} picks
          </span>
        </div>
      ))}

      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 2, color: "#c8a84b", margin: "28px 0 12px" }}>CARGAR RESULTADOS</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {phases.map(p => <button key={p} className={`phase-btn ${selectedPhase === p ? "active" : ""}`} onClick={() => setSelectedPhase(p)}>{p}</button>)}
      </div>
      {selectedPhase === "Grupos" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {groupKeys.map(g => <button key={g} className={`group-btn ${selectedGroup === g ? "active" : ""}`} onClick={() => setSelectedGroup(g)}>{g}</button>)}
        </div>
      )}
      {fixtures.map(f => (
        <div key={f.id} className="match-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, textAlign: "right", fontFamily: "'Bebas Neue',cursive", fontSize: 15 }}>{FLAGS[f.home]} {f.home}</div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: "#c8a84b", minWidth: 60, textAlign: "center" }}>{f.status === "finished" ? `${f.home_score}-${f.away_score}` : "vs"}</div>
            <div style={{ flex: 1, fontFamily: "'Bebas Neue',cursive", fontSize: 15 }}>{f.away} {FLAGS[f.away]}</div>
          </div>
          {f.status !== "finished" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="score-input" type="number" min="0" max="20" placeholder="0" value={resultInputs[f.id]?.home ?? ""} onChange={e => setInput(f.id, "home", e.target.value)} />
              <span style={{ color: "#444", fontFamily: "'Bebas Neue',cursive", fontSize: 18 }}>-</span>
              <input className="score-input" type="number" min="0" max="20" placeholder="0" value={resultInputs[f.id]?.away ?? ""} onChange={e => setInput(f.id, "away", e.target.value)} />
              <button className="gold-btn" style={{ fontSize: 13, padding: "8px 20px", marginLeft: 8 }}
                onClick={() => { const h = resultInputs[f.id]?.home; const a = resultInputs[f.id]?.away; if (h !== undefined && a !== undefined && h !== "" && a !== "") saveResult(f.id, h, a); }}>
                Confirmar
              </button>
            </div>
          )}
          {f.status === "finished" && <div style={{ fontSize: 11, color: "#7dd87d", letterSpacing: 1 }}>✓ RESULTADO CARGADO</div>}
        </div>
      ))}

      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 2, color: "#c8a84b", margin: "28px 0 12px" }}>IMAGEN DE FONDO</div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>URL de imagen</div>
        <input className="input-field" value={bgUrl} onChange={e => setBgUrl(e.target.value)} placeholder="https://..." />
        <button className="gold-btn" style={{ marginTop: 12 }} onClick={() => onSaveBg(bgUrl)}>Aplicar fondo</button>
        {bgImage && <button style={{ marginTop: 12, marginLeft: 12, background: "none", border: "1px solid #444", color: "#888", fontFamily: "'Barlow Condensed',sans-serif", padding: "8px 16px", borderRadius: 4, fontSize: 13 }} onClick={() => { setBgUrl(""); onSaveBg(""); }}>Quitar fondo</button>}
      </div>
    </div>
  );
}
