export const floor = Math.floor
/** Mathematical modulo (result has the sign of the divisor). */
export const mod = (a: number, b: number) => a - b * Math.floor(a / b)
