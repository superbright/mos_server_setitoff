import KoaRouter from 'koa-router';

const api = KoaRouter();
//const koaBody = require('koa-body')();

const config = {
  hosts: '54.210.52.93:3000'
}

api.get('/',
  async (ctx, next) => {
    await ctx.render('index', {
     user: 'museum'
   });
  }
);

api.post('/config', async (ctx, next) => {
      ctx.config.PLAYERS[ctx.request.body.player].ison = ctx.request.body.ison;
      ctx.body = JSON.stringify(ctx.request.body);
      ctx.status = 200;
    }
);

api.post('/setheight', async (ctx, next) => {
      ctx.config.PLAYERS[ctx.request.body.player].height = ctx.request.body.height;
      ctx.body = JSON.stringify(ctx.request.body);
      ctx.status = 200;
    }
);

api.post('/setgender', async (ctx, next) => {
      console.log( ctx.request.body.gender);
      ctx.config.PLAYERS[ctx.request.body.player].gender = ctx.request.body.gender;
      ctx.body = JSON.stringify(ctx.request.body);
      ctx.status = 200;
    }
);

api.get('/config',
  async (ctx, next) => {
    ctx.body = ctx.config;
  }
);

var convertHeight = function(heightfeet) {

}

export default api;
