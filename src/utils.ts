import { useEffect, useState } from "react";

// Inspired from @bhoos/game-kit-ui's RefrenceMultiple
export class Ref<T> {
  protected _value: T;
  private paused = false;
  private onChange: Array<(val: T) => void> = []

  constructor(value: T) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  setValue(newValue: T) {
    if (this._value == newValue) return;
    this._value = newValue;
    if (!this.paused)
      this.onChange.forEach(cb => cb(newValue));
  }

  subscribe(setter: (val: T) => void) {
    this.onChange.push(setter);
    return () => {
      const idx = this.onChange.indexOf(setter);
      if (idx >= 0) this.onChange.splice(idx, 1);
    }
  }

  use() {
    const [value, setter] = useState(() => this._value);
    useEffect(() => {
      setter(() => this._value);
      this.subscribe(setter);
    }, [setter])

    return value;
  }
}
