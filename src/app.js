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

import config from './config';
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


// serial port initialization:
var serialport = require('serialport'), // include the serialport library
     SerialPort = serialport.SerialPort, // make a local instance of serial
     portName = "/dev/tty.usbmodem1411",
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
var totaltime = 300;

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

// var FeetToMeters = require("feet-to-meters");
// var ftm = new FeetToMeters();
// console.log(ftm.get(0.2));

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
  console.log( parseInt(timer.time()/1000) )

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

function startGame() {

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
}

 io.on('rotate', (ctx, data) => {

     setTimeout(() => {
       console.log("play elevator");
       player.play('audio/ELEVATOR.wav', { aplay: [ '-v', 10 ] }, function(err){
         if (err) throw err
       });
     }
     , 1000);

     setTimeout(() => {
       console.log("rotate elevator");
       var input = "3;3;3;3;";
       // convert the value to an ASCII string before sending it:
       console.log('Sending ' + input + ' out the serial port');
       myPort.write(input.toString());
       console.log("DONE");
     }
     , 1300);


 });

  io.on( 'connection', ( ctx, data ) => {
    console.log( 'join event fired', data )

    io.broadcast( 'hello', {
      numConnections: io.connections.size
    });
  });

  io.on( 'updateConnectionState', ( ctx, data ) => {
    console.log(data);
    io.broadcast( 'connectionState',data);
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

  io.on( 'viboff', ( ctx, data ) => {
    console.log(data);
    io.broadcast( 'dildoff',data);
  });

  io.on( 'recon', ( ctx, data ) => {
    io.broadcast( 'reconnectMotive',data);
  });

  io.on( 'startgame', ( ctx, data ) => {
    console.log("call start game");
    io.broadcast( 'startGame');
  });

  io.on( 'dildon', ( ctx, data ) => {
    console.log("dildon ",data);
    io.broadcast( 'dildon',data);
  });

  io.on( 'dildoff', ( ctx, data ) => {
    console.log("dildoff ", data);
    io.broadcast( 'dildoff',data);
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

  io.on( 'endgame', ( ctx, data ) => {
    io.broadcast( 'disconnectMotive',data);

    setTimeout(function() {
      io.broadcast( 'endGame');
    }, 3000);
  });

  io.on('reset', ( ctx, data ) => {
    console.log( 'reset' );
    endGame();

    io.broadcast( 'resetscene', 'resetscene');
  });

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
      startGame();
      io.broadcast( 'startvoid', 'startvoid');
    }

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
