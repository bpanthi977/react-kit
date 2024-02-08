import { useState } from "react";
import { FieldController, StateController, Structure, Validator, ValidatorInput, ValidatorOutput } from "./index.js";

export function isErrorFree(ctr: StateController<any> | FieldController<any>) {
  if (ctr.error) return false;
  if (ctr instanceof StateController) {
    for(const [_, subctr] of ctr.subcontrollers) {
      if (!isErrorFree(subctr))
        return false;
    }
  }

  return true;
}

export function isStateModified(c: StateController<any>) {
  return c.ref.value != 0;
}

export function useStateController<T extends Structure>(init: () => StateController<T>) {
  const [controller, _] = useState(init);
  controller.ref.use()
  return controller;
}


// Learnt about this technique of chaining types from
// https://stackoverflow.com/questions/70873524/chaining-function-types-in-typescript
type First<T extends any[]> = T extends [infer F, ...infer _] ? F : never;
type Last<T extends any[]> =  T extends [...infer _, infer L] ? L : never;
type RightShift<T extends any[]> = Extract<[Validator<any, any>, ...{ [I in keyof T]: T[I] }], Record<keyof T, any>>;
type Next<T extends any[], Index extends keyof T> = RightShift<T>[Index];

type CheckChain<T extends any[]> = T extends { [I in keyof T]: Validator<ValidatorOutput<Next<T, I>>, any> } ? true: false;
type ChainRet<T extends any[]> = Validator<ValidatorInput<First<T>>, ValidatorOutput<Last<T>>>

type ChainCheckNRet<T extends any[]> = CheckChain<T> extends true ? ChainRet<T>: never;

export function chainValidators<T extends Validator<any, any>[]>(...validators: T): ChainCheckNRet<T> {
  return {
    validate: (input: ValidatorInput<First<T>>) =>  {
      return validators.reduce((value, validator) => validator.validate(value), input)
    }
  } as ChainCheckNRet<T>
}
