'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _arangojs = require('arangojs');

var _arangojs2 = _interopRequireDefault(_arangojs);

var _graphcommons = require('graphcommons');

var _graphcommons2 = _interopRequireDefault(_graphcommons);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var accesskey = "sk_fj5_UlUpdrmhx4dlN43Qxg";
var graph_id = "750107c0-4669-4245-97bc-6f0923ae95c2";

var api = (0, _koaRouter2.default)();

var config = {
  hosts: '54.210.52.93:3000'
};

//let host = "localhost";
var host = "8937fa04.ngrok.io";
var port = 80;
var databasename = 'theseed';
var username = 'seed';
var password = 's33d';

var db = (0, _arangojs2.default)({
  url: 'http://' + username + ':' + password + '@' + host + ':' + port,
  databaseName: databasename
});

// console.log(db.name);
// var worldsCollection =  db.collection("temp");
// worldsCollection.create().then(
//   () => console.log('Collection created'),
//   err => console.error('Failed to create collection:', err)
// );
//
// var doc = {
//   a: 'foo',
//   b: 'bar',
//   c: Date()
// };
//
// worldsCollection.save(doc).then(
//   meta => console.log('Document saved:', meta._rev),
//   err => console.error('Failed to save document:', err)
// );

api.updateObjectinPlanet = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(data, io) {
    var objectid, transform, planetid, objectCollection, planetcollection;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            objectid = data.objectid, transform = data.transform, planetid = data.planetid;
            objectCollection = db.collection("objects");
            planetcollection = db.collection("universe");
            _context.next = 5;
            return objectCollection.lookupByKeys([objectid]).then(function (meta) {
              //console.log("length " + meta.length);
              if (meta.length == 0) {
                return;
              }
              objectCollection.update(meta[0], { transform: transform }).then(function (doc1) {
                //console.log("updated");
              }, function (err) {
                return console.error(err.stack);
              });
            });

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

api.get('/', function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(ctx, next) {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return ctx.render('index', {
              user: 'John'
            });

          case 2:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

api.get('/graphData', function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(ctx, next) {
    var graphcallback;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            // Reply with 201 Created when the item is saved
            graphcallback = function graphcallback(graph) {
              //console.log('log:', graph);
              console.log(" properties edges");
              console.log('edges: ', graph.edges.length);
              console.log(" properties nodes");
              console.log('nodes: ', graph.nodes.length);

              //All the other properties of the graph can be retrieved from
              console.log(" properties ----");
              //console.log(graph.properties);
              ctx.body = graph;
              ctx.status = 200;
            };

            graphcommons.graphs(graph_id, graphcallback);

          case 2:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function (_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}());

// Get details of universe
api.get('/getUniverse/:universe', function () {
  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(ctx, next) {
    var universe, transform, universeCollection;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            universe = ctx.params.universe;
            transform = ctx.req.transform;
            _context4.prev = 2;
            universeCollection = db.collection(universe);
            _context4.next = 6;
            return universeCollection.all().then(function (result) {
              ctx.body = result._result;
              ctx.status = 200;
            });

          case 6:
            _context4.next = 11;
            break;

          case 8:
            _context4.prev = 8;
            _context4.t0 = _context4['catch'](2);

            console.log(_context4.t0.response.body);

          case 11:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined, [[2, 8]]);
  }));

  return function (_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}());

api.get('/getObjects/:planetid', function () {
  var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(ctx, next) {
    var planetid, graphx;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            planetid = ctx.params.planetid;
            _context5.prev = 1;
            graphx = db.graph("multiverse");
            _context5.next = 5;
            return graphx.get().then(function (data) {
              // data contains general information about the graph
            });

          case 5:
            _context5.next = 7;
            return graphx.traversal('universe/' + planetid, {
              direction: 'outbound',
              graphName: "multiverse",
              edgeCollection: 'contains',
              //  visitor: 'result.vertices.push(vertex);result.paths.push(path);',
              maxDepth: 1,
              order: 'preorder-expander',
              init: 'result.vertices = [];',
              uniqueness: {
                vertices: "global",
                edges: "none"
              }
            }).then(function (result) {
              console.log(result); // ['a', 'b', 'c', 'd']
              ctx.body = { data: result.visited.vertices,
                id: planetid
              };
              ctx.status = 200;
            });

          case 7:
            _context5.next = 12;
            break;

          case 9:
            _context5.prev = 9;
            _context5.t0 = _context5['catch'](1);

            console.log(_context5.t0);

          case 12:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined, [[1, 9]]);
  }));

  return function (_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}());

api.get('/getPlanets/:universe', function () {
  var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(ctx, next) {
    var universe, graphx;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            universe = ctx.params.universe;
            _context6.prev = 1;
            graphx = db.graph(universe);
            _context6.next = 5;
            return graphx.get().then(function (data) {
              // data contains general information about the graph
            });

          case 5:
            _context6.next = 7;
            return graphx.traversal('multiverse/454', {
              direction: 'outbound',
              graphName: universe,
              edgeCollection: 'contains',
              //  visitor: 'result.vertices.push(vertex);result.paths.push(path);',
              maxDepth: 1,
              order: 'preorder-expander',
              init: 'result.vertices = [];result.paths = []',
              uniqueness: {
                vertices: "global",
                edges: "global"
              }
            }).then(function (result) {
              //  console.log(result); // ['a', 'b', 'c', 'd']
              ctx.body = result.visited;
              ctx.status = 200;
            });

          case 7:
            _context6.next = 12;
            break;

          case 9:
            _context6.prev = 9;
            _context6.t0 = _context6['catch'](1);

            console.log(_context6.t0);

          case 12:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined, [[1, 9]]);
  }));

  return function (_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}());

api.put('/editObject/:objectid', function () {
  var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(ctx, next) {
    var objectid, transform, keys, objectCollection;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            objectid = ctx.params.objectid;
            transform = ctx.request.body.transform;
            keys = [objectid];
            objectCollection = db.collection("objects");
            _context7.next = 6;
            return objectCollection.lookupByKeys(keys).then(function (meta) {
              console.log(meta[0]);
              objectCollection.update(meta[0], { transform: transform }).then(function (doc1) {
                ctx.body = doc1;
              });
            });

          case 6:
            ctx.status = 200;

          case 7:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  }));

  return function (_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}());

//add new object to a planet
api.post('/deleteObject/:objectid', function () {
  var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(ctx, next) {
    var objectid, graph, collection;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:

            //  const { planetid } = ctx.params;
            objectid = ctx.params.objectid;
            graph = db.graph("multiverse");
            _context8.next = 4;
            return graph.get().then(function (data) {
              // data contains general information about the graph
            });

          case 4:
            collection = graph.vertexCollection('objects');

            collection.remove(objectid).then(function () {
              console.log('ok destroyed');
              ctx.body = "ok";
              ctx.status = 200;
              // document 'vertices/some-key' no longer exists
            });

          case 6:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, undefined);
  }));

  return function (_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
}());

//add new object to a planet
api.post('/addObject/:planetid/:objectid', function () {
  var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(ctx, next) {
    var planetid, objectid, edgedoccontainsobject, docobject, objectCollection, edgecollection;
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            planetid = ctx.params.planetid;
            objectid = ctx.params.objectid;
            edgedoccontainsobject = {};

            edgedoccontainsobject._from = 'universe/' + planetid;

            docobject = {
              assetid: objectid,
              transform: {},
              c: Date()
            };
            _context9.prev = 5;
            objectCollection = db.collection("objects");
            _context9.next = 9;
            return objectCollection.save(docobject).then(function (meta) {
              edgedoccontainsobject._to = 'objects/' + meta._key;
            });

          case 9:
            edgecollection = db.edgeCollection("contains");
            _context9.next = 12;
            return edgecollection.save(edgedoccontainsobject).then(function (edge) {
              console.log("Added");
              console.log(edge);
            });

          case 12:
            ctx.body = edgedoccontainsobject;
            ctx.status = 200;

            _context9.next = 20;
            break;

          case 16:
            _context9.prev = 16;
            _context9.t0 = _context9['catch'](5);

            console.log(_context9.t0);
            ctx.body = _context9.t0.response.body;

          case 20:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, undefined, [[5, 16]]);
  }));

  return function (_x17, _x18) {
    return _ref9.apply(this, arguments);
  };
}());

api.post('/createPlanet/:planetcollectionname/:universecollectionname', function () {
  var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(ctx, next) {
    var planetcollectionname, universecollectionname, name, edgedoccontainsplanet, universecollection, planetcollection, edgecollection, data, docplanet, planetobj;
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;


            console.log(ctx.body);

            planetcollectionname = ctx.params.planetcollectionname;
            universecollectionname = ctx.params.universecollectionname;
            name = ctx.body.name;


            console.log(name);

            edgedoccontainsplanet = {};
            universecollection = db.collection(universecollectionname);
            planetcollection = db.collection(planetcollectionname);
            edgecollection = db.edgeCollection("contains");
            _context10.next = 12;
            return planetcollection.byExample({ name: name });

          case 12:
            data = _context10.sent;


            console.log(data._result.length);

            if (!(data._result.length > 0)) {
              _context10.next = 18;
              break;
            }

            return _context10.abrupt('return', ctx.throw(400, 'Name Exists'));

          case 18:
            _context10.next = 20;
            return universecollection.all().then(function (data) {
              edgedoccontainsplanet._from = 'multiverse/' + data._result[0]._key;
            });

          case 20:
            docplanet = {
              name: name,
              timeline: [],
              c: Date()
            };
            planetobj = {};
            _context10.next = 24;
            return planetcollection.save(docplanet).then(function (meta) {
              planetobj = meta;
              planetobj.name = name;
              edgedoccontainsplanet._to = 'universe/' + meta._key;
            });

          case 24:
            _context10.next = 26;
            return edgecollection.save(edgedoccontainsplanet).then(function (edge) {
              ctx.body = planetobj;
            });

          case 26:
            _context10.next = 32;
            break;

          case 28:
            _context10.prev = 28;
            _context10.t0 = _context10['catch'](0);

            console.log(_context10.t0);
            ctx.body = _context10.t0.response.body;

          case 32:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, undefined, [[0, 28]]);
  }));

  return function (_x19, _x20) {
    return _ref10.apply(this, arguments);
  };
}());

// api.post('/createUniverse/:name',
//   async(ctx, next) => {
//     const { name } = ctx.params;
//     try {
//       let worldsCollection = db.collection(name);
//     //  console.log("name to create is " + name);
//       await worldsCollection.create().then(() => {
//         //  console.log("created worlds");
//             ctx.status = 200;
//         });
//
//     } catch (err) {
//       console.log(err);
//       ctx.body = err.response.body;
//     }
//   }
// );


exports.default = api;