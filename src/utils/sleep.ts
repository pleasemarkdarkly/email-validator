export const sleep = (milliseconds: number) =>
  new Promise(r => setTimeout(r, milliseconds));
