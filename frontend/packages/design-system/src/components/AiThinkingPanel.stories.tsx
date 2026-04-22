import type { Meta, StoryObj } from '@storybook/react';
import { AiThinkingPanel } from './AiThinkingPanel';

const SAMPLE_REASONING =
  'Patient presents with chest pain radiating to the left arm for 30 minutes. ' +
  'ECG shows ST-elevation in leads II, III, and aVF consistent with inferior STEMI. ' +
  'Troponin I elevated at 2.4 ng/mL. Recommend immediate cath lab activation. ' +
  'Initiating dual antiplatelet therapy and IV heparin per STEMI protocol.';

const meta = {
  title: 'AI/AiThinkingPanel',
  component: AiThinkingPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Real-time AI reasoning visualization panel. Displays streaming Azure OpenAI tokens ' +
          'as they arrive via Azure Web PubSub, giving clinicians full visibility into the ' +
          "AI's clinical decision process. Returns null when no text, no streaming, and not done.",
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    thinkingText: { control: 'text' },
    isStreaming: { control: 'boolean' },
    isDone: { control: 'boolean' },
  },
} satisfies Meta<typeof AiThinkingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Panel is actively streaming tokens — shows Live chip and blinking cursor */
export const Streaming: Story = {
  args: {
    thinkingText:
      'Patient presents with chest pain radiating to the left arm for 30 minutes. ' +
      'ECG shows ST-elevation in leads II, III, and aVF...',
    isStreaming: true,
    isDone: false,
  },
};

/** Stream has completed — shows Complete chip, full reasoning text */
export const Complete: Story = {
  args: {
    thinkingText: SAMPLE_REASONING,
    isStreaming: false,
    isDone: true,
  },
};

/** Panel with a short reasoning snippet, streaming in progress */
export const ShortStreaming: Story = {
  args: {
    thinkingText: 'Analysing vitals…',
    isStreaming: true,
    isDone: false,
  },
};

/** Nothing to show — component renders null */
export const Hidden: Story = {
  args: {
    thinkingText: '',
    isStreaming: false,
    isDone: false,
  },
};
