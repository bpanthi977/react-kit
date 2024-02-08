import { Ref, Validator, ValidatorInput, ValidatorOutput } from '../index.js';

export class FieldController<V extends Validator<any, any>> {
  private _value: ValidatorOutput<V>;

  public get value() { return this._value };
  public error?: Error;
  public ref = new Ref(0);

  constructor(value: ValidatorOutput<V>, private validator: V, private key: string, private readonly updateParent: (value: ValidatorOutput<V>) => void) {
    this._value = value;
  }

  public onChange = (input: ValidatorInput<V>) => {
    try {
      const newValue = this.validator.validate(input);

      if (newValue != this.value || this.error) {
        this._value = newValue;
        this.error = undefined;

        this.updateRef();
      }
    } catch (e) {
      if (e instanceof Error) {
        this.error = e;
      } else {
        this.error = new Error(`Error on validating input ${input} for ${this.key}: ${e}`);
      }

      this.updateRef();
    }
  }

  public swapValidator<NewV extends V>(validator: NewV) {
    this.validator = validator;
  }

  private updateRef() {
    this.ref.setValue(this.ref.value + 1);
    this.updateParent(this._value);
  }
}
