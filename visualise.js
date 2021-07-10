let state_list = [];

module.exports.startVisualise = function () {
  state_list = [];
};

module.exports.startMove = function () {
  state_list.push([]);
};
module.exports.addState = function (state, queue, current) {
  state_list[state_list.length - 1].push({
    state: deepClone(Array.from(state).map((m) => m[1])),
    current: deepClone(current),
    queue: deepClone(queue),
  });
};

module.exports.getData = function () {
  return state_list;
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
