export {};

declare global {
  interface Number {
    toSize(): string
    round(base): number
    ceil(base): number
    floor(base): number
  }
}

Number.prototype.toSize = function (): string {
  try {
    const kb = 1024
    const mb = Math.pow(1024, 2)
    const gb = Math.pow(1024, 3)

    const size = parseInt(this)

    if (size >= gb) {
      return (size / gb).floor(2) + ' GB'
    } else if (size >= mb) {
      return (size / mb).floor(2) + ' MB'
    } else if (size >= kb) {
      return (size / kb).floor(2) + ' KB'
    } else {
      return size + ' byte'
    }
  } catch(e) {
    return null;
  }
};

Number.prototype.round = function (base): number {
  return Math.round(this * base) / base;
}

Number.prototype.ceil = function (base): number {
  return Math.ceil(this * base) / base;
}

Number.prototype.floor = function (base): number {
  return Math.floor(this * base) / base;
}
