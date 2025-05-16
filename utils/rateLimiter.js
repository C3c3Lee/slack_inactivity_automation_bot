function sleep(h) {
  console.log(`Function: sleep(${h})`);
  return new Promise((resolve) => setTimeout(resolve, h * 60 * 60 * 1000));
}

module.exports = { sleep };