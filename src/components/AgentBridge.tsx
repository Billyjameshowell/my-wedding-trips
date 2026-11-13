'use client';

import { createAgent, registerTools } from '@ui-sdk/react/agent';
import { useEffect } from 'react';

const agent =
  typeof window === 'undefined'
    ? null
    : createAgent({
        allow: (step) => !step.confirm,
      });

export function AgentBridge() {
  useEffect(() => {
    if (!agent) return;
    return registerTools(agent, { allow: () => true });
  }, []);

  return null;
}
