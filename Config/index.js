var configValues = require('./config');

module.exports = {
    getDbConnectionString: function(){
        return 'mongodb://'+configValues.username+':'+configValues.password+'@ds123946.mlab.com:23946/jokeslog';
    }
}