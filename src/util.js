export function normalize2DArray(a) {
  const maxRow = a.map((row) => Math.max(...row));
  const maxValue = Math.max(...maxRow);

  const minRow = a.map((row) => Math.min(...row));
  const minValue = Math.min(...minRow);

  return a.map((row) =>
    row.map((cell) => (cell - minValue) / (maxValue - minValue))
  );
}
