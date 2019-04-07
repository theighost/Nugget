const User = require('hubot').User;
const TextMessage = require('hubot').TextMessage;
module.exports = function(robot) {
      
  //Listen for Facebook webhook subscription verification
  robot.router.get('/chatBot', function(req, res) {
    return res.send(200, req.query['hub.challenge']);
    //return robot.emit('hi', 'req.query.room');
  });

  //Listen for messages from Facebook messenger
  robot.router.post('/chatBot', function(req, res) {
   const messageEvent = req.body.entry[0].messaging[0];
    
    if(messageEvent.message && messageEvent.message.text){
      user = new User(messageEvent.sender.id, {name: messageEvent.sender.id});

      message = new TextMessage(user, messageEvent.message.text, messageEvent.sender.id);
      return robot.receive(message);
    }
  });      
}