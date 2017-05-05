import Koa from 'koa';
import api from './api';
import views from 'koa-views';
import IO from 'koa-socket';

//import config from './config';
import bodyParser from 'koa-bodyparser';
import cors from 'kcors';
import websockify from 'koa-websocket';

const signS3 = require('koa-s3-sign-upload');

const io = new IO();

const app = websockify(new Koa())
.use(views(__dirname + '/views', {
  map: {
    html: 'underscore'
  }
})).use(cors({
      origin: '*',
    }))
  .use(bodyParser()).use(api.routes());

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


  io.on( 'connection', ( ctx, data ) => {
    console.log( 'join event fired', data )
    io.broadcast( 'hello', {
      numConnections: io.connections.size
    });
  });

  io.on('reset', ( ctx, data ) => {
    console.log( 'reset' );
    io.broadcast( 'resetscene', 'resetscene');
  });

  io.on('lobby', ( ctx, data ) => {
    console.log( 'lobby' );
    io.broadcast( 'enterlobby', 'lobby');
  });

  io.on('start', ( ctx, data ) => {
    console.log( 'start' );
    io.broadcast( 'startvoid', 'startvoid');
  });

    io.on('dumb', ( ctx, data ) => {
      io.broadcast( 'hello', {
        message: "dumb"
      });
    });

  io.attach( app )
export default app;
