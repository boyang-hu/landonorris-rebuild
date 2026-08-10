/** PJ 35794 — namespaced event emitter (verbatim port) */
type Callback = (...args: unknown[]) => unknown;

export class EventEmitter {
  callbacks: Record<string, Record<string, Callback[]>> = { base: {} };

  on(names: string, callback: Callback) {
    if (typeof names === 'undefined' || names === '') {
      console.warn('wrong names');
      return false;
    }
    if (typeof callback === 'undefined') {
      console.warn('wrong callback');
      return false;
    }
    this.resolveNames(names).forEach((name) => {
      const resolved = this.resolveName(name);
      if (!(this.callbacks[resolved.namespace] instanceof Object)) this.callbacks[resolved.namespace] = {};
      if (!(this.callbacks[resolved.namespace][resolved.value] instanceof Array))
        this.callbacks[resolved.namespace][resolved.value] = [];
      this.callbacks[resolved.namespace][resolved.value].push(callback);
    });
    return this;
  }

  off(name: string) {
    if (typeof name === 'undefined' || name === '') {
      console.warn('wrong name');
      return false;
    }
    this.resolveNames(name).forEach((n) => {
      const resolved = this.resolveName(n);
      if (resolved.namespace !== 'base' && resolved.value === '') delete this.callbacks[resolved.namespace];
      else if (resolved.namespace === 'base') {
        for (const ns in this.callbacks) {
          if (this.callbacks[ns] instanceof Object && this.callbacks[ns][resolved.value] instanceof Array) {
            delete this.callbacks[ns][resolved.value];
            if (Object.keys(this.callbacks[ns]).length === 0) delete this.callbacks[ns];
          }
        }
      } else if (
        this.callbacks[resolved.namespace] instanceof Object &&
        this.callbacks[resolved.namespace][resolved.value] instanceof Array
      ) {
        delete this.callbacks[resolved.namespace][resolved.value];
        if (Object.keys(this.callbacks[resolved.namespace]).length === 0) delete this.callbacks[resolved.namespace];
      }
    });
    return this;
  }

  trigger(name: string, args?: unknown[]) {
    if (typeof name === 'undefined' || name === '') {
      console.warn('wrong name');
      return false;
    }
    let final: unknown = null;
    let result: unknown = null;
    const argsArr = !(args instanceof Array) ? [] : args;
    let resolved = this.resolveNames(name);
    const r = this.resolveName(resolved[0]);
    if (r.namespace === 'base') {
      for (const ns in this.callbacks) {
        if (this.callbacks[ns] instanceof Object && this.callbacks[ns][r.value] instanceof Array)
          this.callbacks[ns][r.value].forEach((cb) => {
            result = cb.apply(this, argsArr);
            if (typeof final === 'undefined') final = result;
          });
      }
    } else if (this.callbacks[r.namespace] instanceof Object) {
      if (r.value === '') {
        console.warn('wrong name');
        return this;
      }
      this.callbacks[r.namespace][r.value].forEach((cb) => {
        result = cb.apply(this, argsArr);
        if (typeof final === 'undefined') final = result;
      });
    }
    return final;
  }

  resolveNames(names: string): string[] {
    let n = names;
    n = n.replace(/[^a-zA-Z0-9 ,/.]/g, '');
    n = n.replace(/[,/]+/g, ' ');
    return n.split(' ');
  }

  resolveName(name: string) {
    const out: { original: string; value: string; namespace: string } = {
      original: name,
      value: '',
      namespace: 'base',
    };
    const parts = name.split('.');
    out.value = parts[0];
    if (parts.length > 1 && parts[1] !== '') out.namespace = parts[1];
    return out;
  }
}
