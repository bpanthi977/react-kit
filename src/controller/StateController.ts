import { Validator, ValidatorOutput, FieldController, Ref } from '../index.js';
import { isValidator } from '../validators/Validator.js';

export type Structure = { [key: string]: Validator<any, any> | Structure };
export type StateOf<S extends Structure> = {
  [P in keyof S]
  : S[P] extends Validator<any, infer Output> ? Output
  : S[P] extends Structure ? StateOf<S[P]>
  : never
}

type SubStructure<S extends Structure, K extends keyof S> = S[K] extends Structure ? S[K] : never;
type FieldValidator<S extends Structure, K extends keyof S> = S[K] extends Validator<infer _, infer _> ? S[K] : never;
type SubStateController<S extends Structure, K extends keyof S> = StateController<SubStructure<S, K>, StateOf<SubStructure<S, K>>>;

type SubStructureKeys<S extends Structure> = keyof {
  [P in keyof S as S[P] extends Validator<any, any> ? never : P] : S[P]
}
type FieldKeys<S extends Structure> = keyof {
  [P in keyof S as S[P] extends Validator<any, any> ? P : never] : S[P]
}

export class StateController<T extends Structure, S extends StateOf<T> = StateOf<T>> {
  private updateParent?: () => void;

  public subcontrollers = new Map<any, StateController<any, any> | FieldController<any>>();
  public state: S;
  public error?: Error;
  public ref = new Ref(0);

  constructor(
    private readonly structure: T,
    state: S,
    private readonly validator?: (state: S) => S
  ) {
    this.state = state;
  }

  field<K extends FieldKeys<T>>(key: K): FieldController<FieldValidator<T, K>> {
    const cached = this.subcontrollers.get(key);
    if (cached) return cached as FieldController<FieldValidator<T,K>>;

    const structureValue = this.structure[key]
    if (isValidator(structureValue)) { // key is StateKey
      const fieldValue = this.state[key] as ValidatorOutput<T[K]>;
      const stateController = new FieldController<FieldValidator<T, K>>(fieldValue, structureValue as FieldValidator<T, K>, key as string, (newValue) => {
        this.state[key] = newValue;
        this.updateRef();
      });
      this.subcontrollers.set(key, stateController);
      return stateController;
    } else {
      throw new Error(`${key as string} is not a field.`)
    }
  }

  substate<K extends SubStructureKeys<T>>(key: K): SubStateController<T, K> {
    const cached = this.subcontrollers.get(key);
    if (cached) return cached as SubStateController<T, K>;

    const structureValue = this.structure[key];
    if (isValidator(structureValue)) {
      throw new Error(`${key as string} is not a sub structure`);
    } else { // key is SubStructureKey
      type SubStruct = SubStructure<T, K>;
      type SubState = StateOf<SubStruct>;
      const subcontroller = new StateController(structureValue as SubStruct, this.state[key] as SubState);
      subcontroller.updateParent = () => {
        (this.state[key] as SubState) = subcontroller.state;
        this.updateRef();
      }
      this.subcontrollers.set(key, subcontroller);
      return subcontroller;
    }
  }


  swapSubController<K extends SubStructureKeys<T>, B extends SubStructure<T, K>, S extends StateOf<B>>(key: K, ctr: StateController<B, S>) {
    const original = this.subcontrollers.get(key);
    if (original) {
      if (original instanceof FieldController) {
        throw new Error(`Can't replace field controller ${key as string} with state controller.`);
      }
      original.updateParent = undefined;
    }

    ctr.updateParent = () => {
      (this.state[key] as StateOf<B>) = ctr.state;
      this.updateRef();
    }

    if (this.state[key] != ctr.state)
      ctr.updateParent();

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
    this.updateParent?.();
  }
}
