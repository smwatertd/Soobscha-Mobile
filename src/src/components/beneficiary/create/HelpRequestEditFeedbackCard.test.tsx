import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer from 'react-test-renderer';
import { HelpRequestEditFeedbackCard } from './HelpRequestEditFeedbackCard';

vi.mock('react-native', () => {
  const ReactLib = require('react');
  return {
    View: ({ children }: { children?: React.ReactNode }) => ReactLib.createElement('View', null, children),
    Text: ({ children }: { children?: React.ReactNode }) => ReactLib.createElement('Text', null, children),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});

vi.mock('../../Icon', () => ({
  Icon: () => null,
}));

describe('HelpRequestEditFeedbackCard', () => {
  it('renders explicit return reason and author line when returnedAt is valid', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HelpRequestEditFeedbackCard
          feedback={{
            returnReason: 'Нужно уточнить документы',
            rejectionReason: null,
            returnedAt: '2026-05-27T10:30:00.000Z',
          }}
        />,
      );
    });
    const textNodes = renderer!.root.findAll((node) => node.type === 'Text');
    const text = textNodes.flatMap((node) => node.props.children).join(' ');
    expect(text).toContain('Партнёр попросил исправить');
    expect(text).toContain('Нужно уточнить документы');
    expect(text).toContain('Партнёр «Добро»');
  });

  it('renders fallback text when return reason is missing', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HelpRequestEditFeedbackCard
          feedback={{
            returnReason: null,
            rejectionReason: null,
            returnedAt: null,
          }}
        />,
      );
    });
    const textNodes = renderer!.root.findAll((node) => node.type === 'Text');
    const text = textNodes.flatMap((node) => node.props.children).join(' ');
    expect(text).toContain('Партнёр попросил уточнить детали — исправьте заявку и отправьте снова.');
    expect(text).not.toContain('Партнёр «Добро»');
  });
});
