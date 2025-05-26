/**
 * Sleep for a given number of hours (converted to ms).
 * @param {number} h - Number of hours to sleep
 */
function sleep(h) {
  console.log(`Function: sleep(${h})`);
  return new Promise((resolve) => setTimeout(resolve, h * 60 * 60 * 1000));
}

module.exports = { sleep };