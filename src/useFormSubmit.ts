import { useEffect, useContext } from 'react';
import { FormContext, FormController } from './FormController.js';
import { GenericState } from './types.js';

export function useFormError(onError: (err: Error) => void) {
  const controller = useContext(FormContext);
  useFormErrorOf(controller, onError);
}

export function useFormErrorOf<T extends GenericState>(controller: FormController<T>, onError: (err: Error) => void) {
  useEffect(() => {
    return controller.setErrorHandler(onError);
  }, [controller, onError]);
}
