let logFileName = null;

function setLogFileName(name) {
  logFileName = name;
}

function getLogFileName() {
  return logFileName;
}

module.exports = { setLogFileName, getLogFileName };