import { Controller } from "./FormController";

export function isErrorFree(c: Controller<any>) {
  if (c.validationError) return false;
  if (c.errors.size != 0) return false;

  return true;
}

export function isStateModified(c: Controller<any>) {
  return c.ref.value != 0;
}
