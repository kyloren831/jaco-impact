import { InvalidTransitionError } from './domain-error';

export interface IStateMachine<TState extends string> {
  canTransition(from: TState, to: TState): boolean;
  transition(from: TState, to: TState): TState;
  getValidTransitions(from: TState): TState[];
}

export class StateMachine<TState extends string> implements IStateMachine<TState> {
  constructor(
    private readonly entityName: string,
    private readonly transitions: Record<TState, TState[]>
  ) {}

  public canTransition(from: TState, to: TState): boolean {
    const allowed = this.transitions[from];
    if (!allowed) return false;
    return allowed.includes(to);
  }

  public transition(from: TState, to: TState): TState {
    if (!this.canTransition(from, to)) {
      throw new InvalidTransitionError(this.entityName, from, to);
    }
    return to;
  }

  public getValidTransitions(from: TState): TState[] {
    return this.transitions[from] || [];
  }
}
