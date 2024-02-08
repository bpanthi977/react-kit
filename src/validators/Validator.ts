export interface Validator<I, O> {
  validate(input: I): O
}

export type ValidatorInput<V> = V extends Validator<infer I, any> ? I : never;
export type ValidatorOutput<V> = V extends Validator<any, infer O> ? O : never;
