// Description:
//   All about chuck norris jokes
//
// Dependencies:
//   "<module name>": "<module version>"
//
// Configuration:
//   LIST_OF_ENV_VARS_TO_SET
//
// Commands:
//   hubot joke about chuck norris - Will reply with a chuck norris joke
//   joke about chuck norris - Will reply with a chuck norris joke
//
// Notes:
//   <optional notes required for the script>
//
// Author:
//   <github username of the original script author></github>

const jokes = require('../Models/jokesModel');
const config = require('../Config');

const mongoose = require('mongoose');
const decode = require('unescape');
let timeLimit = 24; //Time limit, in hours
let jokesLimit = 10; // 
module.exports = function(robot) {

    mongoose.connect(config.getDbConnectionString(), {useNewUrlParser: true});

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //Sends simple facebook text message
    function sendFBTextMessage (recepient, message){
        return new Promise(function(resolve, reject) {
            const data = JSON.stringify({
                "messaging_type": "RESPONSE",
                "recipient":{
                "id":recepient
                },
                "message":{
                "text":message
                }
            });

            robot.http("https://graph.facebook.com/v3.2/me/messages?access_token=EAAgp2UZCZC0hoBAPoINgHIO1W3getqZAnHn9WSvC2XPkBGf2IiDZA2R7SC9Jnlrnd2XPPcO92fhRgc5Uj1ZCcBR8FDXWKs3UYby9tkh8TkczHLZBCBGVAS2R0hqFaesxGDxemboZB7257VcEhsYzZCQH9fobf3MZCq5ekft0GjdMVQwZDZD").header('Content-Type', 'application/json').post(data)(function(err, res, body) {
                if(err){
                    console.log('error sending message to facebook');
                    reject();
                }
                resolve();
            });
        });
    }

    //Sends facebook quick replies message (for the quiz)
    function sendFBQuickRepliesMessage(recepient, question, answers){
        return new Promise(function(resolve, reject) {
            const data = JSON.stringify({
                "messaging_type": "RESPONSE",
                "recipient":{
                "id":recepient
                },
                "message":{
                    "text": question,
                    "quick_replies":answers,
                }
            });

            robot.http("https://graph.facebook.com/v3.2/me/messages?access_token=EAAgp2UZCZC0hoBAPoINgHIO1W3getqZAnHn9WSvC2XPkBGf2IiDZA2R7SC9Jnlrnd2XPPcO92fhRgc5Uj1ZCcBR8FDXWKs3UYby9tkh8TkczHLZBCBGVAS2R0hqFaesxGDxemboZB7257VcEhsYzZCQH9fobf3MZCq5ekft0GjdMVQwZDZD").header('Content-Type', 'application/json').post(data)(function(err, res, body) {
                if(err){
                    console.log('error sending message to facebook');
                    reject();
                }
                resolve();
            });
        });
    }
    
    //check if the user is abusing the jokes (check by user id)   
    function checkPermission(user){
            return new Promise(function(resolve, reject) {
            if(user){
                jokes.find({user: user}).where('timestamp').gt(Math.round(parseInt((new Date()).getTime()) - (timeLimit*60*60*1000))).exec().then(result=>{
                    
                    if(result.length > jokesLimit-1)
                        resolve (false);
                    resolve (true);
                    });
            }
        });
    }
    1554412017629
    1555242792
    //Registers a joke in the DB for a given user
    async function trackJoke(user){
        return new Promise(function(resolve,reject){
            const jokeEntry = [
                {
                    user: user,
                    ip: '',
                    timestamp: (new Date()).getTime(),
                },
            ];
            jokes.create(jokeEntry,function(err,results){
                resolve(true);
            });
        });
    }

    //Listen for requests for a chuck norris joke, and delivers the joke to facebook messenger
    robot.hear(/(chuck norris.*joke|joke.*chuch norris)/gi, async function(res) {
            const userID = res.message.user.name;
            const busyFetchingJoke = robot.brain.get(`busy_${userID}`) * 1 || 0;
            const limitReached = robot.brain.get(`limitJokesReached_${userID}`);
            if(busyFetchingJoke == 0)
            {
                const permission = await checkPermission(userID);
                if(!permission){
                    sendFBTextMessage(userID, "I can\'t think of any jokes now, come back soon, or if you insist, you can answer a quiz and I'll reset your jokes for today.");
                    robot.brain.set(`limitJokesReached_${userID}`,1);
                }
                
                else{
                    robot.brain.set(`busy_${userID}`,1);
                    sendFBTextMessage(userID, 'hmm, let me think..');
                    robot.http("http://api.icndb.com/jokes/random").get()(async function(err, response, body) {
                        if(err){
                            sendFBTextMessage(userID, "I can't think of any jokes now :(")
                            return;
                        }
                        const data = JSON.parse(body);
                        trackJoke(userID);
                        await(sleep(2000));
                        await sendFBTextMessage(userID, "Here it goes:");
                        await sendFBTextMessage(userID, decode(data.value.joke));
                        robot.brain.set(`busy_${userID}`,0);
                        }  
                    );
                }
            }
            else{
                sendFBTextMessage(userID, "I\'m thinking, give me a second...");
            }
    });

    //Listen for requests to erase jokes history, after reaching the joke's limit
    //Delivers a quiz to Facebook messenger
    robot.hear(/(give.*quiz|quiz.*me|puzzle|erase.*history)/gi, async function(res) {
        const userID = res.message.user.name;  
        const limitReached = robot.brain.get(`limitJokesReached_${userID}`);
        if(limitReached==1){
            robot.http("https://opentdb.com/api.php?amount=1&difficulty=easy").get()(async function(err, response, body) {
                if(err){
                    sendFBTextMessage(userID, "Sorry, I can't think of any quizes at the moment :(")
                    return;
                }
                const data = JSON.parse(body);
                const answers = [];
                answers.push({
                        "content_type":"text",
                        "title":decode(data.results[0].correct_answer),
                        "payload":true,
                })

                for(incorrect_answer in data.results[0].incorrect_answers){
                    answers.push({
                        "content_type":"text",
                        "title":decode(data.results[0].incorrect_answers[incorrect_answer]),
                        "payload":false,
                    })
                }

                await sendFBTextMessage(userID, "Ok, answer this:");
                await sendFBQuickRepliesMessage(userID,decode(data.results[0].question),answers);
                robot.brain.set(`quiz_${userID}`,data.results[0].correct_answer);
                }
            );
        }      
    });

    //Messages which were not picked up by previous regexs is processed here
    robot.catchAll(function(res) {

        const userID = res.message.user.name;            
        const pendingQuiz = robot.brain.get(`quiz_${userID}`);
        //If we're waiting for a quiz answer
        if(pendingQuiz){
            //If the answer is correct
            if(pendingQuiz==message.text){
                jokes.find({user: userID}).remove().exec().then(result=>{
                    robot.brain.set(`limitJokesReached_${userID}`,0);
                    robot.brain.set(`quiz_${userID}`,'');
                    sendFBTextMessage(userID, "You've got it, you can asks for jokes again! :)");
                });
            }
            else{
                robot.brain.set(`quiz_${userID}`,'');
                sendFBTextMessage(userID, "Wrong answer, no jokes for you!");
            }
        }
    });
};
