export namespace Utils {
  export function toDate(input: any): Date {
    try {
      return new Date(Date.parse(input));
    } catch(e) {
      return null;
    }
  }
}
