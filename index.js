const bodyParser = require("body-parser");
const express = require("express");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

app.get("/", handleIndex);
app.post("/start", handleStart);
app.post("/move", handleMove);
app.post("/end", handleEnd);

app.listen(PORT, () => console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`));

function handleIndex(request, response) {
  var battlesnakeInfo = {
    apiversion: "1",
    author: "",
    color: "#f1101a",
    head: "caffeine",
    tail: "pixel",
  };
  response.status(200).json(battlesnakeInfo);
}

function handleStart(request, response) {
  var gameData = request.body;

  console.log("START");
  response.status(200).send("ok");
}

function getNextBlockCoords(headBlock, move) {
  switch (move) {
    case "up":
      return { x: headBlock.x, y: headBlock.y + 1 };
    case "down":
      return { x: headBlock.x, y: headBlock.y - 1 };
    case "left":
      return { x: headBlock.x - 1, y: headBlock.y };
    case "right":
      return { x: headBlock.x + 1, y: headBlock.y };
    default:
      return false;
  }
}

// WORK OUT BEST MOVES TO GET FOOD

// CAN WE WORK OUT A RISK FACTOR PER MOVE?

// WHAT IS SHOUT?

// gameData.board.snakes.food is an array of all food coords
// console.log(gameData.board.food.map((thing) => thing));

function generateMove(goodMoves) {
  return goodMoves[Math.floor(Math.random() * goodMoves.length)];
}

function getWallBoundaries(boardWidth, boardHeight) {
  // indexes start at 0

  const boundaries = new Set();

  //left wall
  for (let i = 0; i < boardHeight; i++) {
    boundaries.add(JSON.stringify({ x: 0, y: i }));
  }

  //bottom wall
  for (let j = 0; j < boardWidth; j++) {
    boundaries.add(JSON.stringify({ x: j, y: 0 }));
  }

  //right wall
  for (let k = 0; k < boardHeight; k++) {
    boundaries.add(JSON.stringify({ x: boardWidth - 1, y: k }));
  }

  //top wall
  for (let l = 0; l < boardWidth; l++) {
    boundaries.add(JSON.stringify({ x: l, y: boardHeight - 1 }));
  }

  const array = Array.from(boundaries);
  const convertedArray = array.map((item) => {
    return JSON.parse(item);
  });

  return convertedArray;
}

function calculateGoodMoves(boardHeight, boardWidth, headBlock) {
  const possibleMoves = [];

  if (headBlock.x !== boardWidth - 1) {
    possibleMoves.push("right");
  }

  if (headBlock.x !== 0) {
    possibleMoves.push("left");
  }

  if (headBlock.y !== 0) {
    possibleMoves.push("down");
  }

  if (headBlock.y !== boardHeight - 1) {
    possibleMoves.push("up");
  }

  return possibleMoves;
}

function generateNonCollidingMove(gameData) {
  // const wallBoundaries = getWallBoundaries(gameData.board.height, gameData.board.width);
  const occupiedBlocks = gameData.you.body.map((coord) => coord);
  const headBlock = gameData.you.head;

  const goodMoves = calculateGoodMoves(gameData.board.height, gameData.board.width, headBlock);

  const move = generateMove(goodMoves);
  const nextBlock = getNextBlockCoords(headBlock, move);

  // occupiedBlocks avoids colliding with myself
  if (occupiedBlocks.find((block) => block === nextBlock)) {
    return generateNonCollidingMove(gameData);
  } else {
    return move;
  }
}

function handleMove(request, response) {
  var gameData = request.body;

  console.log(gameData);
  // gameData.board.snakes is an array of all snakes on the board
  // with coordinates of the head and coordinates of body pieces + length

  console.log(gameData.board.snakes.map((thing) => thing));

  const move = generateNonCollidingMove(gameData);

  console.log("MOVE: " + move);
  response.status(200).send({
    move: move,
  });
}

function handleEnd(request, response) {
  var gameData = request.body;

  console.log("END");
  response.status(200).send("ok");
}

module.exports = {
  getWallBoundaries,
  calculateGoodMoves,
};
