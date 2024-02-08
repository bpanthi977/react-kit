import { ReferenceMultiple } from '@bhoos/game-kit-ui';
import { Validator, ValidatorOutput, FieldController } from '../index.js';
import { isValidator } from '../validators/Validator.js';

export type Structure = { [key: string]: Validator<any, any> | Structure };
export type StateOf<S extends Structure> = {
  [P in keyof S]
  : S[P] extends Validator<any, infer Output> ? Output
  : S[P] extends Structure ? StateOf<S[P]>
  : never
}

type SubStructure<S extends Structure, K extends keyof S> = S[K] extends Structure ? S[K] : never;
type FieldValidator<S extends Structure, K extends keyof S> = S[K] extends Validator<infer I, infer O> ? Validator<I, O> : never;

type SubStructureKeys<S extends Structure> = keyof {
  [P in keyof S as S[P] extends Validator<any, any> ? never : P] : S[P]
}
type FieldKeys<S extends Structure> = keyof {
  [P in keyof S as S[P] extends Validator<any, any> ? P : never] : S[P]
}

export class StateController<T extends Structure> {
  private updateParent?: (value: StateOf<T>) => void;

  public subcontrollers = new Map<keyof T, StateController<any> | FieldController<any>>();
  public state: StateOf<T>;
  public error?: Error;
  public ref = new ReferenceMultiple(0);

  constructor(
    private readonly structure: T,
    state: StateOf<T>,
    private readonly validator?: (state: StateOf<T>) => StateOf<T>
  ) {
    this.state = state;
  }

  substate<K extends FieldKeys<T>>(key: K): FieldController<FieldValidator<T, K>>;
  substate<K extends SubStructureKeys<T>>(key: K): StateController<SubStructure<T, K>>;
  substate<K extends keyof T>(key: K) {
    const cached = this.subcontrollers.get(key);
    if (cached) return cached;

    const value = this.structure[key];
    if (isValidator(value)) { // key is StateKey
      const value = this.state[key] as ValidatorOutput<T[K]>;
      const stateController = new FieldController(value, value, key as string, (newValue) => {
        this.state[key] = newValue;
        this.updateRef();
      });
      this.subcontrollers.set(key, stateController);
      return stateController;

    } else { // key is SubStructureKey
      type SubStruct = SubStructure<T, K>;
      type SubState = StateOf<SubStruct>;
      const subcontroller = new StateController(value as SubStruct, this.state[key] as SubState);
      subcontroller.updateParent = (newValue: SubState) => {
        (this.state[key] as SubState) = newValue;
        this.updateRef();
      }
      this.subcontrollers.set(key, subcontroller);
      return subcontroller;
    }
  }


  swapSubController<K extends SubStructureKeys<T>, B extends SubStructure<T, K>>(key: K, ctr: StateController<B>) {
    const original = this.subcontrollers.get(key);
    if (original) {
      if (original instanceof FieldController) {
        throw new Error(`Can't replace field ${key as string} with state.`);
      }
      original.updateParent = undefined;
    }

    ctr.updateParent = (newValue: StateOf<B>) => {
      (this.state[key] as StateOf<B>) = newValue;
      this.updateRef();
    }
    ctr.updateParent(ctr.state);
    this.subcontrollers.set(key, ctr);
  }

  private updateRef() {
    if (this.validator) {
      try {
        this.state = this.validator(this.state);
        this.error = undefined;
      } catch (e) {
        if (e instanceof Error) {
          this.error = e;
        } else {
          this.error = new Error(`Error on validating ${this.state}: ${e}`);
        }
      }
    }

    this.ref.setValue(this.ref.value + 1);
    this.updateParent?.(this.state);
  }
}
