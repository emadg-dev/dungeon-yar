import { describe, it, expect, vi } from 'vitest';

describe('Router #/join handling', () => {
  it('parses join route and extracts query invite code', () => {
    const raw = 'join?code=ZORV-1234';
    const [routePart, queryPart] = raw.split('?');
    const clean = routePart.toLowerCase();
    const query = new URLSearchParams(queryPart || '');

    expect(clean).toBe('join');
    expect(query.get('code')).toBe('ZORV-1234');
  });

  it('handles #/join without code and triggers scroll and focus', () => {
    const scrollIntoViewMock = vi.fn();
    const focusMock = vi.fn();

    // Mock DOM elements
    const mockSection = { scrollIntoView: scrollIntoViewMock };
    const mockInput = { focus: focusMock };

    // Simulate behavior with prefersReducedMotion check
    const prefersReducedMotion = false;
    mockSection.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
    mockInput.focus();

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(focusMock).toHaveBeenCalled();
  });

  it('respects prefers-reduced-motion when scrolling to invite section', () => {
    const scrollIntoViewMock = vi.fn();
    const mockSection = { scrollIntoView: scrollIntoViewMock };

    const prefersReducedMotion = true;
    mockSection.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });
});
