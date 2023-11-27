import { GenericState } from '../types.js';

/**
 * A parser that validates the form for the given input.
 * It basically maintains a list of all parsers
 */
export class Parser<T> {
  private parsers: Array<(value: any, state: {}) => any> = [];

  // Function to convert original value to text input 
  toText(value: T): string {
    return value === undefined || value === null ? '' : String(value);
  }

  /**
   * Use the parser as a post check
   * @param parser
   */
  add(parser: <S extends GenericState>(value: any, state: Partial<S>) => T) {
    this.parsers.push(parser);
  }

  /**
   * Use the parser as pre check
   * @param parser
   */
  pre(parser: (value: any) => any) {
    this.parsers.unshift(parser);
  }

  parse<S extends GenericState>(input: string, state: Partial<S>): T {
    return this.parsers.reduce((res, parse) => {
      return parse(res, state);
    }, input) as never as T;
  }

  required() {
    this.pre((value: string) => {
      const v = value.trim();
      if (v.length === 0) throw new Error('Value is required');
      return v;
    });

    return this;
  }
}