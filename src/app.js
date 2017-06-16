import Koa from 'koa';
import api from './api';
import views from 'koa-views';
import IO from 'koa-socket';

//import config from './config';
import bodyParser from 'koa-bodyparser';
import cors from 'kcors';
import websockify from 'koa-websocket';

import axios from 'axios'
import Timer from 'timer-machine'
//var myTimer = new Timer()

// -> time in ms

import config from './config';
console.log("HAPTIC FAN URL " + config.FAN_URL);

const signS3 = require('koa-s3-sign-upload');

const io = new IO();
const app = new Koa();

app.use(cors({
      origin: '*',
}))
.use(views(__dirname + '/views', {
  map: {
    html: 'underscore'
  }
}))
.use(bodyParser())
// .use(async ctx => {
//   // the parsed body will store in ctx.request.body
//   // if nothing was parsed, body will be an empty object {}
//   ctx.body = ctx.request.body;
// })
.use(api.routes())
.use(api.allowedMethods())
.use(require('koa-static')("./static", {}));

//inject config into context
app.context.config = config;

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

  if(wastedtime < 180 && wastedtime > 75) {
      console.log("what");
      if( (wastedtime % 10) == 0) {
          startFan();
      } else if( (wastedtime % 5) == 0) {
          stopFan();
      }
  } else if(wastedtime > 180 && wastedtime < 210) {

      if( wastedtime  == 181) {
          startFan();
      } else if( wastedtime == 209) {
          stopFan();
      }

  } else if(wastedtime > 210 && wastedtime < 280) {

      if( (wastedtime % 10) == 0) {
          startFan();
      } else if( (wastedtime % 5) == 0) {
          stopFan();
      }
  }

  else if(wastedtime == 300) {
          stopFan();
  }


  // if(wastedtime == element['start']) {
  //   console.log("start fan");
  //   startFan()
  // }
  // if(wastedtime == element['stop']) {
  //   console.log("stop fan");
  //   stopFan()
  // }
}

function startGame() {

  timer.on('time', function (time) {
  //  console.log('Current time: ' + time + 'ms')
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

  io.on( 'connection', ( ctx, data ) => {
    console.log( 'join event fired', data )
    io.broadcast( 'hello', {
      numConnections: io.connections.size
    });
  });

  io.on('reset', ( ctx, data ) => {
    console.log( 'reset' );
    endGame();

    io.broadcast( 'resetscene', 'resetscene');
  });

  io.on('lobby', ( ctx, data ) => {
    console.log( 'lobby' );
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


/*
setTimeout(function() {
  axios.get(config.FAN_URL + "turnon").then(function(response){
    console.log(response.data); // ex.: { user: 'Your User'}
    console.log(response.status); // ex.: 200
  });
}, 3000);

setTimeout(function() {
  axios.get(config.FAN_URL).then(function(response){
    console.log(response.data); // ex.: { user: 'Your User'}
    console.log(response.status); // ex.: 200
  });
}, 10000);
*/



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
