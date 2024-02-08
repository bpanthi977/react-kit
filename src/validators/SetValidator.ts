import { Validator } from './Validator';

export class SetValidator<Input, T extends Input> implements Validator<Input, T> {
  private validator: (num: Input) => T;

  validate(input: Input): T {
    return this.validator(input);
  }

  constructor(members: T[], error?: (val: Input) => Error) {
    this.validator = (val: Input) => {
      for (const member of members) {
        if (member === val) {
          return member;
        }
      }
      if (error) throw error(val);
      throw new Error(`${val} is not one of the ${members}`);
    }
  }
}
