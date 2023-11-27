import { Parser } from './Parser.js';

export class BooleanParser extends Parser<boolean> {
  constructor() {
    super();
    this.add((value: string) => {
      const lowered = value.trim().toLowerCase();
      if (!lowered || lowered === 'n' || lowered === 'no' || lowered === 'false') return false;
      return true;
    });
  }
}
