import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text,
  Heading,
  Stack,
  Inline,
  Box,
  Lozenge,
  ProgressBar,
  DynamicTable,
  SectionMessage,
  Spinner,
  xcss,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const cardStyle = xcss({
  backgroundColor: 'elevation.surface.sunken',
  padding: 'space.150',
  borderRadius: 'border.radius',
  minWidth: '120px',
});

const labelStyle = xcss({
  color: 'color.text.subtlest',
});

function MetricCard({ label, value, suffix }) {
  return (
    <Box xcss={cardStyle}>
      <Stack space="space.050">
        <Text xcss={labelStyle}>{label}</Text>
        <Text>
          {value}
          {suffix ? ` ${suffix}` : ''}
        </Text>
      </Stack>
    </Box>
  );
}

function formatGoal(goalType) {
  if (!goalType) return '—';
  return goalType.replace(/_/g, ' ');
}

const App = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const context = await view.getContext();
        const issueKey = context?.extension?.issue?.key;
        const result = await invoke('getCheckInStats', { issueKey });
        setData(result);
      } catch (error) {
        console.error(error);
        setData({
          status: 'error',
          message: 'Failed to load LeanOut check-in stats.',
          stats: null,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Stack space="space.100" alignInline="center">
        <Spinner />
        <Text>Loading LeanOut stats…</Text>
      </Stack>
    );
  }

  if (!data || data.status === 'error') {
    return (
      <SectionMessage appearance="error">
        <Text>{data?.message || 'Something went wrong.'}</Text>
      </SectionMessage>
    );
  }

  if (data.status === 'not_found') {
    return (
      <SectionMessage appearance="warning">
        <Text>{data.message}</Text>
      </SectionMessage>
    );
  }

  const stats = data.stats;
  if (!stats) {
    return (
      <SectionMessage appearance="information">
        <Text>No check-in data available.</Text>
      </SectionMessage>
    );
  }

  const tableHead = {
    cells: [
      { key: 'date', content: 'Date' },
      { key: 'weight', content: 'Weight' },
      { key: 'compliance', content: 'Compliance' },
      { key: 'energy', content: 'Energy' },
      { key: 'workout', content: 'Workout' },
    ],
  };

  const tableRows = (stats.recentCheckIns || []).map((row) => ({
    key: row.date,
    cells: [
      { key: 'date', content: row.date },
      { key: 'weight', content: `${row.weightLbs} lbs` },
      { key: 'compliance', content: `${row.compliance}/10` },
      { key: 'energy', content: `${row.energy}/10` },
      {
        key: 'workout',
        content: row.workoutCompleted ? (
          <Lozenge appearance="success">Yes</Lozenge>
        ) : (
          <Lozenge appearance="default">No</Lozenge>
        ),
      },
    ],
  }));

  return (
    <Stack space="space.200">
      {data.status === 'unconfigured' && (
        <SectionMessage appearance="information">
          <Text>{data.message}</Text>
        </SectionMessage>
      )}

      <Stack space="space.100">
        <Inline space="space.100" alignBlock="center">
          <Heading size="small">{stats.user.name}</Heading>
          <Lozenge appearance="inprogress">{formatGoal(stats.user.goalType)}</Lozenge>
        </Inline>
        <Text xcss={labelStyle}>{stats.user.email}</Text>
      </Stack>

      <Inline space="space.100" shouldWrap>
        <MetricCard label="Streak" value={stats.gamification.currentStreak} suffix="days" />
        <MetricCard label="Best streak" value={stats.gamification.longestStreak} suffix="days" />
        <MetricCard label="Level" value={stats.gamification.level} />
        <MetricCard label="XP" value={stats.gamification.xp} />
      </Inline>

      <Stack space="space.075">
        <Text xcss={labelStyle}>Level progress</Text>
        <ProgressBar value={stats.gamification.xpProgressPct} />
      </Stack>

      {stats.latest && (
        <Stack space="space.100">
          <Heading size="xsmall">Latest check-in ({stats.latest.date})</Heading>
          <Inline space="space.100" shouldWrap>
            <MetricCard label="Weight" value={stats.latest.weightLbs} suffix="lbs" />
            <MetricCard label="Compliance" value={`${stats.latest.compliance}/10`} />
            <MetricCard label="Energy" value={`${stats.latest.energy}/10`} />
            <MetricCard label="Hunger" value={`${stats.latest.hunger}/10`} />
            {stats.latest.steps != null && (
              <MetricCard label="Steps" value={stats.latest.steps.toLocaleString()} />
            )}
          </Inline>
        </Stack>
      )}

      <Stack space="space.100">
        <Heading size="xsmall">7-day averages</Heading>
        <Inline space="space.100" shouldWrap>
          <MetricCard
            label="Compliance"
            value={stats.averages7d.compliance ?? '—'}
            suffix={stats.averages7d.compliance != null ? '/10' : ''}
          />
          <MetricCard
            label="Energy"
            value={stats.averages7d.energy ?? '—'}
            suffix={stats.averages7d.energy != null ? '/10' : ''}
          />
          <MetricCard
            label="Hunger"
            value={stats.averages7d.hunger ?? '—'}
            suffix={stats.averages7d.hunger != null ? '/10' : ''}
          />
          <MetricCard label="Workouts" value={stats.averages7d.workouts} suffix="sessions" />
        </Inline>
      </Stack>

      {(stats.recentCheckIns || []).length > 0 && (
        <Stack space="space.100">
          <Heading size="xsmall">Recent check-ins</Heading>
          <DynamicTable head={tableHead} rows={tableRows} />
        </Stack>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
