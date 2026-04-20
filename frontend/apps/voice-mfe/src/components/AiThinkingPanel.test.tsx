import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AiThinkingPanel } from './AiThinkingPanel';

describe('AiThinkingPanel', () => {
  it('renders nothing when no content and not streaming', () => {
    const { container } = render(
      <AiThinkingPanel thinkingText="" isStreaming={false} isDone={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows AI Clinical Reasoning header when streaming', () => {
    render(
      <AiThinkingPanel thinkingText="Analyzing symptoms…" isStreaming={true} isDone={false} />,
    );
    expect(screen.getByText('AI Clinical Reasoning')).toBeInTheDocument();
  });

  it('shows Live chip while streaming', () => {
    render(
      <AiThinkingPanel thinkingText="Processing…" isStreaming={true} isDone={false} />,
    );
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('shows Complete chip when done', () => {
    render(
      <AiThinkingPanel thinkingText="Done." isStreaming={false} isDone={true} />,
    );
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('renders streaming text content', () => {
    const text = 'Patient has fever and cough — ruling out pneumonia';
    render(
      <AiThinkingPanel thinkingText={text} isStreaming={true} isDone={false} />,
    );
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders when only thinkingText is provided (not streaming, not done)', () => {
    render(
      <AiThinkingPanel thinkingText="Some reasoning text" isStreaming={false} isDone={false} />,
    );
    // Component should render because thinkingText is truthy
    expect(screen.getByText('AI Clinical Reasoning')).toBeInTheDocument();
  });
});
