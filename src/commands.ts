/** A single registered command. */
export interface Command {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
  category: string;
  action: () => void | Promise<void>;
}

/** Registry entry without the live action (for serialization/search). */
export type CommandMeta = Omit<Command, 'action'>;

/** Simple command registry backed by a Map. */
export class CommandRegistry {
  private readonly commands = new Map<string, Command>();

  register(cmd: Command): void {
    if (this.commands.has(cmd.id)) {
      throw new Error(`Command already registered: ${cmd.id}`);
    }
    this.commands.set(cmd.id, cmd);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAll(): Command[] {
    return [...this.commands.values()];
  }

  search(query: string): Command[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();
    return this.getAll().filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }

  async execute(id: string): Promise<boolean> {
    const cmd = this.commands.get(id);
    if (!cmd) return false;
    await cmd.action();
    return true;
  }

  getMeta(): CommandMeta[] {
    return this.getAll().map(({ action: _action, ...meta }) => meta);
  }
}

/** Singleton registry for the application. */
export const registry = new CommandRegistry();

/** Register a batch of commands. */
export function registerCommands(cmds: Command[]): void {
  for (const cmd of cmds) {
    registry.register(cmd);
  }
}
