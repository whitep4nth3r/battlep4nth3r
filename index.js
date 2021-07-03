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
    author: "whitep4nth3r",
    color: "#ffb626",
    head: "bendr",
    tail: "pixel",
  };
  response.status(200).json(battlesnakeInfo);
}

function handleStart(request, response) {
  var gameData = request.body;

  console.log("START");
  response.status(200).send("ok");
}

/**
 * Calculate a map of coordinates representing the board's current state
 * for the current move
 * @param {*} boardHeight
 * @param {*} boardWidth
 * @param {*} foodArray
 * @param {*} thisSnake
 * @param {*} allSnakes
 * @returns Map();
 */

function createMapForMove(boardHeight, boardWidth, foodArray, thisSnake, allSnakes) {
  const map = new Map();

  for (let x = 0; x < boardWidth; x++) {
    for (let y = 0; y < boardHeight; y++) {
      map.set(`${x},${y}`, {
        x,
        y,
        cost: boardHeight * boardWidth + 1,
        food: false,
        previous: null,
        direction: null,
      });
    }
  }

  for (food of foodArray) {
    // Get from the map
    let entry = map.get(`${food.x},${food.y}`);
    // Update
    entry.food = true;
    // Re-set in the map
    map.set(`${food.x},${food.y}`, entry);
  }

  // Remove all snakeParts from map
  // we cannot move here
  for (snake of allSnakes) {
    for (block of snake.body) {
      map.delete(`${block.x},${block.y}`);
    }
  }

  // Re add thisSnake head
  // this is the start of the pathing
  map.set(`${thisSnake.head.x},${thisSnake.head.y}`, {
    x: thisSnake.head.x,
    y: thisSnake.head.y,
    cost: 0,
    food: false,
    previous: null,
    direction: null,
  });

  return map;
}

/**
 *
 * @param {*} map
 * @param {*} snakeHead
 * returns {x, y, cost, food, previous} || null
 */
function calculateCheapestFoodLocation(map, snakeHead) {
  const queue = [];

  // Put head square in queue
  queue.push(map.get(`${snakeHead.x},${snakeHead.y}`));

  while (queue.length > 0) {
    const currentSquare = queue.shift();

    if (currentSquare.food) {
      return currentSquare;
    }

    // squareAbove
    if ((squareAbove = map.get(`${currentSquare.x},${currentSquare.y + 1}`))) {
      const newCost = currentSquare.cost + 1;

      if (newCost < squareAbove.cost) {
        squareAbove.cost = currentSquare.cost + 1;
        squareAbove.previous = currentSquare;
        squareAbove.direction = "up";
        map.set(`${squareAbove.x},${squareAbove.y}`, squareAbove);

        queue.push(squareAbove);
      }
    }

    // squareBelow
    if ((squareBelow = map.get(`${currentSquare.x},${currentSquare.y - 1}`))) {
      const newCost = currentSquare.cost + 1;

      if (newCost < squareBelow.cost) {
        squareBelow.cost = currentSquare.cost + 1;
        squareBelow.previous = currentSquare;
        squareBelow.direction = "down";
        map.set(`${squareBelow.x},${squareBelow.y}`, squareBelow);

        queue.push(squareBelow);
      }
    }

    // squareLeft
    if ((squareLeft = map.get(`${currentSquare.x - 1},${currentSquare.y}`))) {
      const newCost = currentSquare.cost + 1;

      if (newCost < squareLeft.cost) {
        squareLeft.cost = currentSquare.cost + 1;
        squareLeft.previous = currentSquare;
        squareLeft.direction = "left";
        map.set(`${squareLeft.x},${squareLeft.y}`, squareLeft);

        queue.push(squareLeft);
      }
    }

    // squareRight
    if ((squareRight = map.get(`${currentSquare.x + 1},${currentSquare.y}`))) {
      const newCost = currentSquare.cost + 1;

      if (newCost < squareRight.cost) {
        squareRight.cost = currentSquare.cost + 1;
        squareRight.previous = currentSquare;
        squareRight.direction = "right";
        map.set(`${squareRight.x},${squareRight.y}`, squareRight);

        queue.push(squareRight);
      }
    }

    queue.sort(sortByCostAscending);
  }

  return null;
}

function sortByCostAscending(a, b) {
  if (a.cost < b.cost) {
    return -1;
  }

  if (a.cost > b.cost) {
    return 1;
  }

  return 0;
}

function getPath(target) {
  const path = [target];
  let thisBlock = target.previous;

  while (thisBlock.cost > 1) {
    // this adds the item at the start of the array
    path.unshift(thisBlock.previous);
    thisBlock = thisBlock.previous;
  }

  return path;
}

function getFurthestOpenPoint(map, boardHeight, boardWidth) {
  const highestDefaultCost = boardHeight * boardWidth + 1;

  const suitablyCostedSquares = [];

  for (const [key, value] of map.entries()) {
    if (value.cost < highestDefaultCost) {
      suitablyCostedSquares.push(value);
    }
  }

  suitablyCostedSquares.sort(sortByCostAscending);

  return suitablyCostedSquares.pop();
}

function handleMove(request, response) {
  var gameData = request.body;

  const possibleMoves = ["left", "right", "up", "down"];
  let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

  const { board } = gameData;

  const map = createMapForMove(board.height, board.width, board.food, gameData.you, board.snakes);
  const nextFood = calculateCheapestFoodLocation(map, gameData.you.head);

  if (nextFood !== null) {
    const pathToFood = getPath(nextFood);
    move = pathToFood[0].direction;
    console.log("HEADING TO FOOD MOVE: " + move);
  } else {
    const furthestOpenPoint = getFurthestOpenPoint(map, board.height, board.width);

    if (furthestOpenPoint.cost > 0) {
      const path = getPath(furthestOpenPoint);
      move = path[0].direction;
      console.log("FURTHEST OPEN POINT MOVE: " + move);
    } else {
      console.log("SENDING RANDOM MOVE: " + move);
    }
  }

  response.status(200).send({
    move,
  });
}

function handleEnd(request, response) {
  var gameData = request.body;

  console.log("END");
  response.status(200).send("ok");
}
