type Input = string;
type Output = string;

export class StringValidator implements FormValidator<Input, Output> {
  validate(input: Input): Output {
    return input;
  }
}
