import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const LEAGUES = {
  girls: {
    name: "K$ Showdown",
    sub: "March Madness 2026",
    players: ["J$", "K$", "Nydda", "H20", "Chaco"],
    colors: {
      "J$":    { bg: "#6B8CFF", text: "#fff", glow: "rgba(107,140,255,.35)" },
      "K$":    { bg: "#FF9B5E", text: "#fff", glow: "rgba(255,155,94,.35)" },
      "Nydda": { bg: "#7BC88F", text: "#fff", glow: "rgba(123,200,143,.35)" },
      "H20":   { bg: "#FF7EB3", text: "#fff", glow: "rgba(255,126,179,.35)" },
      "Chaco": { bg: "#A78BFA", text: "#fff", glow: "rgba(167,139,250,.35)" },
    },
    medals: ["\u{1F451}","\u{2728}","\u{1F338}","\u{1F33C}","\u{1F33A}"],
    theme: {
      bg: "#FFF8F6", text: "#3D2B3D", muted: "#A08BA0", subtle: "#C4A0C4",
      card: "rgba(255,255,255,.7)", cardBorder: "rgba(255,255,255,.8)", cardHover: "#F0E6F0",
      accent1: "#FF7EB3", accent2: "#A78BFA", accent3: "#6B8CFF",
      gradientTitle: "linear-gradient(90deg,#FF7EB3,#A78BFA,#6B8CFF,#FF7EB3)",
      gradientBar: "linear-gradient(90deg,#6B8CFF,#FF9B5E,#7BC88F,#FF7EB3,#A78BFA,#6B8CFF)",
      gradientTab: "linear-gradient(135deg,#FF7EB3,#A78BFA)",
      gradientRegion: "linear-gradient(135deg,#FF7EB3,#FF9B5E)",
      gradientRegionTitle: "linear-gradient(90deg,#FF7EB3,#A78BFA)",
      gradientLeaderboard: "linear-gradient(90deg,#FF7EB3,#A78BFA,#6B8CFF)",
      divider: "linear-gradient(90deg,transparent,#E8D6FF,#FFD6E8,#D6E8FF,transparent)",
      scrollThumb: "#E8D6FF", scrollTrack: "#FFF0F5",
      emptyBorder: "#E8D6FF", emptyBg: "rgba(255,255,255,.4)",
      teamBg: "rgba(255,255,255,.65)", teamBorder: "#F0E6F0", seedBg: "#F5EFF5",
      font: "'Quicksand',sans-serif", fontBody: "'DM Sans',sans-serif",
      confettiColors: ["#FFD6E8","#E8D6FF","#D6E8FF","#FFE8D6","#D6FFE8","#FF7EB3","#A78BFA","#6B8CFF"],
      sparkle: true,
    },
  },
  guys: {
    name: "Bracket Battleground",
    sub: "March Madness 2026",
    players: ["Justin", "Nils", "Chris"],
    colors: {
      "Justin": { bg: "#00FDFD", text: "#0F172A", glow: "rgba(0,253,253,.4)" },
      "Nils":   { bg: "#2563EB", text: "#fff", glow: "rgba(37,99,235,.45)" },
      "Chris":  { bg: "#16A34A", text: "#fff", glow: "rgba(22,163,74,.45)" },
    },
    medals: ["\u{1F3C6}","\u{1F948}","\u{1F949}"],
    theme: {
      bg: "#0F172A", text: "#F1F5F9", muted: "#94A3B8", subtle: "#475569",
      card: "rgba(30,41,59,.8)", cardBorder: "rgba(51,65,85,.6)", cardHover: "#334155",
      accent1: "#DC2626", accent2: "#D4A843", accent3: "#16A34A",
      gradientTitle: "linear-gradient(90deg,#D4A843,#F5DEB3,#D4A843)",
      gradientBar: "linear-gradient(90deg,#DC2626,#D4A843,#2563EB,#16A34A,#DC2626)",
      gradientTab: "linear-gradient(135deg,#D4A843,#B8860B)",
      gradientRegion: "linear-gradient(135deg,#DC2626,#991B1B)",
      gradientRegionTitle: "linear-gradient(90deg,#D4A843,#F5DEB3)",
      gradientLeaderboard: "linear-gradient(90deg,#D4A843,#DC2626,#2563EB)",
      divider: "linear-gradient(90deg,transparent,#D4A84333,#DC262633,#2563EB33,transparent)",
      scrollThumb: "#D4A84366", scrollTrack: "#0F172A",
      emptyBorder: "#334155", emptyBg: "rgba(30,41,59,.5)",
      teamBg: "rgba(30,41,59,.6)", teamBorder: "#334155", seedBg: "#1E293B",
      font: "'Barlow Condensed',sans-serif", fontBody: "'Barlow',sans-serif",
      confettiColors: ["#DC2626","#D4A843","#2563EB","#16A34A","#F1F5F9"],
      sparkle: false,
    },
  },
};

const ROUND_NAMES = ["R64", "R32", "Sweet 16", "Elite 8", "Final Four", "\u{1F3C6}"];
const ROUND_DATES = ["Mar 20-21", "Mar 22-23", "Mar 27-28", "Mar 29-30", "Apr 5", "Apr 7"];
const ROUND_PTS   = [1, 2, 4, 8, 16, 32];
const ALL_PLAYERS = [...LEAGUES.girls.players, ...LEAGUES.guys.players];

const TEAM_DATA = {
  "Duke": { id: 150, color: "013088" },
  "Mount St. Mary's": { id: 116, color: "005596" },
  "Alabama": { id: 333, color: "9e1632" },
  "Robert Morris": { id: 2523, color: "00214D" },
  "Baylor": { id: 239, color: "154734" },
  "VCU": { id: 2670, color: "ffaf00" },
  "SMU": { id: 2567, color: "354ca1" },
  "McNeese": { id: 2377, color: "00529C" },
  "Michigan": { id: 130, color: "00274c" },
  "UC San Diego": { id: 28, color: "000080" },
  "Marquette": { id: 269, color: "003366" },
  "New Mexico": { id: 167, color: "BA0C2F" },
  "Texas Tech": { id: 2641, color: "cc0000" },
  "NC State": { id: 152, color: "cc0000" },
  "Kentucky": { id: 96, color: "0033a0" },
  "Troy": { id: 2653, color: "AE0210" },
  "Arizona": { id: 12, color: "0c234b" },
  "Norfolk St.": { id: 2450, color: "0c8968" },
  "Memphis": { id: 235, color: "004991" },
  "Colorado St.": { id: 36, color: "1e4d2b" },
  "Clemson": { id: 228, color: "f56600" },
  "Drake": { id: 2181, color: "005596" },
  "Boise St.": { id: 68, color: "0033a0" },
  "Akron": { id: 2006, color: "00285e" },
  "Iowa St.": { id: 66, color: "822433" },
  "Lipscomb": { id: 288, color: "20366C" },
  "Mississippi St.": { id: 344, color: "5d1725" },
  "New Mexico St.": { id: 166, color: "891216" },
  "Mizzou": { id: 142, color: "F1B82D" },
  "Texas": { id: 251, color: "BF5700" },
  "Tennessee": { id: 2633, color: "ff8200" },
  "Wofford": { id: 2747, color: "886735" },
  "Florida": { id: 57, color: "0021a5" },
  "UConn": { id: 41, color: "0c2340" },
  "Oklahoma": { id: 201, color: "841617" },
  "Colorado": { id: 38, color: "CFB87C" },
  "Maryland": { id: 120, color: "D5002B" },
  "Grand Canyon": { id: 2253, color: "522398" },
  "Texas A&M": { id: 245, color: "500000" },
  "Yale": { id: 43, color: "004a81" },
  "Ole Miss": { id: 145, color: "13294b" },
  "Liberty": { id: 2335, color: "071740" },
  "Purdue": { id: 2509, color: "CEB888" },
  "High Point": { id: 2272, color: "330072" },
  "St. John's": { id: 2599, color: "d10000" },
  "Omaha": { id: 2437, color: "e3193e" },
  "American": { id: 44, color: "c41130" },
  "Gonzaga": { id: 2250, color: "041e42" },
  "Georgia": { id: 61, color: "ba0c2f" },
  "Oregon": { id: 2483, color: "007030" },
  "UCLA": { id: 26, color: "2774ae" },
  "Morehead St.": { id: 2413, color: "094FA3" },
  "Kansas": { id: 2305, color: "0051ba" },
  "Little Rock": { id: 2031, color: "AD0000" },
  "Illinois": { id: 356, color: "ff5f05" },
  "Arkansas": { id: 8, color: "a41f35" },
  "Auburn": { id: 2, color: "002b5c" },
  "Vanderbilt": { id: 238, color: "866D4B" },
  "Wisconsin": { id: 275, color: "c4012f" },
  "Montana": { id: 149, color: "751D4A" },
};

function getTeamLogo(name) {
  const t = TEAM_DATA[name];
  return t ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${t.id}.png` : null;
}
function getTeamColor(name) {
  const t = TEAM_DATA[name];
  return t ? `#${t.color}` : "#999";
}

const TEAMS = {
  East: [
    ["Duke",1],["Mount St. Mary's",16],["Alabama",8],["Robert Morris",9],
    ["Baylor",5],["VCU",12],["SMU",4],["McNeese",13],
    ["Michigan",3],["UC San Diego",14],["Marquette",6],["New Mexico",11],
    ["Texas Tech",7],["NC State",10],["Kentucky",2],["Troy",15],
  ],
  West: [
    ["Arizona",1],["Norfolk St.",16],["Memphis",8],["Colorado St.",9],
    ["Clemson",5],["Drake",12],["Boise St.",4],["Akron",13],
    ["Iowa St.",3],["Lipscomb",14],["Mississippi St.",6],["New Mexico St.",11],
    ["Mizzou",7],["Texas",10],["Tennessee",2],["Wofford",15],
  ],
  South: [
    ["Florida",1],["Norfolk St.",16],["UConn",8],["Oklahoma",9],
    ["Memphis",5],["Colorado",12],["Maryland",4],["Grand Canyon",13],
    ["Texas A&M",3],["Yale",14],["Ole Miss",6],["Liberty",11],
    ["Purdue",7],["High Point",10],["St. John's",2],["Omaha",15],
  ],
  Midwest: [
    ["Michigan",1],["American",16],["Gonzaga",8],["Georgia",9],
    ["Oregon",5],["Liberty",12],["UCLA",4],["Morehead St.",13],
    ["Kansas",3],["Little Rock",14],["Illinois",6],["Arkansas",11],
    ["Auburn",7],["Vanderbilt",10],["Wisconsin",2],["Montana",15],
  ],
};

function buildR1(region) {
  const t = TEAMS[region];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `${region}-0-${i}`,
    tA: { n: t[i*2][0], s: t[i*2][1] },
    tB: { n: t[i*2+1][0], s: t[i*2+1][1] },
  }));
}
function getSeed(name) {
  for (const teams of Object.values(TEAMS)) {
    const f = teams.find(x => x[0] === name);
    if (f) return f[1];
  }
  return "?";
}
function getRegionRounds(region, picks, ap) {
  const all = [buildR1(region)];
  for (let r = 1; r < 6; r++) {
    const prev = all[r - 1];
    const next = Array.from({ length: Math.floor(prev.length / 2) }, (_, i) => {
      const gA = prev[i*2], gB = prev[i*2+1];
      const wA = picks[ap]?.[gA.id], wB = picks[ap]?.[gB.id];
      return {
        id: `${region}-${r}-${i}`,
        tA: wA ? { n: wA, s: getSeed(wA) } : null,
        tB: wB ? { n: wB, s: getSeed(wB) } : null,
      };
    });
    all.push(next);
  }
  return all;
}

function initPicks() {
  const p = {};
  ALL_PLAYERS.forEach(pl => { p[pl] = {}; });
  return p;
}

function Sparkles() {
  const [stars] = useState(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 3 + Math.random() * 6, delay: Math.random() * 5, dur: 2 + Math.random() * 3,
    }))
  );
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {stars.map(s => (
        <div key={s.id} style={{ position:"absolute", left:`${s.x}%`, top:`${s.y}%`, width:s.size, height:s.size, animation:`twinkle ${s.dur}s ease-in-out ${s.delay}s infinite, drift ${s.dur*2}s ease-in-out ${s.delay}s infinite` }}>
          <svg viewBox="0 0 24 24" width={s.size} height={s.size} fill="none">
            <path d="M12 2l2.1 6.5H21l-5.6 4.1 2.1 6.5L12 15l-5.5 4.1 2.1-6.5L3 8.5h6.9z"
              fill={["#FFD6E8","#E8D6FF","#D6E8FF","#FFE8D6","#D6FFE8"][s.id % 5]} opacity={0.5} />
          </svg>
        </div>
      ))}
    </div>
  );
}

function getLeagueFromHash() {
  const h = window.location.hash.replace("#","").toLowerCase();
  return h === "guys" ? "guys" : "girls";
}

export default function KShowdown() {
  const [league]    = useState(getLeagueFromHash);
  const [picks,     setPicks]     = useState(initPicks);
  const [ap,        setAp]        = useState(() => LEAGUES[getLeagueFromHash()].players[0]);
  const [tab,       setTab]       = useState("bracket");
  const [region,    setRegion]    = useState("East");
  const [liveGames, setLiveGames] = useState([]);
  const [confetti,  setConfetti]  = useState([]);
  const [toast,     setToast]     = useState(null);
  const [syncing,   setSyncing]   = useState(false);
  const [online,    setOnline]    = useState(true);
  const toastTimer = useRef(null);

  const L = LEAGUES[league];
  const T = L.theme;
  const cl = L.colors[ap] || L.colors[L.players[0]];

  useEffect(() => {
    loadAllPicks();
    subscribeToRealtime();
    fetchLiveScores();
    const t = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(t);
  }, []);

  async function loadAllPicks() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.from("picks").select("*");
      if (error) throw error;
      const rebuilt = initPicks();
      data.forEach(row => {
        if (rebuilt[row.player] !== undefined) rebuilt[row.player][row.game_id] = row.team_name;
      });
      setPicks(rebuilt);
      setOnline(true);
    } catch (e) {
      console.error("Load error:", e);
      setOnline(false);
    } finally { setSyncing(false); }
  }

  function subscribeToRealtime() {
    supabase
      .channel("picks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "picks" }, payload => {
        const row = payload.new || payload.old;
        if (!row) return;
        if (payload.eventType === "DELETE") {
          setPicks(prev => {
            const next = { ...prev, [row.player]: { ...prev[row.player] } };
            delete next[row.player][row.game_id];
            return next;
          });
        } else {
          setPicks(prev => ({
            ...prev,
            [row.player]: { ...prev[row.player], [row.game_id]: row.team_name },
          }));
        }
      })
      .subscribe();
  }

  async function fetchLiveScores() {
    try {
      const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=50&limit=50");
      const d = await r.json();
      setLiveGames(d?.events?.slice(0, 8) || []);
    } catch {}
  }

  async function makePick(rn, ri, gi, teamName) {
    const gameId = `${rn}-${ri}-${gi}`;
    const old = picks[ap]?.[gameId];
    setPicks(prev => {
      const next = { ...prev, [ap]: { ...prev[ap], [gameId]: teamName } };
      if (old && old !== teamName) {
        const cleaned = { ...next[ap] };
        for (let r = ri + 1; r < 6; r++) {
          Object.keys(cleaned).forEach(k => {
            if (k.startsWith(`${rn}-${r}-`) && cleaned[k] === old) delete cleaned[k];
          });
        }
        next[ap] = cleaned;
      }
      return next;
    });
    burst();
    showToast(`${ap} picked ${teamName}!`);
    try {
      await supabase.from("picks").upsert(
        { player: ap, game_id: gameId, team_name: teamName, updated_at: new Date().toISOString() },
        { onConflict: "player,game_id" }
      );
      if (old && old !== teamName) {
        const toDelete = [];
        for (let r = ri + 1; r < 6; r++) {
          Object.keys(picks[ap] || {}).forEach(k => {
            if (k.startsWith(`${rn}-${r}-`) && picks[ap][k] === old) toDelete.push(k);
          });
        }
        if (toDelete.length > 0) {
          await supabase.from("picks").delete().eq("player", ap).in("game_id", toDelete);
        }
      }
      setOnline(true);
    } catch (e) { console.error("Upsert error:", e); setOnline(false); }
  }

  async function resetPlayer() {
    if (!window.confirm(`Reset ALL picks for ${ap}?`)) return;
    setPicks(prev => ({ ...prev, [ap]: {} }));
    try {
      await supabase.from("picks").delete().eq("player", ap);
      showToast(`${ap} picks cleared`);
    } catch (e) { console.error("Reset error:", e); }
  }

  function burst() {
    setConfetti(Array.from({ length: 28 }, (_, i) => ({
      id: Date.now() + i, x: 5 + Math.random() * 90,
      c: T.confettiColors[i % T.confettiColors.length], d: Math.random() * 0.4, star: Math.random() > 0.4,
    })));
    setTimeout(() => setConfetti([]), 1600);
  }

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const rounds = getRegionRounds(region, picks, ap);
  const scores = {};
  L.players.forEach(p => { scores[p] = Object.keys(picks[p] || {}).length; });
  const sorted = [...L.players].sort((a, b) => scores[b] - scores[a]);
  const maxSc = Math.max(...Object.values(scores), 1);

  const isDark = league === "guys";

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:T.font, overflowX:"hidden", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700;800&family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@400;500;600;700&family=DM+Sans:wght@500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:4px;}
        ::-webkit-scrollbar-track{background:${T.scrollTrack};}
        @keyframes fall{0%{transform:translateY(0) rotate(0deg) scale(1);opacity:1}100%{transform:translateY(160px) rotate(720deg) scale(0);opacity:0}}
        @keyframes sh{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toast{0%,80%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-10px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes twinkle{0%,100%{opacity:.15;transform:scale(.6)}50%{opacity:.6;transform:scale(1.1)}}
        @keyframes drift{0%,100%{transform:translateY(0px)}50%{transform:translateY(-12px)}}
        .tb{cursor:pointer;border:none;font-family:${T.font};font-weight:700;transition:all .18s ease;}
        .tb:hover{transform:translateY(-2px);} .tb:active{transform:scale(.95);}
        .tr{cursor:pointer;border:none;transition:all .15s ease;font-family:'DM Sans',sans-serif;}
        .tr:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,${isDark?".2":".06"})!important;} .tr:active{transform:scale(.97);}
        .glass{background:${T.card};backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid ${T.cardBorder};box-shadow:0 2px 16px rgba(0,0,0,${isDark?".15":".04"});}
      `}</style>

      {T.sparkle && <Sparkles />}

      {confetti.map(c => c.star ? (
        <svg key={c.id} viewBox="0 0 24 24" style={{ position:"fixed", top:"30%", left:`${c.x}%`, width:12, height:12, animation:`fall 1.2s ease-in ${c.d}s both`, zIndex:9999, pointerEvents:"none" }}>
          <path d="M12 2l2.1 6.5H21l-5.6 4.1 2.1 6.5L12 15l-5.5 4.1 2.1-6.5L3 8.5h6.9z" fill={c.c} />
        </svg>
      ) : (
        <div key={c.id} style={{ position:"fixed", top:"30%", left:`${c.x}%`, width:8, height:8, borderRadius:"50%", background:c.c, animation:`fall 1.2s ease-in ${c.d}s both`, zIndex:9999, pointerEvents:"none" }} />
      ))}

      {toast && <div style={{ position:"fixed", top:20, left:"50%", background:isDark?"rgba(10,14,23,.9)":"rgba(255,255,255,.9)", backdropFilter:"blur(12px)", border:`2px solid ${cl.bg}44`, borderRadius:isDark?8:50, padding:"10px 24px", fontFamily:T.font, fontSize:14, fontWeight:700, color:cl.bg, zIndex:9998, whiteSpace:"nowrap", animation:"toast 2.2s ease forwards", boxShadow:`0 4px 24px ${cl.glow}` }}>{toast}</div>}

      <div style={{ height:3, background:T.gradientBar, backgroundSize:"300%", animation:"sh 4s linear infinite", borderRadius:"0 0 2px 2px" }} />

      <div style={{ padding:"20px 20px 4px", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:isDark?"clamp(44px,11vw,90px)":"clamp(40px,10vw,80px)", fontWeight:800, letterSpacing:isDark?"6px":"3px", lineHeight:1, background:T.gradientTitle, backgroundSize:"300%", animation:"sh 5s linear infinite", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{L.name.toUpperCase()}</div>
        <div style={{ fontFamily:T.fontBody, fontSize:"clamp(10px,2.5vw,12px)", letterSpacing:"5px", color:T.subtle, marginTop:6, textTransform:"uppercase" }}>{L.sub}</div>
        <div style={{ position:"absolute", top:16, right:20, display:"flex", alignItems:"center", gap:6, fontFamily:T.fontBody, fontSize:11 }}>
          {syncing ? (<><div style={{ width:8, height:8, borderRadius:"50%", border:`2px solid ${T.accent2}`, borderTopColor:"transparent", animation:"spin .7s linear infinite" }} /><span style={{ color:T.subtle }}>syncing</span></>) : (<><div style={{ width:8, height:8, borderRadius:"50%", background:online?T.accent3:T.accent1, animation:"pulse 2s infinite" }} /><span style={{ color:online?T.accent3:T.accent1 }}>{online?"live":"offline"}</span></>)}
        </div>
      </div>

      {liveGames.length > 0 && (
        <div style={{ padding:"8px 20px", overflowX:"auto", whiteSpace:"nowrap", zIndex:1, position:"relative" }}>
          <div style={{ display:"inline-flex", gap:8 }}>
            {liveGames.map((g, i) => {
              const comp=g.competitions?.[0], h=comp?.competitors?.find(t=>t.homeAway==="home"), a=comp?.competitors?.find(t=>t.homeAway==="away"), live=g.status?.type?.state==="in";
              return (<div key={i} className="glass" style={{ display:"inline-block", borderRadius:isDark?8:12, padding:"6px 14px", fontFamily:T.fontBody, fontSize:11, minWidth:90, border:live?`1.5px solid ${T.accent1}66`:`1px solid ${T.cardBorder}` }}>
                {live && <div style={{ color:T.accent1, fontSize:8, letterSpacing:2, marginBottom:2, fontWeight:700 }}>{isDark?"● LIVE":"LIVE"}</div>}
                <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}><span style={{ color:T.muted }}>{a?.team?.abbreviation}</span><b style={{ color:T.text }}>{a?.score||"-"}</b></div>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}><span style={{ color:T.muted }}>{h?.team?.abbreviation}</span><b style={{ color:T.text }}>{h?.score||"-"}</b></div>
              </div>);
            })}
          </div>
        </div>
      )}

      <div style={{ padding:"14px 20px 8px", display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", zIndex:1, position:"relative" }}>
        {L.players.map(p => { const c=L.colors[p],active=ap===p; return (<button key={p} className="tb" onClick={()=>setAp(p)} style={{ background:active?c.bg:(isDark?"rgba(255,255,255,.06)":"rgba(255,255,255,.7)"), color:active?c.text:T.muted, border:active?"2px solid transparent":`2px solid ${T.cardHover}`, borderRadius:isDark?8:50, padding:isDark?"10px 28px":"10px 24px", fontSize:"clamp(14px,3.5vw,18px)", letterSpacing:isDark?"3px":"1px", transform:active?"translateY(-3px)":"translateY(0)", boxShadow:active?`0 6px 24px ${c.glow}`:`0 2px 8px rgba(0,0,0,${isDark?".15":".04"})`, backdropFilter:active?"none":"blur(8px)" }}>{p}</button>); })}
      </div>

      <div style={{ display:"flex", padding:"10px 20px 0", gap:6, justifyContent:"center", zIndex:1, position:"relative" }}>
        {["bracket","leaderboard"].map(t => (<button key={t} className="tb" onClick={()=>setTab(t)} style={{ padding:"10px 28px", fontSize:"clamp(12px,3vw,16px)", letterSpacing:isDark?"3px":"2px", background:tab===t?T.gradientTab:(isDark?"rgba(255,255,255,.04)":"rgba(255,255,255,.5)"), color:tab===t?"#fff":T.muted, borderRadius:isDark?6:50, border:tab===t?"none":`1.5px solid ${T.cardHover}`, boxShadow:tab===t?`0 4px 16px ${cl.glow}`:"none" }}>{t.toUpperCase()}</button>))}
      </div>
      <div style={{ height:1.5, background:T.divider, margin:"10px 20px 0", borderRadius:2 }} />

      {tab==="bracket" && (
        <div style={{ padding:"18px 20px", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
            {["East","West","South","Midwest"].map(r => (<button key={r} className="tb" onClick={()=>setRegion(r)} style={{ padding:"8px 20px", fontSize:"clamp(11px,2.8vw,14px)", letterSpacing:isDark?"2px":"1px", background:region===r?T.gradientRegion:(isDark?"rgba(255,255,255,.05)":"rgba(255,255,255,.6)"), color:region===r?"#fff":T.muted, borderRadius:isDark?6:50, border:region===r?"none":`1.5px solid ${T.cardHover}`, boxShadow:region===r?`0 3px 12px ${cl.glow}`:"none" }}>{isDark?r.toUpperCase():r}</button>))}
            <button className="tb" onClick={resetPlayer} style={{ marginLeft:"auto", padding:"7px 16px", fontSize:"clamp(10px,2.5vw,12px)", letterSpacing:"1px", background:`${T.accent1}14`, color:T.accent1, border:`1.5px solid ${T.accent1}44`, borderRadius:isDark?6:50 }}>Reset {ap}</button>
          </div>
          <div style={{ fontSize:"clamp(22px,6vw,38px)", fontWeight:800, letterSpacing:isDark?"4px":"2px", marginBottom:16, background:T.gradientRegionTitle, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{isDark?region.toUpperCase()+" REGION":region+" Region"}</div>
          <div style={{ overflowX:"auto", paddingBottom:16 }}>
            {(() => {
              const TEAM_H = 46;
              const GAME_GAP = 4;
              const MATCHUP_GAP = 12;
              const GAME_H = TEAM_H * 2 + GAME_GAP;
              const totalH = GAME_H * 8 + MATCHUP_GAP * 7;
              return (
              <div style={{ display:"flex", gap:10, minWidth:1050, alignItems:"stretch", height:totalH }}>
                {rounds.map((games, ri) => {
                  const gamesInRound = games.length;
                  const slotH = totalH / gamesInRound;
                  return (<div key={ri} style={{ flex:1, minWidth:ri===0?170:150, display:"flex", flexDirection:"column" }}>
                    <div style={{ fontFamily:T.fontBody, fontSize:10, letterSpacing:"1px", color:T.subtle, marginBottom:8, textAlign:"center", height:44, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontWeight:700, flexShrink:0 }}>{ROUND_NAMES[ri]}<br/><span style={{ color:T.muted, fontSize:8, letterSpacing:0, fontWeight:500 }}>{ROUND_DATES[ri]}</span><br/><span style={{ color:T.accent2, fontSize:9 }}>+{ROUND_PTS[ri]}pt</span></div>
                    <div style={{ display:"flex", flexDirection:"column", flex:1 }}>
                      {games.map((game, gi) => (
                        <div key={game.id} style={{ height:slotH, display:"flex", flexDirection:"column", justifyContent:"center", gap:GAME_GAP }}>
                          {[game.tA, game.tB].map((team, ti) => {
                            if (!team) return <div key={ti} style={{ height:TEAM_H, background:T.emptyBg, border:`1.5px dashed ${T.emptyBorder}`, borderRadius:isDark?6:12 }} />;
                            const mp=picks[ap]?.[game.id]===team.n, otherP=L.players.filter(p=>p!==ap&&picks[p]?.[game.id]===team.n);
                            const tc=getTeamColor(team.n), logo=getTeamLogo(team.n);
                            return (<button key={ti} className="tr" onClick={()=>makePick(region,ri,gi,team.n)} style={{ height:TEAM_H, background:mp?`linear-gradient(135deg,${cl.bg},${cl.bg}cc)`:T.teamBg, border:mp?`2px solid ${cl.bg}`:`1.5px solid ${T.teamBorder}`, borderLeft:mp?`2px solid ${cl.bg}`:`3.5px solid ${tc}`, borderRadius:isDark?6:12, padding:"6px 10px", display:"flex", alignItems:"center", gap:7, color:mp?cl.text:(isDark?"#ccc":"#5D4B5D"), width:"100%", boxShadow:mp?`0 3px 16px ${cl.glow}`:`0 1px 4px rgba(0,0,0,${isDark?".1":".03"})`, textAlign:"left", backdropFilter:mp?"none":"blur(8px)" }}>
                              {logo && <img src={logo} alt="" style={{ width:28, height:28, borderRadius:isDark?3:5, objectFit:"contain", flexShrink:0 }} />}
                              <span style={{ fontSize:10, fontWeight:800, background:mp?"rgba(255,255,255,.25)":T.seedBg, color:mp?"#fff":T.muted, borderRadius:5, padding:"2px 6px", minWidth:20, textAlign:"center", fontFamily:T.fontBody, flexShrink:0 }}>{team.s}</span>
                              <span style={{ fontSize:"clamp(11px,2.2vw,14px)", fontWeight:700, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{team.n}</span>
                              <div style={{ display:"flex", gap:3, flexShrink:0 }}>{otherP.map(o=><div key={o} title={o} style={{ width:7, height:7, borderRadius:"50%", background:L.colors[o].bg, boxShadow:`0 0 4px ${L.colors[o].glow}` }} />)}</div>
                              {mp && <span style={{ fontSize:12, flexShrink:0 }}>&#10003;</span>}
                            </button>);
                          })}
                        </div>
                      ))}
                    </div>
                  </div>);
                })}
              </div>
              );
            })()}
          </div>
          <div className="glass" style={{ marginTop:18, padding:"16px 20px", borderRadius:isDark?10:16, fontFamily:T.fontBody, fontSize:13, color:isDark?"#9CA3AF":"#7D6B7D", lineHeight:1.8 }}>
            <span style={{ color:T.accent2, letterSpacing:2, fontSize:11, fontWeight:700 }}>{isDark?"HOW TO PLAY":"How to Play"}  </span>
            {isDark
              ? "Select your name. Pick winners left to right. Dots show other players\u2019 picks. Syncs live."
              : "Tap your name above, then tap teams to pick your winners from left to right! Colored dots show what your friends picked. Everything syncs live across all your devices."}
            <div style={{ marginTop:6, fontSize:12, color:T.subtle }}>Points: R64 = 1 &middot; R32 = 2 &middot; Sweet 16 = 4 &middot; Elite 8 = 8 &middot; Final Four = 16 &middot; Champ = 32</div>
          </div>
        </div>
      )}

      {tab==="leaderboard" && (
        <div style={{ padding:"18px 20px", position:"relative", zIndex:1 }}>
          <div style={{ fontSize:"clamp(28px,8vw,52px)", fontWeight:800, letterSpacing:isDark?"4px":"2px", marginBottom:22, background:T.gradientLeaderboard, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{isDark?"STANDINGS":"Standings"}</div>
          {sorted.map((pl, idx) => {
            const c=L.colors[pl], s=scores[pl], pc=Object.keys(picks[pl]||{}).length;
            return (<div key={pl} className="glass" style={{ border:idx===0?`2px solid ${c.bg}66`:`1px solid ${T.cardBorder}`, borderRadius:isDark?12:20, padding:"18px 20px", marginBottom:12, position:"relative", overflow:"hidden", animation:`fu .3s ease ${idx*.07}s both` }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${(s/maxSc)*100}%`, background:`linear-gradient(90deg,${c.bg}15,transparent)`, transition:"width 1s ease" }} />
              <div style={{ display:"flex", alignItems:"center", gap:14, position:"relative" }}>
                <div style={{ fontSize:"clamp(20px,5vw,30px)" }}>{L.medals[idx] || ""}</div>
                <div style={{ width:48, height:48, borderRadius:isDark?8:"50%", background:`linear-gradient(135deg,${c.bg},${c.bg}bb)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"clamp(10px,2.5vw,14px)", color:c.text, fontWeight:800, boxShadow:`0 4px 20px ${c.glow}`, flexShrink:0, letterSpacing:1 }}>{pl.slice(0,2)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"clamp(20px,5vw,30px)", fontWeight:800, letterSpacing:isDark?"2px":"1px", color:idx===0?c.bg:T.text }}>{pl}</div>
                  <div style={{ fontFamily:T.fontBody, fontSize:12, color:T.muted, marginTop:2 }}>{pc} picks made</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"clamp(28px,7vw,44px)", fontWeight:800, color:c.bg, lineHeight:1 }}>{pc}</div>
                  <div style={{ fontFamily:T.fontBody, fontSize:10, color:T.subtle, letterSpacing:2, fontWeight:700 }}>PICKS</div>
                </div>
              </div>
              {pc>0 && <div style={{ marginTop:12, display:"flex", gap:6, flexWrap:"wrap", fontFamily:T.fontBody, fontSize:11 }}>
                {Object.entries(picks[pl]||{}).slice(0,7).map(([k,tn])=><span key={k} style={{ background:`${c.bg}15`, border:`1.5px solid ${c.bg}33`, borderRadius:isDark?4:50, padding:"3px 12px", color:c.bg, fontWeight:600 }}>{tn}</span>)}
                {pc>7&&<span style={{ color:T.subtle, padding:"3px 0" }}>+{pc-7} more</span>}
              </div>}
            </div>);
          })}
          <div className="glass" style={{ marginTop:18, padding:"18px 20px", borderRadius:isDark?12:20, fontFamily:T.fontBody, fontSize:13, color:isDark?"#9CA3AF":"#7D6B7D", lineHeight:1.9 }}>
            <div style={{ color:T.accent2, letterSpacing:"2px", fontSize:12, marginBottom:8, fontWeight:700 }}>{isDark?"KEY DATES":"Key Dates"}</div>
            <div><span style={{ color:T.accent1, fontWeight:700 }}>First Four:</span> Mar 17&ndash;18</div>
            <div><span style={{ color:T.accent1, fontWeight:700 }}>Round of 64:</span> Mar 19&ndash;20</div>
            <div><span style={{ color:T.accent1, fontWeight:700 }}>Round of 32:</span> Mar 21&ndash;22</div>
            <div><span style={{ color:T.accent1, fontWeight:700 }}>Sweet 16 / Elite 8:</span> Mar 27&ndash;30</div>
            <div><span style={{ color:T.accent1, fontWeight:700 }}>Final Four:</span> Apr 4 &middot; Indianapolis</div>
            <div><span style={{ color:T.accent1, fontWeight:700 }}>Championship:</span> Apr 6</div>
            <div style={{ marginTop:10, color:T.subtle, fontSize:12 }}>Picks sync live across all devices. Scores refresh every 30s.</div>
          </div>
        </div>
      )}

      <div style={{ textAlign:"center", padding:"24px", fontFamily:T.fontBody, fontSize:10, color:isDark?"#1F2937":"#E0D0E0", letterSpacing:"3px", position:"relative", zIndex:1 }}>{L.name.toUpperCase()} &middot; MARCH MADNESS 2026</div>
    </div>
  );
}
