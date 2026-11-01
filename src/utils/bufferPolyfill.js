// Minimal Buffer polyfill to satisfy react-native-svg fetchData in React Native runtimes

export class BufferShim {
  constructor(data) {
    this.data = data;
  }

  static from(content, encoding) {
    return new BufferShim(content);
  }

  static isBuffer(obj) {
    return false;
  }

  toString(encoding) {
    if (typeof this.data === 'string') {
      return this.data;
    }
    return String(this.data);
  }
}

export const Buffer = BufferShim;

export default {
  Buffer: BufferShim,
};
