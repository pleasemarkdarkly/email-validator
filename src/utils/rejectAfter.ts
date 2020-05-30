export const rejectAfter = async (timeout, message) =>
  await new Promise((res, rej) => {
    setTimeout(() => rej(message), timeout);
  });
