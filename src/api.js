import KoaRouter from 'koa-router';
import arangojs, {Database, aql} from 'arangojs';

const api = KoaRouter();

const config = {
  hosts: '54.210.52.93:3000'
}

var callback = function(result) {
 console.log('log:', result);
}


api.get('/',
  async (ctx, next) => {
    await ctx.render('index', {
     user: 'museum'
   });
  }
);




export default api;
