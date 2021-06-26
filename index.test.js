var index = require("./index");

const elevenByEleven = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: 2 },
  { x: 0, y: 3 },
  { x: 0, y: 4 },
  { x: 0, y: 5 },
  { x: 0, y: 6 },
  { x: 0, y: 7 },
  { x: 0, y: 8 },
  { x: 0, y: 9 },
  { x: 0, y: 10 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 3, y: 0 },
  { x: 4, y: 0 },
  { x: 5, y: 0 },
  { x: 6, y: 0 },
  { x: 7, y: 0 },
  { x: 8, y: 0 },
  { x: 9, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 1 },
  { x: 10, y: 2 },
  { x: 10, y: 3 },
  { x: 10, y: 4 },
  { x: 10, y: 5 },
  { x: 10, y: 6 },
  { x: 10, y: 7 },
  { x: 10, y: 8 },
  { x: 10, y: 9 },
  { x: 10, y: 10 },
  { x: 1, y: 10 },
  { x: 2, y: 10 },
  { x: 3, y: 10 },
  { x: 4, y: 10 },
  { x: 5, y: 10 },
  { x: 6, y: 10 },
  { x: 7, y: 10 },
  { x: 8, y: 10 },
  { x: 9, y: 10 },
];

const twoByTwo = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
];

const threeByThree = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: 2 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
  { x: 1, y: 2 },
];

test("getWallBoundaries calculates an 2x2 grid", () => {
  const result = index.getWallBoundaries(2, 2);

  expect(result).toStrictEqual(twoByTwo);
});

test("getWallBoundaries calculates an 3x3 grid", () => {
  const result = index.getWallBoundaries(3, 3);

  expect(result).toStrictEqual(threeByThree);
});

test("getWallBoundaries calculates an 11x11 grid", () => {
  const result = index.getWallBoundaries(11, 11);

  expect(result).toStrictEqual(elevenByEleven);
});

test("calculateGoodMoves returns all possible moves when the headBlock is not at the edge", () => {
  const result = index.calculateGoodMoves(4, 5, { x: 2, y: 2 });
  expect(result).toStrictEqual(["right", "left", "down", "up"]);
});

test("calculateGoodMoves return only right, left, down when headBlock is at the top of the board", () => {
  const result = index.calculateGoodMoves(4, 5, { x: 2, y: 3 });
  // no up
  expect(result).toStrictEqual(["right", "left", "down"]);
});

test("calculateGoodMoves return only left, down, up when headBlock is at the right of the board", () => {
  const result = index.calculateGoodMoves(4, 5, { x: 4, y: 2 });
  // no right
  expect(result).toStrictEqual(["left", "down", "up"]);
});

test("calculateGoodMoves return only right, down, up when headBlock is at the right of the board", () => {
  const result = index.calculateGoodMoves(4, 5, { x: 0, y: 2 });
  // no left
  expect(result).toStrictEqual(["right", "down", "up"]);
});

test("calculateGoodMoves return only right, left, up when headBlock is at the right of the board", () => {
  const result = index.calculateGoodMoves(4, 5, { x: 1, y: 0 });
  // no down
  expect(result).toStrictEqual(["right", "left", "up"]);
});
