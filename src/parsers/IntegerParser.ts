import { DecimalParser } from './DecimalParser.js';

export class IntegerParser extends DecimalParser {
  constructor() {
    super();

    this.add((value: string) => {
      if (!value) throw new Error('Value must be a integer number');
      if (/^[-+]?(\d+)$/.test(value)) {
        return Number(value);
      }
      throw new Error('Value must be a integer number');
    });
  }
}
