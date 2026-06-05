export const generateGroupFixtures = () => {
  const fixtures = [];
  let id = 1;
  const groupDates = {
    A: "2026-06-11", B: "2026-06-11", C: "2026-06-12", D: "2026-06-12",
    E: "2026-06-13", F: "2026-06-13", G: "2026-06-14", H: "2026-06-14",
    I: "2026-06-15", J: "2026-06-15", K: "2026-06-16", L: "2026-06-16",
  };
  Object.entries(GROUPS).forEach(([group, teams]) => {
    const pairs = [];
    for (let i = 0; i < teams.length; i++)
      for (let j = i + 1; j < teams.length; j++)
        pairs.push([teams[i], teams[j]]);
    const rounds = [[pairs[0], pairs[5]], [pairs[1], pairs[4]], [pairs[2], pairs[3]]];
    rounds.forEach((round, ri) => {
      round.forEach(([home, away]) => {
        const d = new Date(groupDates[group]);
        d.setDate(d.getDate() + ri * 4);
        fixtures.push({ id: id++, phase: "Grupos", group, home, away, date: d.toISOString().split("T")[0], time: "18:00", home_score: null, away_score: null, status: "pending" });
      });
    });
  });
  return fixtures;
};

export const generateKnockoutFixtures = () => {
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
    for (let i = 0; i < count / 2; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      ko.push({ id: id++, phase, group: null, home: "TBD", away: "TBD", date: d.toISOString().split("T")[0], time: "18:00", home_score: null, away_score: null, status: "pending" });
    }
  });
  return ko;
};

export const INITIAL_FIXTURES = [...generateGroupFixtures(), ...generateKnockoutFixtures()];

export const calcScore = (pred, homeScore, awayScore) => {
  if (pred.home_score === null || pred.away_score === null) return 0;
  if (pred.home_score === homeScore && pred.away_score === awayScore) return 3;
  const real = homeScore > awayScore ? "H" : homeScore < awayScore ? "A" : "D";
  const p = pred.home_score > pred.away_score ? "H" : pred.home_score < pred.away_score ? "A" : "D";
  return real === p ? 1 : 0;
};

export const PHASES = ["Grupos", "Octavos", "Cuartos", "Semifinal", "Tercer puesto", "Final"];
export const GROUP_KEYS = Object.keys(GROUPS);
