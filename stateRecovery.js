//File System
var fs = require("fs");

//Logging System
var logSystem = require('./logger');
var serverLog = logSystem.getServerLog();

//Variables
//every backupInterval seconds the game state is saved
var backupInterval = 10;

//ServerState
var state = require('./serverState');

//Paths to the files
const fileName1 = "saves/serverBackup.nbs";

const fileName2 = "saves/serverBackup2.nbs";

const fileName3 = "saves/serverBackup3.nbs";

var this_ = this;

//Functions

//starts saveServerState every backupInterval seconds with a 45sec delay
setTimeout(function () {
    setInterval(function () {
        this_.saveServerState();
    }, 1000 * backupInterval);
}, 40000);

/**
 * Determines the time between automatic game saves in seconds
 * Default value ist 10
 * @param timer new value for time between automatic game saves in seconds
 */
exports.setIntervalTimer = function (timer) {
    backupInterval = timer;
};

/***
 * This method can be called by the command line interface and per default every backInterval seconds
 * If a path is given the private method saveServerState is called with exactly this path
 * If no path is given the default backup policy is executed, which can be found in the documentation.
 */
exports.saveServerState = function (path) {
    if (path) {
        saveServerState(path);
    }
    else {
        //check if file 2 exists
        fs.access(fileName2, fs.F_OK, function (err) {
            if (err) {
                //File 2 does NOT exist
                //Write into file 3
                saveServerState(fileName3, function () {
                    //rename file 3 to file 2
                    fs.rename(fileName3, fileName2, function (err) {
                        if (err) {
                            serverLog.warn("1 Wasn\'t able to rename " + fileName3 + " to " + fileName2 + err);
                        }
                    });
                });
            }
            else {
                //File 2 does exist
                fs.access(fileName1, fs.F_OK, function (err) {
                    if (err) {
                        //File 1 NOT exist
                        //Write into file 3
                        saveServerState(fileName3, function () {
                            //rename file 2 to file 1
                            fs.rename(fileName2, fileName1, function (err) {
                                if (!err) {
                                    //rename file 3 to file 2
                                    fs.rename(fileName3, fileName2, function (err) {
                                        if (err) {
                                            serverLog.warn("2 Wasn\'t able to rename " + fileName3 + " to " + fileName2 + err);
                                        }
                                    });
                                }
                                else {
                                    serverLog.warn("3 Wasn\'t able to rename " + fileName2 + " to " + fileName1 + err);
                                }
                            });
                        });
                    }
                    else {
                        //File 1 exist
                        //rename file 1 to file 3
                        fs.rename(fileName1, fileName3, function (err) {
                            if (!err) {
                                //write into file 3 (in combination whit the last rename, that delets file 1)
                                saveServerState(fileName3, function () {
                                    //rename file 2 to file 1
                                    fs.rename(fileName2, fileName1, function (err) {
                                        if (!err) {
                                            //rename file 3 to file 2
                                            fs.rename(fileName3, fileName2, function (err) {
                                                if (err) {
                                                    serverLog.warn("4 Wasn\'t able to rename " + fileName3 + " to " + fileName2 + err);
                                                }
                                            });
                                        }
                                        else {
                                            serverLog.warn("5 Wasn\'t able to rename " + fileName2 + " to " + fileName1 + err);
                                        }
                                    });
                                });
                            }
                            else {
                                serverLog.warn("6 Wasn\'t able to rename " + fileName1 + " to " + fileName3 + err);
                            }
                        });
                    }
                });
            }
        });
    }
};

/***
 * saves a game state string into the given path and calls the callback if successful
 */
function saveServerState(path, callback) {
    //get the game string which will be written into the backup file
    var data = state.getGameStateString();
    //check if the file already exists
    fs.access(path, fs.F_OK, function (err) {
        if (!err) {
            //if the file already exists we need write permissions
            fs.access(path, fs.W_OK, function (err) {
                if (!err) {
                    //we have write permission and try to open the file
                    fs.open(path, "w", function (err, fd) {
                        if (!err) {
                            //the file was opened and we can start writing
                            fs.writeFile(path, data, function (err) {
                                if (err) {
                                    serverLog.error(err);
                                }
                                else {
                                    serverLog.debug("Game state successfully saved");
                                    fs.close(fd);
                                    //if everything was successful the callback must be executed
                                    if (callback) {
                                        callback();
                                    }
                                }
                            });
                        }
                        else {
                            serverLog.warn("Unexpected error while opening file " + path);
                        }
                    });
                }
                else {
                    serverLog.warn("No permission to write file " + path);
                }
            });
        }
        else {
            //The file does not already exist
            //If file does not exist it automatically will be created by the open command
            //Default mode when creating a file is 0666
            fs.open(path, "w", function (err, fd) {
                if (!err) {
                    //The file was opened and we can start writing
                    fs.writeFile(path, data, function (err) {
                        if (err) {
                            serverLog.error(err);
                        }
                        else {
                            serverLog.debug("Game state successfully saved");
                            fs.close(fd);
                            //if everything was successful the callback must be executed
                            if (callback) {
                                callback();
                            }
                        }
                    });
                }
                else {
                    serverLog.warn("Unexpected error while opening file " + path);
                }
            });
        }
    });
}

/**
 * Can be called by the command line interface or on start of server
 * If a path is given the method tries to load a server state from that path
 * If no path is given the default backup policy is executed
 * Details to the backup policy can be found in the documentation
 */
exports.loadServerState = function (path) {
    if (path) {
        fs.access(path, fs.F_OK, function (err) {
            if (!err) {
                loadServerState(path);
            }
            else {
                serverLog.warn("File " + path + " does not exist or is not visible for the program")
            }
        })
    }
    else {
        fs.access(fileName2, fs.F_OK, function (err) {
            if (!err) {
                loadServerState(fileName2);
            }
            else {
                fs.access(fileName1, fs.F_OK, function (err) {
                    if (!err) {
                        loadServerState(fileName1);
                    }
                    else {
                        state.resetServer();
                    }
                });
            }
        })
    }
};

//Tries to load a server state from a given path
//If loading fails for one of the default game state paths the server is reset
function loadServerState(path) {
    //Check if there is a read permission
    fs.access(path, fs.R_OK, function (err) {
        if (!err) {
            //Get the stats, to optimize the buffer length
            fs.stat(path, function (err, stats) {
                if (!err) {
                    //open the file
                    fs.open(path, "r", function (err, fd) {
                        if (!err) {
                            var buffer = new Buffer(stats.size);
                            if (stats.size < 1) {
                                //an empty file would crash fs.read => reset instead
                                state.resetServer();
                                return;
                            }
                            //read from the file
                            fs.read(fd, buffer, 0, buffer.length, null, function (err, bytesRead, buffer) {
                                if (!err) {
                                    var data = buffer.toString("utf8", 0, buffer.length);
                                    state.setGameStateByString(data);
                                    fs.close(fd);
                                }
                                else {
                                    serverLog.warn("Unexpected error while reading file " + path);
                                    if (path == fileName2 || path == fileName1) {
                                        state.resetServer();
                                    }
                                }
                            });
                        }
                        else {
                            serverLog.warn("Unexpected error while opening file " + path);
                            if (path == fileName2 || path == fileName1) {
                                state.resetServer();
                            }
                        }
                    });
                }
                else {
                    serverLog.warn("Unexpected error while acquiring stats of file " + path);
                    if (path == fileName2 || path == fileName1) {
                        state.resetServer();
                    }
                }
            });
        }
        else {
            serverLog.warn("No permission to read file " + path);
            if (path == fileName2 || path == fileName1) {
                state.resetServer();
            }
        }
    });
}

