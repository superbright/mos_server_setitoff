'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _koaViews = require('koa-views');

var _koaViews2 = _interopRequireDefault(_koaViews);

var _koaSocket = require('koa-socket');

var _koaSocket2 = _interopRequireDefault(_koaSocket);

var _koaBodyparser = require('koa-bodyparser');

var _koaBodyparser2 = _interopRequireDefault(_koaBodyparser);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

var _kcors = require('kcors');

var _kcors2 = _interopRequireDefault(_kcors);

var _koaWebsocket = require('koa-websocket');

var _koaWebsocket2 = _interopRequireDefault(_koaWebsocket);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _timerMachine = require('timer-machine');

var _timerMachine2 = _interopRequireDefault(_timerMachine);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import config from './config';
//import bodyParser from 'koa-bodyparser';
var app = new _koa2.default();
//import koaBody from 'koa-body';


var player = require('play-sound')({ player: "afplay" });

console.log("HAPTIC FAN URL " + _config2.default.FAN_URL);

var io = new _koaSocket2.default();

app.use((0, _kcors2.default)({
  origin: '*'
}));
app.use((0, _koaViews2.default)(__dirname + '/views', {
  map: {
    html: 'underscore'
  }
}));
app.use(require('koa-static')("./static", {}));
app.use((0, _koaBodyparser2.default)());
app.use(_api2.default.routes());
app.use(_api2.default.allowedMethods());
//inject config into context
app.context.config = _config2.default;

// serial port initialization:
var serialport = require('serialport'),
    // include the serialport library
SerialPort = serialport.SerialPort,
    // make a local instance of serial
portName = "/dev/tty.usbmodem1411",
    portConfig = {
  baudRate: 9600,
  // call myPort.on('data') when a newline is received:
  parser: serialport.parsers.readline('\n')
};

// open the serial port:
//var myPort = new SerialPort(portName, portConfig);
//myPort.on('open', openPort); // called when the serial port opens


function openPort() {
  console.log('port open');
  console.log('baud rate: ' + myPort.options.baudRate);
}

//app time mode here
var timerInterval;
var timer = new _timerMachine2.default();
var totaltime = 300;

var fantimes = [{
  start: 5,
  stop: 10
}, {
  start: 12,
  stop: 15
}];

// var FeetToMeters = require("feet-to-meters");
// var ftm = new FeetToMeters();
// console.log(ftm.get(0.2));

function startFan() {
  console.log("start fan");
  //return;
  _axios2.default.get(_config2.default.FAN_URL + "turnon").then(function (response) {
    console.log(response.data); // ex.: { user: 'Your User'}
    console.log(response.status); // ex.: 200
  });
}

function stopFan() {
  console.log("stop fan");
  //return;
  _axios2.default.get(_config2.default.FAN_URL).then(function (response) {
    console.log(response.data); // ex.: { user: 'Your User'}
    console.log(response.status); // ex.: 200
  });
}

//element, index, array
function checkFan() {
  //console.log('a[' + index + '] = ' + element['start']);
  console.log(parseInt(timer.time() / 1000));

  var wastedtime = parseInt(timer.time() / 1000);

  if (wastedtime < 180 && wastedtime > 75) {

    if (wastedtime % 10 == 0) {
      startFan();
    } else if (wastedtime % 5 == 0) {
      stopFan();
    }
  } else if (wastedtime > 180 && wastedtime < 210) {

    if (wastedtime == 181) {
      startFan();
    } else if (wastedtime == 209) {
      stopFan();
    }
  } else if (wastedtime > 210 && wastedtime < 280) {

    if (wastedtime % 10 == 0) {
      startFan();
    } else if (wastedtime % 5 == 0) {
      stopFan();
    }
  } else if (wastedtime == 300) {
    stopFan();
  }
}

function startGame() {

  timer.on('time', function (time) {

    //calculate fine thingy
    var wastedtime = parseInt(time / 1000);

    if (wastedtime - totaltime == 0) {
      endGame();
    }

    //  fantimes.forEach(checkFan);
    checkFan();

    var remaindertime = totaltime - wastedtime;

    var minutes = Math.floor(remaindertime / 60);
    var seconds = remaindertime - minutes * 60;
    // send time to the control panel
    io.broadcast('time', {
      time: minutes + ":" + seconds
    });
  });
  timer.on('stop', function () {
    console.log('The timer stopped');
  });
  timer.start();
  timerInterval = setInterval(timer.emitTime.bind(timer), 1000);
}

function endGame() {
  timer.stop();
  //timer.reset();
  timer = new _timerMachine2.default();
  clearInterval(timerInterval);
}

io.on('rotate', function (ctx, data) {
  var input = "3;3;3;3;";
  // convert the value to an ASCII string before sending it:
  console.log('Sending ' + input + ' out the serial port');
  myPort.write(input.toString());
  console.log("DONE");
});

io.on('connection', function (ctx, data) {
  console.log('join event fired', data);

  io.broadcast('hello', {
    numConnections: io.connections.size
  });
});
io.on('updateConnectionState', function (ctx, data) {
  console.log(data);
  io.broadcast('connectionState', data);
});

io.on('recon', function (ctx, data) {
  io.broadcast('reconnectMotive', data);
});

io.on('startgame', function (ctx, data) {
  console.log("call start game");
  io.broadcast('startGame');
});

io.on('dildon', function (ctx, data) {
  console.log("dildon");
  io.broadcast('dildon', data);
});

io.on('dildoff', function (ctx, data) {
  console.log("dildoff");
  io.broadcast('dildoff', data);
});

io.on('endgame', function (ctx, data) {
  io.broadcast('disconnectMotive', data);

  setTimeout(function () {
    io.broadcast('endGame');
  }, 3000);
});

io.on('reset', function (ctx, data) {
  console.log('reset');
  endGame();

  io.broadcast('resetscene', 'resetscene');
});

io.on('lobby', function (ctx, data) {
  console.log('lobby');
  setTimeout(function () {
    console.log("play");
    player.play('audio/ELEVATOR.wav', { aplay: ['-v', 10] }, function (err) {
      if (err) throw err;
    });
  }, 1000);

  io.broadcast('enterlobby', 'lobby');
});

io.on('start', function (ctx, data) {
  console.log('start');
  //check if game is on
  if (timer.isStarted()) {
    io.broadcast('errormessage', {
      data: "Experience already started"
    });
  } else {
    startGame();
    io.broadcast('startvoid', 'startvoid');
  }
});

io.attach(app);
exports.default = app;

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