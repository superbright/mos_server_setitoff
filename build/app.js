'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

var _koaViews = require('koa-views');

var _koaViews2 = _interopRequireDefault(_koaViews);

var _koaSocket = require('koa-socket');

var _koaSocket2 = _interopRequireDefault(_koaSocket);

var _koaBodyparser = require('koa-bodyparser');

var _koaBodyparser2 = _interopRequireDefault(_koaBodyparser);

var _kcors = require('kcors');

var _kcors2 = _interopRequireDefault(_kcors);

var _koaWebsocket = require('koa-websocket');

var _koaWebsocket2 = _interopRequireDefault(_koaWebsocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var io = new _koaSocket2.default();

//import config from './config';


var app = (0, _koaWebsocket2.default)(new _koa2.default()).use((0, _koaViews2.default)(__dirname + '/views', {
  map: {
    html: 'underscore'
  }
})).use((0, _kcors2.default)())
// .use(async (ctx, next) => {
//   ctx.state.collections = config.collections;
//   ctx.state.authorizationHeader = 'Key ' + config.key;
//   await next();
// })
.use((0, _koaBodyparser2.default)()) //{ enableTypes: ['json'] }
.use(function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(ctx, next) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            ctx.body = ctx.request.body;
            _context.next = 3;
            return next();

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}()).use(_api2.default.routes());

io.on('connection', function (ctx, data) {
  console.log('join event fired', data);
  io.broadcast('hello', {
    numConnections: io.connections.size
  });
});

io.on('dumb', function (ctx, data) {
  io.broadcast('hello', {
    message: "dumb"
  });
});

io.on('updateobject', function (ctx, data) {
  //console.log( `message: ${ data }` )
  _api2.default.updateObjectinPlanet(JSON.parse(data), io);
  io.broadcast('hello', {
    message: "updated"
  });
});
io.attach(app);
exports.default = app;