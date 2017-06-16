import KoaRouter from 'koa-router';

const api = KoaRouter();

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

api.post('/config', function (ctx, next) {
    async (ctx, next) => {
    await console.log(ctx);
    //const res = await ctx.response;
    ctx.status = 200;
    ctx.body =  { res : 'ok' };

    }
});

api.get('/config',
  async (ctx, next) => {
    ctx.body = ctx.config;
  }
);

// api.get('/error/:message',
//   async (ctx, next) => {
//   //  console.log(ctx.app.io);
//     ctx.app.io.broadcast( 'errormessage', {
//       data : ctx.request.querystring
//     });
//      ctx.body = { foo: ctx.request.querystring }
//   }
// );

export default api;
