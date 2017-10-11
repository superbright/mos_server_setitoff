import Koa from 'koa';

import views from 'koa-views';
import IO from 'koa-socket';

//import config from './config';
//import bodyParser from 'koa-bodyparser';
const app = new Koa();
//import koaBody from 'koa-body';
import bodyParser from 'koa-bodyparser';
import api from './api';

import cors from 'kcors';
import websockify from 'koa-websocket';
import axios from 'axios'
import Timer from 'timer-machine'

var player = require('play-sound')({player: "afplay"});

// player handshake results
var playerConnectedStates = [false, false, false, false];

import config from './config';
var configReset = JSON.parse(JSON.stringify(config));
console.log("HAPTIC FAN URL " + config.FAN_URL);

const io = new IO();

app.use(cors({
      origin: '*',
}))
app.use(views(__dirname + '/views', {
  map: {
    html: 'underscore'
  }
}))
app.use(require('koa-static')("./static", {}));
app.use(bodyParser())
app.use(api.routes())
app.use(api.allowedMethods());
//inject config into context
app.context.config = config;
app.context.playerStates = playerConnectedStates;

// serial port initialization:
var serialport = require('serialport'), // include the serialport library
    SerialPort = serialport.SerialPort, // make a local instance of serial
    portName = "/dev/tty.usbmodem1461",
    portConfig = {
      baudRate: 9600,
      // call myPort.on('data') when a newline is received:
      parser: serialport.parsers.readline('\n')
    };

// open the serial port:
var myPort = new SerialPort(portName, portConfig);
myPort.on('open', openPort); // called when the serial port opens

function openPort() {
  console.log('port open');
  console.log('baud rate: ' + myPort.options.baudRate);
}

//app time mode here
var timerInterval;
var timer = new Timer();
var totaltime = 420;
var fantimes=[
  {
    start: 5,
    stop: 10
  },
  {
    start: 12,
    stop: 15
  }
]

/* Game state variables */
const APPSTATE = {
  SETUP: 0,
  READY: 1,
  INGAME: 2,
  END: 3,
}
var currentState = APPSTATE.SETUP;

/* Haptic funtions */
function startFan() {
  console.log("start fan");
  //return;
  axios.get(config.FAN_URL + "turnon").then(function(response){
    console.log(response.data); // ex.: { user: 'Your User'}
    console.log(response.status); // ex.: 200
  });
}

function stopFan() {
  console.log("stop fan");
  //return;
  axios.get(config.FAN_URL).then(function(response){
    console.log(response.data); // ex.: { user: 'Your User'}
    console.log(response.status); // ex.: 200
  });
}

//element, index, array
function checkFan() {
  //console.log('a[' + index + '] = ' + element['start']);
  //console.log( parseInt(timer.time()/1000) )

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
  //
  // if(wastedtime < 30 && wastedtime > 15) {
  //
  //     if( (wastedtime % 3) == 0) {
  //         startFan();
  //     } else if( (wastedtime % 5) == 0) {
  //         stopFan();
  //     }
  // }  if(wastedtime < 60  && wastedtime > 40) {
  //
  //       if( (wastedtime % 3) == 0) {
  //           startFan();
  //       } else if( (wastedtime % 7) == 0) {
  //           stopFan();
  //       }
  //   }
  //   else if(wastedtime > 60 && wastedtime < 105) {
  //
  //     if( wastedtime  == 60) {
  //         startFan();
  //     } else if( wastedtime == 104) {
  //         stopFan();
  //     }
  //
  // }
  // else if(wastedtime == 300) {
  //         stopFan();
  // }
}

/* Game functions */
function startVoid() {
  timer.on('time', function (time) {

    //calculate fine thingy
    let wastedtime = parseInt(time/1000);

    if( (wastedtime - totaltime) == 0) {
      endGame();
    }

  //  fantimes.forEach(checkFan);
    checkFan();

    let remaindertime = (totaltime - wastedtime);

    var minutes = Math.floor(remaindertime / 60);
    var seconds = remaindertime - minutes * 60;
    // send time to the control panel
    io.broadcast( 'time', {
      time: minutes + ":" + seconds
    });

  })
  timer.on('stop', function () {
    console.log('The timer stopped')
  })
  timer.start()
  timerInterval = setInterval(timer.emitTime.bind(timer), 1000)
}

function endGame() {
  timer.stop();
  //timer.reset();
  timer = new Timer();
  clearInterval(timerInterval);
  
  io.broadcast( 'time', { time: 0 });
}

/* Game state functions */
// DONE called by endgame after all games are destroyed by process launcher (called by socketmessage endgame)
// DONE OR if someone presses the reset button
// DONE OR if someone toggles the ready button off
function resetGame() {
  // reset JSON data - turn all ison to false and reset gender
  // send socket message to reset ready toggle to off on guest page
  // DONE make the current app state to SETUP
  // DONE send socket message to gameplay UI to update state
  // DONE send socket message to guests page to reset all data on UI

  if(currentState == APPSTATE.END) {
    // reset data
    console.log(configReset);
    app.context.config = JSON.parse(JSON.stringify(configReset));;
  }

  playerConnectedStates = [false, false, false, false];

  // rebind player data
  io.broadcast( 'updatePlayerData', 'updatePlayerData');
  io.broadcast('currentState', currentState);
  
  currentState = APPSTATE.SETUP;
}

// DONE called by toggle from guests page
function readyGame() {
  // DONE if current state is not setup, send an error message back to guests page saying: current state
  // DONE update all the data one last time
  // DONE (same as above?) send socket message to backpacks to update JSON file updatePlayerData socket message
  // DONE (skeleton in place) send socket message to gameplay UI to update state
  // DONE IF ready state is toggled off, BACK to setup mode with similar restrictions to gameplay UI and guests page
  // DONE sets current state to READY
  if(currentState != APPSTATE.SETUP) {
    console.log("error");
    
    // get currentState text
    var stateGame;
    if(currentState == APPSTATE.SETUP) stateGame = 'SETUP';
    else if (currentState == APPSTATE.READY) stateGame = 'READY';
    else if (currentState == APPSTATE.INGAME) stateGame = 'INGAME';
    else if (currentState == APPSTATE.END) stateGame = 'END';
    else console.log("invalid state");

    io.broadcast('errormessage', {
      data : "Game must be in SETUP state to proceed. It is currently in " + stateGame + " state." });
  } else {
    currentState = APPSTATE.READY;

    // rebind player data
    io.broadcast( 'updatePlayerData', 'updatePlayerData');
  }
}

// DONE called by start game button on gameplay UI
function startGame() {
  // DONE check if the current state is ready; if not send error message saying not ready to start
  // DONE if state is ready, change state to INGAME 
  // DONE this allows all buttons on gameplay UI to be useable -- moved to ready state instead
  if(currentState != APPSTATE.READY) {
    console.log("error");
    
    // get currentState text
    var stateGame;
    if(currentState == APPSTATE.SETUP) stateGame = 'SETUP';
    else if (currentState == APPSTATE.READY) stateGame = 'READY';
    else if (currentState == APPSTATE.INGAME) stateGame = 'INGAME';
    else if (currentState == APPSTATE.END) stateGame = 'END';
    else console.log("invalid state");

    io.broadcast('errormessage', {
      data : "Game must be in READY state to proceed. It is currently in " + stateGame + " state." });
  } else {
    currentState = APPSTATE.INGAME;

    // rebind player data
    io.broadcast( 'updatePlayerData', 'updatePlayerData');
  }
}

io.on( 'connection', ( ctx, data ) => {
  console.log( 'join event fired', data )

  io.broadcast( 'hello', {
    numConnections: io.connections.size
  });
});

io.on( 'vibon', ( ctx, data ) => {
  console.log(data);
  var dataarr = data.split(':');
  console.log({ set: dataarr[1], player: dataarr[0] });
  io.broadcast( 'dildon',{ set: dataarr[1], player: dataarr[0] });
});

io.on( 'viboff', ( ctx, data ) => {
  console.log(data);
  var dataarr = data.split(':');
  console.log({ set: dataarr[1], player: dataarr[0] });
  io.broadcast( 'dildoff',{ set: dataarr[1], player: dataarr[0] });
});

// unneeded?
/*io.on( 'viboff', ( ctx, data ) => {
  console.log(data);
  io.broadcast( 'dildoff',data);
});*/

io.on( 'recon', ( ctx, data ) => {
  io.broadcast( 'reconnectMotive',data);
});

io.on( 'dildon', ( ctx, data ) => {
  console.log("dildon ",data);
  io.broadcast( 'dildon',data);
});

io.on( 'dildoff', ( ctx, data ) => {
  console.log("dildoff ", data);
  io.broadcast( 'dildoff',data);
});

io.on( 'sendHandshakeToPlayer', ( ctx, data ) => {
  console.log("handshake ", data);
  io.broadcast( 'playerHandshake',data);
});

io.on( 'respondPlayerHandshake', ( ctx, data ) => {
  console.log("handshake return ", data);
  // if player 1, then make playerConnectedStates[0] = true

  if(data == 'player1') playerConnectedStates[0] = true
  else if(data == 'player2') playerConnectedStates[1] = true
  else if(data == 'player3') playerConnectedStates[2] = true
  else if(data == 'player4') playerConnectedStates[3] = true

  io.broadcast('playerConnectedStateResponse',data);  
});

//'pairing' and 'connected'
io.on('pairing', ( ctx, data ) => {
    console.log("pairing vib ", data);
  //io.broadcast( 'pairing',data);
});

io.on('connected', ( ctx, data ) => {
    console.log("vib is connected ", data);
  //io.broadcast( 'pairing',data);
});

io.on('connectvib', ( ctx, data ) => {
    console.log("connect vib ", data);
   io.broadcast( 'connectvib',data);
});

/* Server */
io.on( 'updateConnectionState', ( ctx, data ) => {
  console.log(data);
  io.broadcast('connectionState',data);
});

io.on('updateData', ( ctx, data ) => {
  console.log( 'update player data' );
  io.broadcast( 'updatePlayerData', 'updatePlayerData');
  io.broadcast( 'playerHandshake', data);
});

io.on('reset', ( ctx, data ) => {
  console.log( 'reset' );
  endGame();
  resetGame();
  io.broadcast( 'resetscene', 'resetscene');
  io.broadcast('currentState', currentState);
});

io.on( 'getCurrentState' , ( ctx, data) => {
  console.log( 'get current game state' );
  io.broadcast('currentState', currentState);
});

io.on('stateSetup', (ctx, data) => {
  console.log('setup game state');
  resetGame();
  io.broadcast('currentState', currentState);
});

io.on('stateReady', (ctx, data) => {
  console.log('ready game state');
  readyGame();
  io.broadcast('currentState', currentState);
});

io.on('stateIngame', (ctx, data) => {
  console.log('ingame game state');
  startGame();
  io.broadcast('currentState', currentState);
});

/* Haptic */
io.on('fans-on', ( ctx, data ) => {
  console.log( 'turning fans on' );
  startFan();
});

io.on('fans-off', ( ctx, data ) => {
  console.log( 'turning fans off' );
  stopFan();
});

io.on('rotate', (ctx, data) => {
  setTimeout(() => {
    console.log("rotate elevator");
    var input = "3;3;3;3;";
    // convert the value to an ASCII string before sending it:
    // console.log('Sending ' + input + ' out the serial port');
    myPort.write(input.toString());
    console.log("DONE");
  }, 1300);
});

/* Experience */
// combined to engame process
/*io.on( 'startgame', ( ctx, data ) => {
  console.log("call start game");
  io.broadcast( 'startGame');
});*/

io.on('lobby', ( ctx, data ) => {
  console.log( 'lobby' );
  setTimeout(() => {
    console.log("play elevator");
    player.play('audio/ELEVATOR.wav', { aplay: [ '-v', 10 ] }, function(err){
      if (err) throw err
    });
  }
  , 1000);

  io.broadcast( 'enterlobby', 'lobby');
});

io.on('start', ( ctx, data ) => {
  console.log( 'start' );
  //check if game is on
  if(timer.isStarted()) {
    io.broadcast( 'errormessage', {
      data : "Experience already started"
    });
  } else {
    startVoid();
    io.broadcast( 'startvoid', 'startvoid');
  }
});

io.on( 'enablePerformer', ( ctx, data ) => {
  console.log("enablePerformer ", data);
  io.broadcast( 'enablePerformer',data);
});

io.on( 'disablePerformer', ( ctx, data ) => {
  console.log("disablePerformer ", data);
  io.broadcast( 'disablePerformer',data);
});

io.on( 'exitScene', ( ctx, data ) => {
  console.log("exitScene ", data);
  io.broadcast( 'exitScene',data);
});

io.on( 'endgame-cp', ( ctx, data ) => {
  currentState = APPSTATE.END;
  endGame();
  resetGame();

  io.broadcast('disconnectMotive',data);

  // close game
  setTimeout(function() {
    io.broadcast('endGame');
  }, 3000);

  // open game after 1 minute
  setTimeout(function() {
    io.broadcast('startGame');
  }, 30000);
});

io.attach( app )
export default app;

// var SerialPort = require('serialport', {
//    baudRate: 115200
// });
// var port = new SerialPort('/dev/cu.usbmodem1431');
//
//
// port.on('open', function() {
//
// });
//
// port.on('data', function (data) {
//   //console.log(data.toString());
//   io.broadcast( 'door', data.toString());
// });