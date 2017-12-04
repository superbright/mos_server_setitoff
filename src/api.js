import KoaRouter from 'koa-router';

const api = KoaRouter();

const config = {
  hosts: '54.210.52.93:3000'
}

/**
  * GET. / Index page of app. 
  * This is where all the parts of the app are linked.
  */
api.get('/',
  async (ctx, next) => {
    await ctx.render('index', {
     user: 'museum'
   });
  }
);

/**
  * GET. /qa QA page of app. 
  * Linked on the index. For troubleshooting purposes outside the normal flow.
  */
api.get('/qa',
  async (ctx, next) => {
    await ctx.render('qa', {
      user: 'museum'
    });
  }
);

/**
  * GET. /cp CP page of app. 
  * Not linked on the index. This is to prevent unauthorized users from accessing, as all the app functionality is on this page. It is intended to be used for quick and easy troubleshooting by a technician.
  */
api.get('/cp',
  async (ctx, next) => {
    await ctx.render('cp', {
      user: 'museum'
    });
  }
);

/**
  * GET. /guest Guest page of app.
  * Linked on the index. This is the page where all guest information is added.
  */
api.get('/guest',
  async (ctx, next) => {
    await ctx.render('guest', {
      user: 'museum'
    });
  }
);

/**
  * GET. /gameplay Gameplay page of app.
  * Linked on the index. This is the page where the experience is controlled.
  */
api.get('/gameplay',
  async (ctx, next) => {
    await ctx.render('gameplay', {
      user: 'museum'
    });
  }
);

/**
  * GET. /config JSON file of all player information: name, height, gender, ison.
  */
api.get('/config',
  async (ctx, next) => {
    ctx.body = ctx.config;
  }
);

/**
  * POST. /config Set ison value for a player.
  * JSON format.
  * "player": int
  * "ison": boolean
  *
  * "player" can be any int from 0 to 3 for players 1 to 4 respectively.
  */
api.post('/config', async (ctx, next) => {
  if(ctx.playerStates[ctx.request.body.player]) {
    ctx.config.PLAYERS[ctx.request.body.player].ison = ctx.request.body.ison;
    ctx.body = JSON.stringify(ctx.request.body);
    ctx.status = 200;
  } else {
    ctx.body = "Player " + ctx.request.body.player  +" is not up yet";
    ctx.status = 500;
  }
});

/**
  * POST. /setheight Set height value for a player.
  * JSON format.
  * "player": int
  * "height": float
  *
  * "player" can be any int from 0 to 4. 0 to 3 is for players 1 to 4 respectively and 4 is for the performer.
  */
api.post('/setheight', async (ctx, next) => {
  ctx.config.PLAYERS[ctx.request.body.player].height = ctx.request.body.height;
  ctx.body = JSON.stringify(ctx.request.body);
  ctx.status = 200;
});

/**
  * POST. /setgender Set gender value for a player.
  * JSON format.
  * "player": int
  * "gender": int
  *
  * "player" can be any int from 0 to 3 for players 1 to 4 respectively.
  * "gender" can be 0 or 1. 0 for male, 1 for female.
  */
api.post('/setgender', async (ctx, next) => {
  console.log( ctx.request.body.gender);
  ctx.config.PLAYERS[ctx.request.body.player].gender = ctx.request.body.gender;
  ctx.body = JSON.stringify(ctx.request.body);
  ctx.status = 200;
});

/**
  * POST. /setname Set name value for a player.
  * JSON format.
  * "player": int
  * "name": String
  *
  * "player" can be any int from 0 to 4. 0 to 3 is for players 1 to 4 respectively and 4 is for the performer.
  */
api.post('/setname', async (ctx, next) => {
  console.log( ctx.request.body.name);
  ctx.config.PLAYERS[ctx.request.body.player].name = ctx.request.body.name;
  ctx.body = JSON.stringify(ctx.request.body);
  ctx.status = 200;
});

export default api;