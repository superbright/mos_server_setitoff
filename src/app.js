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
console.log("HAPTIC FAN URL " + config.FAN_URL);

const io = new IO();


//app.use(koaBody())
// .use(ctx => {
//   ctx.body = `Request Body: ${JSON.stringify(ctx.request.body)}`;
// })

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

var FeetToMeters = require("feet-to-meters");
var ftm = new FeetToMeters();
console.log(ftm.get(0.2));

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
