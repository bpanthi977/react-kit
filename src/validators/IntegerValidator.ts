type Input = number | string;
type Output = number;

export class IntegerValidator implements FormValidator<Input, Output> {
  validate(input: Input): number {
    if (typeof input === 'string') {
      const int = parseInt(input)
      if (isNaN(int)) {
        throw new Error(`${input} is not an integer`);
      }
      return int;
    } else {
      const integer = Math.trunc(input);
      if (input != integer) {
        throw new Error(`${input} is not an integer`);
      }
      return integer;
    }
  }
}
