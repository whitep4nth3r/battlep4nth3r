const express = require("express");
const morgan = require("morgan");
const visualise = require("./visualise");

let MOVE_COUNT = 0;

/**
 * SHOULD WE EAT FOOD ACTUALLY?
 *
 * losing in head to heads??
 */

const PORT = process.env.PORT || 3000;

const app = express();
app.use(morgan("Took :response-time ms"));
app.use(express.json());
app.use("/visualise", express.static("static"));
app.get("/visualise_data", (req, res) => res.json(visualise.getData()));

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
    head: "space-helmet",
    tail: "rocket",
  };
  response.status(200).json(battlesnakeInfo);
}

function handleStart(request, response) {
  console.log("START");
  MOVE_COUNT = 0;
  response.status(200).send("ok");

  visualise.startVisualise();
}

/**
 * Calculate a map of coordinates representing the board's current state
 * for the current move
 * @param {*} boardHeight
 * @param {*} boardWidth
 * @param {*} foodArray
 * @param {*} mySnake
 * @param {*} allSnakes
 * @returns Map();
 */

function createMapForMove(boardHeight, boardWidth, foodArray, mySnake, allSnakes, hazardArray) {
  const map = new Map();

  const snakeHeadCost = 100;
  const tunnelCost = 20;
  const hazardcost = 15;
  const defaultCost = 1;

  for (let x = 0; x < boardWidth; x++) {
    for (let y = 0; y < boardHeight; y++) {
      map.set(`${x},${y}`, {
        x,
        y,
        cost: boardHeight * boardWidth + 1,
        food: false,
        previous: null,
        direction: null,
        price: defaultCost,
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

  for (hazard of hazardArray) {
    // Get from the map
    let entry = map.get(`${food.x},${food.y}`);
    // Update
    entry.price = hazardcost;
    // Re-set in the map
    map.set(`${food.x},${food.y}`, entry);
  }

  // Set the price of the square to more than the longest possible path if it's only got less than 3 clear sides
  for (const [key, square] of map) {
    let clearAround = 0;
    clearAround += map.has(`${square.x + 1},${square.y}`) ? 1 : 0;
    clearAround += map.has(`${square.x - 1},${square.y}`) ? 1 : 0;
    clearAround += map.has(`${square.x},${square.y + 1}`) ? 1 : 0;
    clearAround += map.has(`${square.x},${square.y - 1}`) ? 1 : 0;

    if (clearAround < 3 && !square.food) {
      square.price = tunnelCost;
    }
    map.set(key, square);
  }
  // Remove all snakeParts from map
  // we cannot move here
  for (snake of allSnakes) {
    for (block of snake.body) {
      map.delete(`${block.x},${block.y}`);
    }

    // First element of the snake body is the head
    const head = snake.body[0];

    // Increase the price of squares around the other snake heads my snake is shorter
    // or same length
    if (snake.id !== mySnake.id && mySnake.body.length <= snake.body.length) {
      if (map.has(`${head.x - 1},${head.y}`)) {
        const mapBlock = map.get(`${head.x - 1},${head.y}`);
        mapBlock.price = snakeHeadCost;
        map.set(`${head.x - 1},${head.y}`, mapBlock);
      }

      if (map.has(`${head.x + 1},${head.y}`)) {
        const mapBlock = map.get(`${head.x + 1},${head.y}`);
        mapBlock.price = snakeHeadCost;
        map.set(`${head.x + 1},${head.y}`, mapBlock);
      }

      if (map.has(`${head.x},${head.y - 1}`)) {
        const mapBlock = map.get(`${head.x},${head.y - 1}`);
        mapBlock.price = snakeHeadCost;
        map.set(`${head.x},${head.y - 1}`, mapBlock);
      }

      if (map.has(`${head.x},${head.y + 1}`)) {
        const mapBlock = map.get(`${head.x},${head.y + 1}`);
        mapBlock.price = snakeHeadCost;
        map.set(`${head.x},${head.y + 1}`, mapBlock);
      }
    }
  }

  // Re add thisSnake head
  // this is the start of the pathing
  map.set(`${mySnake.head.x},${mySnake.head.y}`, {
    x: mySnake.head.x,
    y: mySnake.head.y,
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
  console.log("RUNNING: calculateCheapestFoodLocation()");
  const queue = [];

  // Put head square in queue
  queue.push(map.get(`${snakeHead.x},${snakeHead.y}`));

  while (queue.length > 0) {
    const currentSquare = queue.shift();
    visualise.addState(map, queue, currentSquare);

    if (currentSquare.food) {
      return currentSquare;
    }

    // squareAbove
    if ((squareAbove = map.get(`${currentSquare.x},${currentSquare.y + 1}`))) {
      const newCost = currentSquare.cost + 1;

      if (newCost < squareAbove.cost) {
        squareAbove.cost = currentSquare.cost + squareAbove.price;
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
        squareBelow.cost = currentSquare.cost + squareBelow.price;
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
        squareLeft.cost = currentSquare.cost + squareLeft.price;
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
        squareRight.cost = currentSquare.cost + squareRight.price;
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

/**
 *
 * @param {*} map
 * @param {*} snakeHead
 * @param {*} targetLocation
 * returns {x, y, cost, food, previous} || null
 */
function calculateCheapestPathToLocation(map, snakeHead, targetLocation) {
  console.log("RUNNING: calculateCheapestPathToLocation()");
  const queue = [];

  // Put head square in queue
  queue.push(map.get(`${snakeHead.x},${snakeHead.y}`));

  while (queue.length > 0) {
    const currentSquare = queue.shift();
    visualise.addState(map, queue, currentSquare);

    if (currentSquare.x === targetLocation.x && currentSquare.y === targetLocation.y) {
      return currentSquare;
    }

    // squareAbove
    if ((squareAbove = map.get(`${currentSquare.x},${currentSquare.y + 1}`))) {
      const newCost = currentSquare.cost + 1;

      if (newCost < squareAbove.cost) {
        squareAbove.cost = currentSquare.cost + squareAbove.price;
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
        squareBelow.cost = currentSquare.cost + squareBelow.price;
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
        squareLeft.cost = currentSquare.cost + squareLeft.price;
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
        squareRight.cost = currentSquare.cost + squareRight.price;
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
  console.log("RUNNING: getPath()");
  const path = [target];
  let thisBlock = target;

  while (thisBlock.cost > 1) {
    // this adds the item at the start of the array
    path.unshift(thisBlock.previous);
    thisBlock = thisBlock.previous;
  }

  return path.filter((square) => square.direction !== null);
}

function getFurthestOpenPoint(map, boardHeight, boardWidth) {
  console.log("RUNNING: getFurthestOpenPoint()");
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

function sortByArrayLength(a, b) {
  if (a.length < b.length) {
    return -1;
  }

  if (a.length > b.length) {
    return 1;
  }

  return 0;
}

function getShortestSnake(snakes) {
  const sortedArray = snakes.sort(sortByArrayLength);
  return sortedArray[0];
}

function handleMove(request, response) {
  var gameData = request.body;

  const possibleMoves = ["left", "right", "up", "down"];
  let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

  const { board } = gameData;

  const map = createMapForMove(
    board.height,
    board.width,
    board.food,
    gameData.you,
    board.snakes,
    board.hazards,
  );

  visualise.startMove(map);
  // IF health is >50, and a shorter snake exists, ATTACK!
  const snakeToAttack = getShortestSnake(board.snakes);
  let target;

  const iAmShortestSnek = gameData.you.id === snakeToAttack.id;

  if (
    !iAmShortestSnek &&
    gameData.you.health > 60 &&
    snakeToAttack.body.length < gameData.you.body.length
  ) {
    target = calculateCheapestPathToLocation(map, gameData.you.head, snakeToAttack.body[0]);
  } else {
    target = calculateCheapestFoodLocation(map, gameData.you.head);
  }

  if (target !== null) {
    const pathToFood = getPath(target);
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

  MOVE_COUNT++;

  console.log(`****WE ARE SENDING MOVE ${MOVE_COUNT}`, move, "****");
  response.status(200).send({
    move,
  });
}

function handleEnd(request, response) {
  const me = request.body.you.id;
  const areSnakes = request.body.board.snakes.length > 0;
  const winner = areSnakes ? request.body.board.snakes[0].id : null;

  if (winner === null) {
    console.log("DRAW!");
  } else {
    if (me === winner) {
      console.log("WINNER!");
    } else {
      console.log("LOSER!");
    }
  }

  response.status(200).send("ok");
}
