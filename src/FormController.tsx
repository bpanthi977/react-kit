import { ReferenceMultiple } from '@bhoos/game-kit-ui';
import { Validator, ValidatorInput } from './validators/Validator';
import { useState } from 'react';

export type Structure = { [key: string]: Validator<any, any> | Structure };
export type StateOf<S extends Structure> = {
  [P in keyof S]
  : S[P] extends Validator<any, infer Output> ? Output
  : S[P] extends Structure ? StateOf<S[P]>
  : never
}


type SubStructure<S extends Structure, K extends keyof S> = S[K] extends Structure ? S[K] : never;
type SubStructureKeys<S extends Structure> = keyof {
  [P in keyof S as S[P] extends Validator<any, any> ? never : P] : S[P]
}
type StateKeys<S extends Structure> = keyof {
  [P in keyof S as S[P] extends Validator<any, any> ? P : never] : S[P]
}

export class Controller<T extends Structure> {
  private subcontrollers = new Map<keyof T, Controller<SubStructure<T, any>>>();
  private parent?: Controller<any>;

  public errors = new Map<StateKeys<T>, Error>();
  public validationError?: Error;
  ref = new ReferenceMultiple(0);

  constructor(
    private readonly structure: T,
    private state: StateOf<T>,
    private readonly validator?: (state: StateOf<T>) => StateOf<T>
  ) {}

  protected updateRef() {
    if (this.validator) {
      try {
        this.state = this.validator(this.state);
        this.validationError = undefined;
      } catch (e) {
        if (e instanceof Error) {
          this.validationError = e;
        } else {
          this.validationError = new Error(`Error on validating ${this.state}: ${e}`);
        }
      }
    }

    this.ref.setValue(this.ref.value + 1);
    if (this.parent) {
      this.parent.updateRef();
    }
  }

  value<K extends StateKeys<T>>(key: K): StateOf<T>[K] {
    return this.state[key];
  }

  updater<K extends StateKeys<T>>(key: K): (input: ValidatorInput<T[K]>) => void {
    return (input: ValidatorInput<T[K]>) => {
      const validator = this.structure[key];
      if (!isValidator(validator)) {
        throw new Error(`[BUG?] structure has now validator at key ${key as string}`);
      } else {
        try {
          const newValue = validator.validate(input);
          const oldValue = this.state[key];
          if (newValue != oldValue) {
            this.state[key] = newValue;
          }
          this.errors.delete(key);
        } catch (e) {
          if (e instanceof Error) {
            this.errors.set(key, e);
          } else {
            this.errors.set(key, new Error(`Error on validating input ${input} for ${key as string}: ${e}`));
          }
        }
      }
    }
  }

  substate<K extends SubStructureKeys<T>>(key: K): Controller<SubStructure<T, K>> {
    const cached = this.subcontrollers.get(key);
    if (cached) return cached;

    const val = this.structure[key];
    if (isValidator(val)) {
      throw new Error(`[FormController] ${key as string} is a validator, not a substructure`);
    } else if (typeof val != 'object') {
      throw new Error(`[FormController] ${key as string} is not an object.`);
    } else {
      const subcontroller = new Controller(val as SubStructure<T, K>, this.state[key] as StateOf<SubStructure<T,K>>);
      subcontroller.parent = this;
      this.subcontrollers.set(key, subcontroller);
      return subcontroller;
    }
  }

  use() {
    ReferenceMultiple.use(this.ref);
    return this;
  }

  static use<T extends Structure>(init: () => Controller<T>): Controller<T> {
    const [controller, _] = useState(init);
    return controller.use();
  }
}

/// Utils
function isValidator(k: any): k is Validator<any, any> {
  return !!k.validate;
}
