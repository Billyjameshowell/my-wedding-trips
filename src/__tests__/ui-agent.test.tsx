// @vitest-environment jsdom
import './ui-setup';
import { render, screen } from '@testing-library/react';
import { createAgent } from '@ui-sdk/react/agent';
import { vi } from 'vitest';
import Dashboard from '@/app/page';
import LoginPage from '@/app/login/page';
import WeddingDetailPage from '@/app/wedding/[id]/page';

const { addWedding, updateStatus, updateDetails, removeWedding } = vi.hoisted(() => ({
  addWedding: vi.fn(async () => true),
  updateStatus: vi.fn(),
  updateDetails: vi.fn(),
  removeWedding: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'w1' }),
}));

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(async () => ({ error: null })),
      signUp: vi.fn(async () => ({ error: null })),
    },
  }),
  getSupabaseConfigurationError: () => null,
  isSupabaseConfigured: () => false,
}));

vi.mock('@/lib/useWeddings', () => ({
  useWeddings: () => ({
    weddings: [
      {
        id: 'w1',
        coupleName: 'Sarah & Mike',
        date: '2026-12-12',
        location: 'Austin, TX',
        venue: 'The Grand Ballroom',
        flightStatus: 'watching',
        hotelStatus: 'booked',
        giftStatus: 'not_started',
        createdAt: '2026-09-01T00:00:00.000Z',
        color: '#E8917F',
      },
    ],
    user: null,
    loading: false,
    hasSupabase: false,
    error: null,
    addWedding,
    updateStatus,
    updateDetails,
    removeWedding,
    savePriceCheck: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
    refresh: vi.fn(),
  }),
}));

let approve = false;
const agent = createAgent({
  allow: (step) => !step.confirm || approve,
});

function visibleComponents() {
  return agent.snapshot().filter((entry) => !entry.offPage && entry.component !== 'more');
}

test('an agent can name every control and add a wedding', async () => {
  addWedding.mockClear();
  updateStatus.mockClear();
  render(<Dashboard />);

  const components = visibleComponents();
  for (const entry of components) {
    expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
  }
  const labels = components.map((entry) => entry.label);
  for (const label of [
    'Add a wedding',
    "Who's getting married?",
    'Wedding date',
    'Location',
    'Venue',
    'Add flight details',
    'Save wedding',
    'Flight status for Sarah & Mike',
    'Hotel status for Sarah & Mike',
    'Gift status for Sarah & Mike',
    'Actions for Sarah & Mike',
  ]) {
    expect(labels, `${label} is missing`).toContain(label);
  }

  const result = await agent.act({
    steps: [
      { ref: "Who's getting married?", action: 'setValue', args: ['Ada & Grace'] },
      { ref: 'Wedding date', action: 'setValue', args: ['2027-06-01'] },
      { ref: 'Location', action: 'setValue', args: ['Lisbon'] },
      { ref: 'Flight status for Sarah & Mike', action: 'setValue', args: ['Done'] },
      { ref: 'Save wedding', action: 'press' },
    ],
  });

  expect(result.ok, result.error?.message).toBe(true);
  expect(addWedding).toHaveBeenCalledWith(
    expect.objectContaining({
      coupleName: 'Ada & Grace',
      date: '2027-06-01',
      location: 'Lisbon',
    })
  );
  expect(updateStatus).toHaveBeenCalledWith('w1', 'flightStatus', 'done');
});

test('removing a wedding waits for a person', async () => {
  removeWedding.mockClear();
  approve = false;
  render(<Dashboard />);

  const opened = await agent.act({
    steps: [
      { ref: 'Actions for Sarah & Mike', action: 'press', args: ['Remove wedding'] },
    ],
  });
  expect(opened.ok, opened.error?.message).toBe(true);

  const refused = await agent.act({
    steps: [{ ref: 'Remove Sarah & Mike?', action: 'press', args: ['Remove forever'] }],
  });
  expect(refused.ok, refused.error?.message).toBe(false);
  expect(removeWedding).not.toHaveBeenCalled();

  approve = true;
  const allowed = await agent.act({
    steps: [
      { ref: 'Actions for Sarah & Mike', action: 'press', args: ['Remove wedding'] },
      { ref: 'Remove Sarah & Mike?', action: 'press', args: ['Remove forever'] },
    ],
  });
  expect(allowed.ok, allowed.error?.message).toBe(true);
  expect(removeWedding).toHaveBeenCalledWith('w1');
});

test('an agent edit of notes is saved', async () => {
  updateDetails.mockClear();
  render(<WeddingDetailPage />);

  const result = await agent.act({
    steps: [{ ref: 'Notes', action: 'setValue', args: ['Bring a jacket'] }],
  });

  expect(result.ok, result.error?.message).toBe(true);
  expect(updateDetails).toHaveBeenCalledWith('w1', { notes: 'Bring a jacket' });
});

test('an agent can fill the sign-in form', async () => {
  render(<LoginPage />);

  const components = visibleComponents();
  for (const entry of components) {
    expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
  }
  const labels = components.map((entry) => entry.label);
  for (const label of ['Account mode', 'Email', 'Password', 'Continue']) {
    expect(labels, `${label} is missing`).toContain(label);
  }

  const result = await agent.act({
    steps: [
      { ref: 'Email', action: 'setValue', args: ['ada@example.com'] },
      { ref: 'Password', action: 'setValue', args: ['secret1'] },
      { ref: 'Account mode', action: 'setValue', args: ['Create account'] },
    ],
  });

  expect(result.ok, result.error?.message).toBe(true);
  expect(screen.getByLabelText<HTMLInputElement>('Email').value).toBe('ada@example.com');
  expect(screen.getByRole('heading', { name: 'Create your account' })).toBeTruthy();
});
