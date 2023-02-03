# Tic-tac-toe: Real-time using serverless technologies

##  Client - Reactjs, Websocket

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

  

## Available Scripts  

In the project directory, you can run:

 
### `npm start`

  

Runs the app in the development mode.
Further, you can specify the env variable REACT_APP_WEBSOCKET_URL in the .env file which points to the websocket server.

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

  

The page will reload when you make changes.\

You may also see any lint errors in the console.

  
### `npm run build`



Builds the app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance.

  
  ## Components
  ### Home page
  The main page has options to input your name and select role.
  Once the number of players reach 2, the game starts automatically. Players joining later will only be able to join as a spectator.
  ### Game page
  The game screen has the **board** on the left, and **chat box** on the right for real-time communication with all other users(players as well as spectators can chat).
  A player is chosen randomly to go first, and the game resets with alert to both players about their status.

## Server - AWS Lambda with API Gateway
The server consists of a single handler written in Nodejs as a Lambda function, which can be accessed through the Websocket API gateway.
It has the following action types(req.body.action for API gateway):
1. $connect - New user joined
2. $disconnect - User left, disconnect. If this was one of the players, reset the game
3. $default - default handler, forwards messages
4. getGameStatus - Broadcast game status/progress to all users
5. selectRole - Select user role and broadcast to other users
6. newMove - Handle new board move by a user, check if it's the winning move
7. sendMessage - Handle chat messages

## Database - AWS DyanamoDB
The database consists of two collections:

1. **Game**: gameId(key), board(3x3 array), gameStatus(enum{1,2,3}), players(map of player ids to their side[0/1]), nextTurn(id of player with next turn)
2. **Users**: userId(key), name(string), type(player/spectator)