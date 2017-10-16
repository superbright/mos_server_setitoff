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

import config from './config';

const io = new IO();

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

/* Serial port */
// serial port initialization
var serialport = require('serialport'), // include the serialport library
    SerialPort = serialport.SerialPort, // make a local instance of serial
    portName = "/dev/tty.usbmodem1461",
    portConfig = {
      baudRate: 9600,
      // call myPort.on('data') when a newline is received:
      parser: serialport.parsers.readline('\n')
    };

// open the serial port
var myPort = new SerialPort(portName, portConfig);
myPort.on('open', openPort); // called when the serial port opens

function openPort() {
  console.log('port open');
  console.log('baud rate: ' + myPort.options.baudRate);
}

/* Initialize variables */
var configReset = JSON.parse(JSON.stringify(config));
var player = require('play-sound')({ player: "afplay" });
var playerConnectedStates = [false, false, false, false]; // player handshake results

//inject config into context
app.context.config = config;
app.context.playerStates = playerConnectedStates;

/* Timer */
//app time mode here
var timerInterval;
var timer = new Timer();
var totaltime = 420;
var fantimes = [
  {
    start: 5,
    stop: 10
  },
  {
    start: 12,
    stop: 15
  }
];

/* Game state variables */
const APPSTATE = {
  SETUP: 0,
  READY: 1,
  INGAME: 2,
  END: 3,
}

var currentState = APPSTATE.SETUP;

/* Fans */
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

    if((wastedtime - totaltime) == 0) {
      timerReset();
    }

  //  fantimes.forEach(checkFan);
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

function timerReset() {
  timer.stop();
  //timer.reset();
  timer = new Timer();
  clearInterval(timerInterval);
  
  io.broadcast('time', { time: 0 });
}

/* Game state functions */
// Sets game to SETUP state. Can be set from any state.
function stateSetup() {
  if(currentState == APPSTATE.END) {
    // reset player data
    app.context.config = JSON.parse(JSON.stringify(configReset));

    // rebind player data
    io.broadcast('updatePlayerData', 'updatePlayerData');
    
    // reset playerConnectedStates (handshake)
    app.context.playerStates = [false, false, false, false];

    // broadcast endgame
    io.broadcast('currentState', currentState);
  }

  currentState = APPSTATE.SETUP;
  io.broadcast('currentState', currentState);
}

// Sets game to READY state. Can only be set from SETUP state.
function stateReady() {
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
      data : "Game must be in SETUP state to proceed. It is currently in " + stateGame + " state."
    });
  } else {
    currentState = APPSTATE.READY;
    io.broadcast('currentState', currentState);

    // rebind player data
    io.broadcast('updatePlayerData', 'updatePlayerData');
  }
}

// Sets game to INGAME state. Can only be set from READY state.
function stateIngame() {
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
      data : "Game must be in READY state to proceed. It is currently in " + stateGame + " state."
    });
  } else {
    currentState = APPSTATE.INGAME;
    io.broadcast('currentState', currentState);
  }
}

io.on('connection', ( ctx, data ) => {
  console.log( 'join event fired', data )

  io.broadcast( 'hello', {
    numConnections: io.connections.size
  });
});

/* Vibrators */
io.on('vibon', ( ctx, data ) => {
  console.log(data);
  var dataarr = data.split(':');
  console.log({ set: dataarr[1], player: dataarr[0] });
  io.broadcast( 'dildon',{ set: dataarr[1], player: dataarr[0] });
});

io.on('viboff', ( ctx, data ) => {
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

io.on('dildon', ( ctx, data ) => {
  console.log("dildon ",data);
  io.broadcast('dildon',data);
});

io.on('dildoff', ( ctx, data ) => {
  console.log("dildoff ", data);
  io.broadcast('dildoff',data);
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
  io.broadcast('connectvib',data);
});

/* Player connected states (handshake) */
// send handshake to each player
io.on('sendHandshakeToPlayer', ( ctx, data ) => {
  console.log("handshake ", data);
  io.broadcast('playerHandshake',data);
});

// receive handshake from each player
io.on('respondPlayerHandshake', ( ctx, data ) => {
  console.log("handshake return ", data);

  // update player connected states
  if(data == 'player1') app.context.playerStates[0] = true
  else if(data == 'player2') app.context.playerStates[1] = true
  else if(data == 'player3') app.context.playerStates[2] = true
  else if(data == 'player4') app.context.playerStates[3] = true

  io.broadcast('playerConnectedStateResponse', data);
});

/* Player tracking state */
io.on('updateConnectionState', (ctx, data) => {
  console.log(data);
  io.broadcast('connectionState', data);
});

io.on('reconnectTracking', (ctx, data) => {
  console.log('reconnect tracking');
  io.broadcast('reconnectMotive', data);
});

/* Rebind player data */
io.on('updateData', ( ctx, data ) => {
  console.log('update player data');
  io.broadcast('updatePlayerData', 'updatePlayerData');
});

/* Game state */
io.on('getCurrentState', ( ctx, data) => {
  console.log('get current game state');
  io.broadcast('currentState', currentState);
});

io.on('stateSetup', (ctx, data) => {
  console.log('setup game state');
  stateSetup();
});

io.on('stateReady', (ctx, data) => {
  console.log('ready game state');
  stateReady();
});

io.on('stateIngame', (ctx, data) => {
  console.log('ingame game state');
  stateIngame();
});

/* Fans */
io.on('fansOn', ( ctx, data ) => {
  console.log( 'turning fans on' );
  startFan();
});

io.on('fansOff', ( ctx, data ) => {
  console.log( 'turning fans off' );
  stopFan();
});

/* Elevators */
io.on('rotateAll', (ctx, data) => {
  setTimeout(() => {
    console.log("rotate all elevators");
    var input = "1;1;1;1;";
    // convert the value to an ASCII string before sending it:
    // console.log('Sending ' + input + ' out the serial port');
    myPort.write(input.toString());
    myPort.on('data', function(data) {
      console.log('data received: ' + data);
    });
    console.log("DONE");
  }, 1300);
});

io.on('rotateOne', (ctx, data) => {
  setTimeout(() => {
    console.log("rotate elevator one");
    var input = "1;0;0;0;";
    myPort.write(input.toString());
  }, 1300);
});

io.on('rotateTwo', (ctx, data) => {
  setTimeout(() => {
    console.log("rotate elevator two");
    var input = "0;1;0;0;";
    myPort.write(input.toString());
  }, 1300);
});

io.on('rotateThree', (ctx, data) => {
  setTimeout(() => {
    console.log("rotate elevator three");
    var input = "0;0;1;0;";
    myPort.write(input.toString());
  }, 1300);
});

io.on('rotateFour', (ctx, data) => {
  setTimeout(() => {
    console.log("rotate elevator four");
    var input = "0;0;0;1;";
    myPort.write(input.toString());
  }, 1300);
});

/* Experience */
io.on('sceneElevator', (ctx, data) => {
  console.log('elevator scene');

  // play elevator music
  setTimeout(() => {
    console.log("play elevator");
    player.play('audio/ELEVATOR.wav', { aplay: [ '-v', 10 ] }, function(err){
      if (err) throw err
    });
  }, 1000);

  // reconnect tracking
  setTimeout(() => {
    console.log("reconnect tracking");
    io.broadcast('reconnectMotive', { data: 'player1' });
    io.broadcast('reconnectMotive', { data: 'player2' });
    io.broadcast('reconnectMotive', { data: 'player3' });
    io.broadcast('reconnectMotive', { data: 'player4' });
  }, 1000);

  // restart vibrator
  console.log('reconnect to vibrators');
  io.broadcast('dildoff', { set: 'dildoff', player: 'player1vib' });
  io.broadcast('dildoff', { set: 'dildoff', player: 'player2vib' });
  io.broadcast('dildoff', { set: 'dildoff', player: 'player3vib' });
  io.broadcast('dildoff', { set: 'dildoff', player: 'player4vib' });

  io.broadcast('enterlobby', 'lobby');
});

io.on('sceneVoid', (ctx, data) => {
  console.log('void scene');

  //check if game is on
  if(timer.isStarted()) {
    io.broadcast('errormessage', {
      data: "Experience already started"
    });
  } else {
    startVoid();
    io.broadcast('startvoid', 'startvoid');
  }
});

io.on('enablePerformer', (ctx, data) => {
  console.log("enablePerformer ", data);
  io.broadcast('enablePerformer',data);
});

io.on('disablePerformer', (ctx, data) => {
  console.log("disablePerformer ", data);
  io.broadcast('disablePerformer',data);
});

io.on('sceneExit', (ctx, data) => {
  console.log("exitScene ", data);
  io.broadcast('exitScene',data);
});

io.on('gameRestart', ( ctx, data ) => {
  currentState = APPSTATE.END;

  timerReset();
  stateSetup();

  io.broadcast('disconnectMotive', data);

  // close game after 3 seconds
  setTimeout(function() {
    io.broadcast('endGame');
  }, 3000);

  // open game after 20 seconds
  setTimeout(function() {
    io.broadcast('startGame');
  }, 20000);

  // send handshake to player after 45 seconds
  setTimeout(function() {
    io.broadcast('playerHandshake',data);
  }, 45000);
});

io.on('reset', (ctx, data) => {
  console.log('reset');

  timerReset();
  stateSetup();
  stopFan();

  io.broadcast('resetscene', 'resetscene');
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