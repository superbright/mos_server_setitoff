import Koa from 'koa';
const app = new Koa();
import views from 'koa-views';
import IO from 'koa-socket';
const io = new IO();
import bodyParser from 'koa-bodyparser';
import api from './api';
import cors from 'kcors';
import websockify from 'koa-websocket';
import axios from 'axios'
import Timer from 'timer-machine'
import config from './config';
//import config from './config';
//import bodyParser from 'koa-bodyparser';
//import koaBody from 'koa-body';

app.use(cors({
  origin: '*',
}));
app.use(views(__dirname + '/views', {
  map: {
    html: 'underscore'
  }
}));
app.use(require('koa-static')("./static", {}));
app.use(bodyParser());
app.use(api.routes());
app.use(api.allowedMethods());
//inject config into context
app.context.config = config;
app.context.playerStates = playerConnectedStates;

// app time mode here
var timerInterval;
var timer = new Timer();

/** 
  * Total time for the experience, starting from the void scene.
  * @var {int}
  */
var totaltime = 420;

// A deep copy of the config file to clear all fields upon game reset.
var configReset = JSON.parse(JSON.stringify(config)); 
// Initialize player to play sound file for elevator scene.
var player = require('play-sound')({ player: "afplay" });

/** 
  * Player connection states for players 1 to 4 respectively. True if a handshake is returned; false otherwise.
  * @var {boolean[]}
  * @default
  */
var playerConnectedStates = [false, false, false, false];

/** 
  * Enum for game state.
  * @enum {number}
  */
const APPSTATE = {
  /** Guest page is active, gameplay page is inactive. Can be set from any state. */
  SETUP: 0,
  /** Guest page is active, gameplay page is active. Can only be set from SETUP. */
  READY: 1,
  /** Guest page is inactive, gameplay page is active. Can only be set from READY. */
  INGAME: 2,
  /** Broadcasts game is in END state then automatically set to SETUP. */
  END: 3,
  /** Broadcasts game is in RESET state then automatically set to SETUP. */
  RESET: 4,
}

/** 
  * Current game state.
  * @var {APPSTATE}
  * @default
  */
var currentState = APPSTATE.SETUP;

/**
  * Turns fans on.
  * @function
  */
function startFan() {
  console.log("start fan");

  // Access the page that turns fans on from the feather.
  axios.get(config.FAN_URL + "turnon").then(function(response){
    console.log(response.data); // ex.: { user: 'Your User'}
    console.log(response.status); // ex.: 200
  });
}

/**
  * Turns fans off.
  * @function
  */
function stopFan() {
  console.log("stop fan");

  // Access the page that turns fans off from the feather.
  axios.get(config.FAN_URL).then(function(response){
    console.log(response.data); // ex.: { user: 'Your User'}
    console.log(response.status); // ex.: 200
  });
}

/**
  * Turns fans on and off for a specified timestamp during the experience, starting from the void.
  * @function
  */
function checkFan() {
  let wastedtime = parseInt(timer.time()/1000);

  switch (wastedtime) {
    case 15:
      startFan();
      break;
    case 19:
      stopFan();
      break;
    case 22:
      startFan();
      break;
    case 29:
      stopFan();
      break;
    case 40:
      startFan();
      break;
    case 48:
      stopFan();
      break;
    case 52:
      startFan();
      break;
    case 60:
      stopFan();
      break;
    case 66:
      startFan();
      break;
    case 100:
      stopFan();
      break;
    default:
  }
}

/**
  * Starts the void scene. 
  * @function
  */
function startVoid() {
  timer.on('time', function (time) {
    //calculate fine thingy
    let wastedtime = parseInt(time/1000);

    // Prevent timer from going to negatives.
    if((wastedtime - totaltime) == 0) {
      timerReset();
    }

    // Fan controls.
    checkFan();

    let remaindertime = (totaltime - wastedtime);

    var minutes = Math.floor(remaindertime / 60);
    var seconds = remaindertime - minutes * 60;
    // send time to the control panel
    io.broadcast('time', {
      time: minutes + ":" + seconds
    });
  });

  timer.on('stop', function() {
    console.log('The timer stopped')
  });

  timer.start();

  timerInterval = setInterval(timer.emitTime.bind(timer), 1000);
}

/**
  * Resets game timer. The timer is used by the server to display to the front-end of the app and to control the fans during the experience. It is only called when the game ends or reset.
  * @function
  */
function timerReset() {
  timer.stop();
  timer = new Timer();
  clearInterval(timerInterval);

  // Display front-end timer to 0.
  io.broadcast('time', { time: 0 });
}

/**
  * Update player connection states.
  * @function
  */
function updatePlayerConnectedState() {
  // Default to false first.
  app.context.playerStates = [false, false, false, false];

  // Update playerStates to front-end. This captures the case in which all four computers are down.
  io.broadcast('playerConnectedStateResponse', app.context.playerStates);
  
  // Send out handshake to all players. This will update the playerStates, which is handled by playerConnectedStateResponse if a handshake is received.
  io.broadcast('playerHandshake', { my: 'data' });
}

/**
  * Sets game to SETUP state. Can be set from any state.
  * @function
  */
function stateSetup() {
  // Case if the game is in END state.
  if(currentState == APPSTATE.END) {
    // Clear player data.
    app.context.config = JSON.parse(JSON.stringify(configReset));

    // Update player data to computers.
    io.broadcast('updatePlayerData', 'updatePlayerData');

    // Reset playerStates.
    app.context.playerStates = [false, false, false, false];

    // Update playerStates to front-end. playerStates are defaulted to false when the game is in END state.
    io.broadcast('playerConnectedStateResponse', app.context.playerStates);

    // Update APPSTATE to END to front-end.
    io.broadcast('currentState', currentState);
  } 
  // Case if the game is in RESET state.
  else if(currentState == APPSTATE.RESET) {
    // Update player connection states.
    updatePlayerConnectedState();

    // Update APPSTATE to RESET to front-end.
    io.broadcast('currentState', currentState);
  }

  // Update APPSTATE to SETUP.
  currentState = APPSTATE.SETUP;

  // Update APPSTATE to SETUP to front-end.
  io.broadcast('currentState', currentState);
}


/**
  * Sets game to READY state. Can only be set from SETUP state.
  * @function
  */
function stateReady() {
  // Check to see if currentState is SETUP.
  if(currentState != APPSTATE.SETUP) {
    console.log("error");

    // Get currentState text.
    var stateGame;
    if(currentState == APPSTATE.SETUP) stateGame = 'SETUP';
    else if (currentState == APPSTATE.READY) stateGame = 'READY';
    else if (currentState == APPSTATE.INGAME) stateGame = 'INGAME';
    else if (currentState == APPSTATE.END) stateGame = 'END';
    else console.log("invalid state");

    // Sends out an error to front-end that the game is not in SETUP state.
    io.broadcast('errormessage', {
      data : "Game must be in SETUP state to proceed. It is currently in " + stateGame + " state."
    });
  } 
  // Game is in SETUP state.
  else {
    // Update APPSTATE to READY.
    currentState = APPSTATE.READY;

    // Update APPSTATE to READY to front-end.
    io.broadcast('currentState', currentState);

    // Update player data to computers.
    io.broadcast('updatePlayerData', 'updatePlayerData');

    // Update player connection states.
    updatePlayerConnectedState();
  }
}

/**
  * Sets game to INGAME state. Can only be set from READY state.
  * @function
  */
function stateIngame() {
  // Check to see if currentState is READY.
  if(currentState != APPSTATE.READY) {
    console.log("error");

    // Get currentState text.
    var stateGame;
    if(currentState == APPSTATE.SETUP) stateGame = 'SETUP';
    else if (currentState == APPSTATE.READY) stateGame = 'READY';
    else if (currentState == APPSTATE.INGAME) stateGame = 'INGAME';
    else if (currentState == APPSTATE.END) stateGame = 'END';
    else console.log("invalid state");

    // Sends out an error to front-end that the game is not in READY state.
    io.broadcast('errormessage', {
      data : "Game must be in READY state to proceed. It is currently in " + stateGame + " state."
    });
  } 
  // Game is in READY state.
  else {
    // Update player connection states.
    updatePlayerConnectedState();

    // Update player data to computers.
    io.broadcast('updatePlayerData', 'updatePlayerData');

    // Update APPSTATE to READY.
    currentState = APPSTATE.INGAME;

    // Update APPSTATE to READY to front-end.
    io.broadcast('currentState', currentState);
  }
}

/**
  * Unsure. May possibly be a socket message used by Unity.
  * @function
  */
io.on('connection', ( ctx, data ) => {
  console.log( 'join event fired', data )

  io.broadcast( 'hello', {
    numConnections: io.connections.size
  });
});

/**
  * Unsure. May possibly be a socket message used by Unity.
  */
io.on('vibon', ( ctx, data ) => {
  console.log(data);
  var dataarr = data.split(':');
  console.log({ set: dataarr[1], player: dataarr[0] });
  io.broadcast( 'dildon',{ set: dataarr[1], player: dataarr[0] });
});

/**
  * Unsure. May possibly be a socket message used by Unity.
  */
io.on('viboff', ( ctx, data ) => {
  console.log(data);
  var dataarr = data.split(':');
  console.log({ set: dataarr[1], player: dataarr[0] });
  io.broadcast( 'dildoff',{ set: dataarr[1], player: dataarr[0] });
});

/**
  * Unsure. May possibly be a socket message used by Unity.
  */
io.on('viboff', ( ctx, data ) => { 
  console.log(data); 
  io.broadcast( 'dildoff',data); 
});

/**
  * Turn vibrators on.
  */
io.on('dildon', ( ctx, data ) => {
  console.log("dildon ",data);
  io.broadcast('dildon',data);
});

/**
  * Turn vibrators off.
  */
io.on('dildoff', ( ctx, data ) => {
  console.log("dildoff ", data);
  io.broadcast('dildoff',data);
});

/**
  * Prints out message to console when vibrator is attempting to pair with the Raspberry Pi (unverified).
  */
io.on('pairing', ( ctx, data ) => {
  console.log("pairing vib ", data);
});

/**
  * Prints out message to console when vibrator is connected to the Raspberry Pi (unverified).
  */
io.on('connected', ( ctx, data ) => {
  console.log("vib is connected ", data);
});

/**
  * Connects vibrators to the Raspberry Pi (unverified).
  */
io.on('connectvib', ( ctx, data ) => {
  console.log("connect vib ", data);
  io.broadcast('connectvib',data);
});

/**
  * Sends handshake to each player.
  */
io.on('sendHandshakeToPlayer', ( ctx, data ) => {
  console.log("handshake ", data);
  io.broadcast('playerHandshake',data);
});

/**
  * Handles player handshake response. If a handshake is received, update the playerStates and send it out to the front-end.
  */
io.on('respondPlayerHandshake', ( ctx, data ) => {
  console.log("handshake return ", data);

  // Update playerStates.
  if(data == 'player1') app.context.playerStates[0] = true
  else if(data == 'player2') app.context.playerStates[1] = true
  else if(data == 'player3') app.context.playerStates[2] = true
  else if(data == 'player4') app.context.playerStates[3] = true

  // Update playerStates to front-end.
  io.broadcast('playerConnectedStateResponse', app.context.playerStates);
});

/**
  * Sends player connection states.
  */
io.on('updatePlayerConnectedState', (ctx, data) => {
  console.log('updated player connected state');
  updatePlayerConnectedState();
});

/**
  * Sends player tracking state.
  */
io.on('updateConnectionState', (ctx, data) => {
  console.log(data);
  io.broadcast('connectionState', data);
});

/**
  * Reconnects each player's tracking.
  */
io.on('reconnectTracking', (ctx, data) => {
  console.log('reconnect tracking');
  io.broadcast('reconnectMotive', data);
});

/**
  * Sends player data to computers.
  */
io.on('updateData', ( ctx, data ) => {
  console.log('update player data');
  io.broadcast('updatePlayerData', 'updatePlayerData');
});

/**
  * Sends currentState to front-end.
  */
io.on('getCurrentState', ( ctx, data) => {
  console.log('get current game state');
  io.broadcast('currentState', currentState);
});

/**
  * Sets game to SETUP state.
  */
io.on('stateSetup', (ctx, data) => {
  console.log('setup game state');
  stateSetup();
});

/**
  * Sets game to READY state.
  */
io.on('stateReady', (ctx, data) => {
  console.log('ready game state');
  stateReady();
});

/**
  * Sets game to INGAME state.
  */
io.on('stateIngame', (ctx, data) => {
  console.log('ingame game state');
  stateIngame();
});

/**
  * Turns fans on.
  */
io.on('fansOn', ( ctx, data ) => {
  console.log( 'turning fans on' );
  startFan();
});

/**
  * Turns fans off.
  */
io.on('fansOff', ( ctx, data ) => {
  console.log( 'turning fans off' );
  stopFan();
});

/**
  * Starts elevator scene.
  */
io.on('sceneElevator', (ctx, data) => {
  console.log('elevator scene');

  // Play elevator music to transducer.
  setTimeout(() => {
    console.log("play elevator");
    player.play('audio/ELEVATOR.wav', { aplay: [ '-v', 10 ] }, function(err){
      if (err) throw err
    });
  }, 1000);

  // Reconnects each player's tracking.
  setTimeout(() => {
    console.log("reconnect tracking");
    io.broadcast('reconnectMotive', { my: 'data' });
  }, 1000);

  // Restarts each vibrator's connection if they have been lost.
  console.log('reconnect to vibrators');
  io.broadcast('dildoff', { set: 'dildoff', player: 'player1vib' });
  io.broadcast('dildoff', { set: 'dildoff', player: 'player2vib' });
  io.broadcast('dildoff', { set: 'dildoff', player: 'player3vib' });
  io.broadcast('dildoff', { set: 'dildoff', player: 'player4vib' });

  // Starts elevator scene in Unity.
  io.broadcast('enterlobby', 'lobby');

  // Sends one more handshake to ensure game didn't crash.
  updatePlayerConnectedState();
});

/**
  * Starts void scene.
  */
io.on('sceneVoid', (ctx, data) => {
  console.log('void scene');

  // Checks if the void scene has already started.
  if(timer.isStarted()) {
    io.broadcast('errormessage', {
      data: "Experience already started"
    });
  } 
  // Void did not start.
  else {
    // Starts void scene.
    startVoid();
    
    // Starts void scene in Unity.
    io.broadcast('startvoid', 'startvoid');
  }
});

/**
  * Enables performer in Unity.
  */
io.on('performerEnable', (ctx, data) => {
  console.log("enablePerformer ", data);
  io.broadcast('enablePerformer',data);
});

/**
  * Disabled performer in Unity.
  */
io.on('performerDisable', (ctx, data) => {
  console.log("disablePerformer ", data);
  io.broadcast('disablePerformer',data);
});

/**
  * Starts exit scene in Unity.
  */
io.on('sceneExit', (ctx, data) => {
  console.log("exitScene ", data);
  io.broadcast('exitScene',data);
});

/**
  * Launches Unity with procssLauncher.
  */
io.on( 'gameLaunch', ( ctx, data ) => {
  console.log("call start game");
  io.broadcast( 'startGame');
});

/**
  * Closes Unity with processLauncher.
  */
io.on( 'gameClose', ( ctx, data ) => {
  console.log("call end game");
  io.broadcast( 'endGame');
});

/**
  * Restarts the entire experience, which inludes the app and Unity. Game state will be set to SETUP at the end.
  */
io.on('gameRestart', ( ctx, data ) => {
  // Sets currentState to END.
  currentState = APPSTATE.END;

  // Resets timer.
  timerReset();

  // Disconnects each player's tracking.
  io.broadcast('disconnectMotive', data);

  // Closes game after 3 seconds.
  setTimeout(function() {
    io.broadcast('endGame');
  }, 3000);

  // Sets game to SETUP state after 3.5 seconds. This allows the game to first close, which happens after 3 seconds, and then player connection to properly update.
  setTimeout(function() {
    stateSetup();
  }, 3500);

  // Opens game after 20 seconds.
  setTimeout(function() {
    io.broadcast('startGame');
  }, 20000);

  // Sends handshake to each player after 45 seconds.
  setTimeout(function() {
    io.broadcast('playerHandshake',data);
  }, 45000);
});

/**
  * Resets the experience, including the app and Unity. This does not wipe player data nor close Unity. Game state will be set to SETUP at the end.
  */
io.on('reset', (ctx, data) => {
  // Sets currentState to RESET.
  currentState = APPSTATE.RESET ;

  // Resets timer.
  timerReset();

  // Sets game to SETUP state.
  stateSetup();

  // Turns fans off.
  stopFan();

  // Starts reset scene in Unity.
  io.broadcast('resetscene', 'resetscene');

  // Sends out a message to front-end stating this action was a forced reset, not endgame.
  io.broadcast('errormessage', {
    data : "Game was reset during the middle of the experience. Please do not enter new data."
  });
});

io.attach( app )
export default app;