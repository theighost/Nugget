var jokes = require('../models/jokesModel');

module.exports = function(app){
    app.get('/api/setupDB', function(req,res){
        var First = [
            {
                user: 'omran',
                ip: '192.1.1.0',
                timestamp: false,
            },
        ];
        jokes.create(First,function(err,results){
            res.send(results);
        });
    });
}