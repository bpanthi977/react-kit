import { Validator } from './Validator';
type Input = string;
type Output = string;

export class StringValidator implements Validator<Input, Output> {
  private validations: ((str: Output) => Output)[] = [];
  validate(input: Input): Output {
    return this.validations.reduce((value, validator) => validator(value), input);
  }


  max(max: number, error?: (str: string) => Error) {
    this.validations.push((str) => {
      if (str.length > max) {
        if (error) throw error(str);
        throw new Error(`Length is greater than ${max}`);
      }
      return str;
    })
    return this;
  }

  min(min: number, error?: (str: string) => Error) {
    this.validations.push((str) => {
      if (str.length < min) {
        if (error) throw error(str);
        throw new Error(`Legnth is less than ${min}`);
      }
      return str;
    })
    return this;
  }

  custom(rule: (input: string) => string) {
    this.validations.push(rule);
    return this;
  }
}
