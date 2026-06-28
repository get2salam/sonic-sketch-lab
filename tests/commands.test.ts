import { describe, it, expect, vi } from 'vitest';
import { CommandRegistry, registerCommands, registry } from '../src/commands.js';

describe('CommandRegistry', () => {
  it('registers and retrieves a command', () => {
    const reg = new CommandRegistry();
    const action = vi.fn();
    reg.register({ id: 'test.cmd', label: 'Test', description: 'A test', category: 'Test', action });
    expect(reg.get('test.cmd')).toBeDefined();
    expect(reg.get('test.cmd')!.label).toBe('Test');
  });

  it('throws on duplicate registration', () => {
    const reg = new CommandRegistry();
    const action = vi.fn();
    reg.register({ id: 'test.dup', label: 'X', description: '', category: 'X', action });
    expect(() =>
      reg.register({ id: 'test.dup', label: 'Y', description: '', category: 'Y', action }),
    ).toThrow();
  });

  it('getAll returns all registered commands', () => {
    const reg = new CommandRegistry();
    reg.register({ id: 'a', label: 'A', description: '', category: 'X', action: vi.fn() });
    reg.register({ id: 'b', label: 'B', description: '', category: 'X', action: vi.fn() });
    expect(reg.getAll()).toHaveLength(2);
  });

  it('unregister removes a command', () => {
    const reg = new CommandRegistry();
    reg.register({ id: 'del', label: 'D', description: '', category: 'X', action: vi.fn() });
    reg.unregister('del');
    expect(reg.get('del')).toBeUndefined();
  });

  it('search filters by label', () => {
    const reg = new CommandRegistry();
    reg.register({ id: 'play', label: 'Play Track', description: 'Start playback', category: 'Transport', action: vi.fn() });
    reg.register({ id: 'stop', label: 'Stop', description: 'Stop playback', category: 'Transport', action: vi.fn() });
    const results = reg.search('play');
    expect(results.some((c) => c.id === 'play')).toBe(true);
  });

  it('search with empty string returns all commands', () => {
    const reg = new CommandRegistry();
    reg.register({ id: 'c1', label: 'C1', description: '', category: 'X', action: vi.fn() });
    reg.register({ id: 'c2', label: 'C2', description: '', category: 'X', action: vi.fn() });
    expect(reg.search('')).toHaveLength(2);
  });

  it('search is case-insensitive', () => {
    const reg = new CommandRegistry();
    reg.register({ id: 'preset.load', label: 'Load Preset', description: '', category: 'Presets', action: vi.fn() });
    expect(reg.search('PRESET').length).toBeGreaterThan(0);
  });

  it('execute calls the action and returns true', async () => {
    const reg = new CommandRegistry();
    const action = vi.fn();
    reg.register({ id: 'exec.test', label: 'E', description: '', category: 'X', action });
    const result = await reg.execute('exec.test');
    expect(result).toBe(true);
    expect(action).toHaveBeenCalledOnce();
  });

  it('execute returns false for unknown id', async () => {
    const reg = new CommandRegistry();
    expect(await reg.execute('nonexistent')).toBe(false);
  });

  it('getMeta strips action from commands', () => {
    const reg = new CommandRegistry();
    reg.register({ id: 'm.test', label: 'M', description: 'D', category: 'X', action: vi.fn() });
    const meta = reg.getMeta();
    expect(meta[0]).not.toHaveProperty('action');
    expect(meta[0].id).toBe('m.test');
  });
});

describe('registerCommands (batch helper)', () => {
  it('registers multiple commands to the singleton registry', () => {
    const before = registry.getAll().length;
    const cmds = [
      { id: 'batch.a', label: 'A', description: '', category: 'X', action: vi.fn() },
      { id: 'batch.b', label: 'B', description: '', category: 'X', action: vi.fn() },
    ];
    registerCommands(cmds);
    expect(registry.getAll().length).toBe(before + 2);
  });
});
