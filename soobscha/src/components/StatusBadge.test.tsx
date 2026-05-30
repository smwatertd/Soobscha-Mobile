import React from 'react';
import { describe, expect, it } from 'vitest';
import TestRenderer from 'react-test-renderer';
import { vi } from 'vitest';
import { StatusBadge } from './StatusBadge';

vi.mock('react-native', () => {
  const ReactLib = require('react');
  return {
    View: ({ children }: { children?: React.ReactNode }) => ReactLib.createElement('View', null, children),
    Text: ({ children }: { children?: React.ReactNode }) => ReactLib.createElement('Text', null, children),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});

describe('StatusBadge', () => {
  it('renders mapped label for known status', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<StatusBadge status="funded" />);
    });
    const textNodes = renderer!.root.findAll((node) => node.type === 'Text');
    const text = textNodes.flatMap((node) => node.props.children).join(' ');
    expect(text).toContain('Собрано');
  });

  it('renders human label for API status code', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<StatusBadge status="VOLUNTEER_RECRUITING" />);
    });
    const textNodes = renderer!.root.findAll((node) => node.type === 'Text');
    const text = textNodes.flatMap((node) => node.props.children).join(' ');
    expect(text).toContain('Идёт набор');
  });

  it('renders humanized label for unknown status', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<StatusBadge status="SOME_NEW_STATUS" />);
    });
    const textNodes = renderer!.root.findAll((node) => node.type === 'Text');
    const text = textNodes.flatMap((node) => node.props.children).join(' ');
    expect(text).toContain('Some New Status');
  });

  it('renders label for report on review', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<StatusBadge status="REPORT_ON_REVIEW" />);
    });
    const textNodes = renderer!.root.findAll((node) => node.type === 'Text');
    const text = textNodes.flatMap((node) => node.props.children).join(' ');
    expect(text).toContain('Отчёт на проверке');
  });
});
