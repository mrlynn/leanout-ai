import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

const DEMO_STATS = {
  user: { name: 'Demo User', email: 'demo@leanout.ai', goalType: 'lose_fat' },
  gamification: { xp: 420, level: 3, xpProgressPct: 65, currentStreak: 5, longestStreak: 12 },
  latest: {
    date: new Date().toISOString().slice(0, 10),
    weightLbs: 185.4,
    compliance: 8,
    energy: 7,
    hunger: 4,
    steps: 9200,
    workoutCompleted: true,
  },
  averages7d: { compliance: 7.8, energy: 6.5, hunger: 5.1, workouts: 4 },
  recentCheckIns: [
    { date: '2026-06-10', weightLbs: 185.4, compliance: 8, energy: 7, hunger: 4, steps: 9200, workoutCompleted: true },
    { date: '2026-06-09', weightLbs: 186.0, compliance: 9, energy: 8, hunger: 3, steps: 10400, workoutCompleted: false },
    { date: '2026-06-08', weightLbs: 186.2, compliance: 7, energy: 6, hunger: 5, steps: 7800, workoutCompleted: true },
  ],
};

async function getReporterEmail(issueKey) {
  const issueRes = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=reporter`,
  );
  if (!issueRes.ok) {
    throw new Error(`Failed to load issue ${issueKey}: ${issueRes.status}`);
  }

  const issue = await issueRes.json();
  const accountId = issue?.fields?.reporter?.accountId;
  if (!accountId) return null;

  const emailRes = await api.asUser().requestJira(
    route`/rest/api/3/user/email?accountId=${accountId}`,
  );
  if (!emailRes.ok) {
    throw new Error(`Failed to load reporter email: ${emailRes.status}`);
  }

  const emailData = await emailRes.json();
  return emailData?.email ?? null;
}

async function fetchLeanOutStats(email) {
  const baseUrl = process.env.LEANOUT_API_URL;
  const apiKey = process.env.LEANOUT_API_KEY;

  if (!baseUrl || !apiKey) {
    return { mode: 'demo', stats: DEMO_STATS };
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/forge/check-in-stats?email=${encodeURIComponent(email)}`;
  const response = await api.fetch(url, {
    headers: {
      'x-leanout-forge-key': apiKey,
      Accept: 'application/json',
    },
  });

  if (response.status === 404) {
    return { mode: 'not_found', stats: null };
  }

  if (!response.ok) {
    throw new Error(`LeanOut API error: ${response.status}`);
  }

  const stats = await response.json();
  return { mode: 'live', stats };
}

resolver.define('getCheckInStats', async (req) => {
  const issueKey = req.payload?.issueKey || req.context?.extension?.issue?.key;

  if (!issueKey) {
    return {
      status: 'error',
      message: 'No issue key in context.',
      stats: null,
    };
  }

  try {
    const reporterEmail = await getReporterEmail(issueKey);

    if (!reporterEmail) {
      return {
        status: 'error',
        message: 'Could not resolve the issue reporter email.',
        issueKey,
        stats: null,
      };
    }

    const result = await fetchLeanOutStats(reporterEmail);

    if (result.mode === 'not_found') {
      return {
        status: 'not_found',
        message: `No LeanOut account for ${reporterEmail}.`,
        reporterEmail,
        issueKey,
        stats: null,
      };
    }

    if (result.mode === 'demo') {
      return {
        status: 'unconfigured',
        message: 'Showing demo data. Set LEANOUT_API_URL and LEANOUT_API_KEY Forge variables to connect live stats.',
        reporterEmail,
        issueKey,
        stats: result.stats,
      };
    }

    return {
      status: 'ok',
      reporterEmail,
      issueKey,
      stats: result.stats,
    };
  } catch (error) {
    console.error('getCheckInStats failed', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to load check-in stats.',
      issueKey,
      stats: null,
    };
  }
});

export const handler = resolver.getDefinitions();
