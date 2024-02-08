import { Validator } from './Validator';
type Input = number | string;
type Output = number;

export class IntegerValidator implements Validator<Input, Output> {
  private validations: ((num: number) => number)[] = [];

  validate(input: Input): number {
    if (typeof input === 'string') {
      const int = parseInt(input)
      if (isNaN(int)) {
        throw new Error(`${input} is not an integer`);
      }
      return this.validations.reduce((value, validator) => validator(value), int);
    } else {
      const integer = Math.trunc(input);
      if (input != integer) {
        throw new Error(`${input} is not an integer`);
      }
      return this.validations.reduce((value, validator) => validator(value), integer);
    }
  }

  max(max: number, error?: (n: number) => Error) {
    this.validations.push((n) => {
      if (n > max) {
        if (error) throw error(n);
        throw new Error(`${n} is greater than ${max}`);
      }
      return n;
    })
    return this;
  }

  min(min: number, error?: (n: number) => Error) {
    this.validations.push((n) => {
      if (n < min) {
        if (error) throw error(n);
        throw new Error(`${n} is less than ${min}`);
      }
      return n;
    })
    return this;
  }
}
