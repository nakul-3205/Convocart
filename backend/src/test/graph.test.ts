import { describe, it, expect } from 'vitest';
import { normalizeMessageContent, toSafeMessages } from '../agent/graph';

describe('normalizeMessageContent', () => {
  it('flattens array content into a plain string', () => {
    const input = [{ content: [{ text: 'hello' }, { text: 'world' }], role: 'assistant' }];
    expect(normalizeMessageContent(input)[0].content).toBe('hello world');
  });

  it('converts null content to an empty string', () => {
    const input = [{ content: null, role: 'assistant' }];
    expect(normalizeMessageContent(input)[0].content).toBe('');
  });

  it('leaves plain string content untouched', () => {
    const input = [{ content: 'already fine', role: 'user' }];
    expect(normalizeMessageContent(input)[0].content).toBe('already fine');
  });

  it('preserves tool_calls — this is the exact thing that must never break again', () => {
    const input = [{ content: 'text', role: 'assistant', tool_calls: [{ id: 'call_1', name: 'search_products' }] }];
    expect(normalizeMessageContent(input)[0].tool_calls).toEqual([{ id: 'call_1', name: 'search_products' }]);
  });
});

describe('toSafeMessages', () => {
  it('converts a tool message to role user, never role system (Gemini rejects mid-array system messages)', () => {
    const input = [{ _getType: () => 'tool', content: '{"result":"ok"}', name: 'search_products' }];
    const result = toSafeMessages(input);
    expect(result[0].role).toBe('user');
    expect(result[0].content).toContain('search_products');
  });

  it('maps human messages to role user and preserves content', () => {
    const input = [{ _getType: () => 'human', content: 'show me shoes' }];
    expect(toSafeMessages(input)[0]).toEqual({ role: 'user', content: 'show me shoes' });
  });

  it('falls back to a placeholder for genuinely empty content, never an empty string', () => {
    const input = [{ _getType: () => 'ai', content: '' }];
    expect(toSafeMessages(input)[0].content).toBe('(no text content)');
  });
});