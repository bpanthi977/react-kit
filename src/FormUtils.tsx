import { useState } from "react";
import { FieldController, StateController, Structure } from "./index.js";
import { ReferenceMultiple } from "@bhoos/game-kit-ui";

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
  ReferenceMultiple.use(controller.ref);
  return controller;
}
