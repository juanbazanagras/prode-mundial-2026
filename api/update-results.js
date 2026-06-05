const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const FOOTBALL_API_TOKEN = process.env.FOOTBALL_API_TOKEN;

// World Cup 2026 competition ID en football-data.org
const WC_2026_ID = 2000;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch today's matches from football-data.org
    const today = new Date().toISOString().split('T')[0];
    const apiRes = await fetch(
      `https://api.football-data.org/v4/competitions/${WC_2026_ID}/matches?status=FINISHED&dateFrom=${today}&dateTo=${today}`,
      { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } }
    );

    if (!apiRes.ok) {
      const err = await apiRes.text();
      return res.status(500).json({ error: `API error: ${err}` });
    }

    const data = await apiRes.json();
    const matches = data.matches || [];

    if (matches.length === 0) {
      return res.status(200).json({ message: 'No finished matches today', updated: 0 });
    }

    // Get our fixtures from Supabase
    const { data: fixtures } = await supabase
      .from('fixtures')
      .select('*')
      .eq('status', 'pending');

    let updated = 0;
    for (const match of matches) {
      if (match.status !== 'FINISHED') continue;

      const homeGoals = match.score.fullTime.home;
      const awayGoals = match.score.fullTime.away;
      const homeTeam = match.homeTeam.name;
      const awayTeam = match.awayTeam.name;

      // Find matching fixture by team names (fuzzy match)
      const fixture = fixtures?.find(f => {
        const fHome = f.home.toLowerCase();
        const fAway = f.away.toLowerCase();
        const mHome = homeTeam.toLowerCase();
        const mAway = awayTeam.toLowerCase();
        return (fHome.includes(mHome.split(' ')[0]) || mHome.includes(fHome.split(' ')[0])) &&
               (fAway.includes(mAway.split(' ')[0]) || mAway.includes(fAway.split(' ')[0]));
      });

      if (fixture) {
        await supabase
          .from('fixtures')
          .update({ home_score: homeGoals, away_score: awayGoals, status: 'finished' })
          .eq('id', fixture.id);
        updated++;
      }
    }

    return res.status(200).json({ message: `Updated ${updated} fixtures`, updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
