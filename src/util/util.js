export const transpose = (arr) =>
  arr[0].map((col, i) => arr.map((row) => row[i]));
export const transNumToLetter = (num) => {
  const AIndex = "A".charCodeAt(0); //
  const ZIndex = "Z".charCodeAt(0); //
  const len = ZIndex - AIndex + 1; // 24
  let s = "";
  while (num > 0) {
    s += String.fromCharCode((num % len) + AIndex);
    num = Math.floor(num / len) - 1;
  }
};
