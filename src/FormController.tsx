import React from 'react';
import { TextParser } from './parsers';
import { GenericState, FormDefinition } from './types.js';

function toText(k: any): string {
  if (k === undefined || k === null || Number.isNaN(k)) return '';
  return String(k);
}

const DefaultDef = {
  parser: new TextParser(),
};

type Listeners<T, F extends Function> = {
  [K in keyof T]?: Array<F>;
};

export class FormController<T extends GenericState> {
  /**
   * The current state of the form after parsing the
   * user entered data
   */
  private state: Partial<T>;

  /**
   * Keep track of raw input data as provided by the
   * user
   */
  private inputs: { [K in keyof T]?: string };

  /**
   * The parsers defined for this form
   */
  private def: FormDefinition<T>;

  /**
   * Keep track of value listeners
   */
  private listeners: Listeners<T, (value: any) => void> = {};

  /**
   * Keep track of validators
   */
  private errorListeners: Listeners<T, (err: Error | null) => void> = {};

  /**
   * The parent state for this form. Used for
   * getting the errorHandler all the way to the root
   * element. So that a root level error handler would
   * display all error messages
   */
  private parent?: FormController<any>;
  private errorHandler: ((err: Error) => void) | null = null;

  constructor(def: FormDefinition<T>, initialState?: Partial<T>, parent?: FormController<any>) {
    this.def = def;
    this.state = initialState || {};
    this.parent = parent;
    this.inputs = {};
  }

  getState() {
    return this.state;
  }

  setErrorHandler(handler: (err: Error) => void) {
    this.errorHandler = handler;
    return () => {
      this.errorHandler = this.parent ? this.parent.errorHandler : null;
    };
  }

  get<K extends keyof T>(name: K, defaultValue?: T[K]): T[K] | undefined {
    const res = this.state[name];
    return res === undefined ? defaultValue : res;
  }

  set<K extends keyof T>(name: K, newValue: T[K]) {
    // Object only if value changes
    if (newValue === this.state[name]) return;
    this.state = Object.assign({}, this.state, { [name]: newValue });
    const listeners = this.listeners[name];
    if (listeners) listeners.forEach(l => l(newValue));
  }

  getInput<K extends keyof T>(name: K): string {
    const k = this.inputs[name];

    // Use the user changed value as long as it's available, otherwise provide
    // the text representation of state value
    if (k === undefined) {
      const def = this.def[name];
      return def ? def.parser.toText(this.state[name]) : toText(this.state[name]);
    }

    // @ts-ignore
    return k;
  }

  setInput<K extends keyof T>(name: K, newValue: string): Error | null {
    this.inputs[name] = newValue;

    const { parser } = this.def[name] || DefaultDef;
    // Inform all the error listeners
    const list = this.errorListeners[name];
    let error: Error | null = null;
    try {
      const k = parser.parse(newValue, this.getState());
      this.set(name, k);
    } catch (err) {
      error = err as Error;
    }
    if (list) list.forEach(listener => listener(error));
    return error;
  }

  private register<F extends Function>(target: Listeners<T, F>, name: keyof T, listener: F) {
    let list: Array<F>;
    if (target[name]) {
      list = target[name] as F[];
    } else {
      list = [];
      target[name] = list;
    }
    list.push(listener);

    return () => {
      const idx = list.indexOf(listener);
      list.splice(idx, 1);
      if (list.length === 0) {
        delete this.listeners[name];
      }
    };
  }

  listenError(name: keyof T, listener: (err: Error) => void) {
    return this.register(this.errorListeners, name, listener);
  }

  listen<K extends keyof T>(name: K, listener: (value: T[K]) => void) {
    return this.register(this.listeners, name, listener);
  }
}

export const FormContext = React.createContext(new FormController<any>({}));

type Props<T extends GenericState> = {
  controller: FormController<T>;
  children: React.ReactNode;
};

export function Form<T extends GenericState>({ controller, children }: Props<T>) {
  return <FormContext.Provider value={controller}>{children}</FormContext.Provider>;
}
