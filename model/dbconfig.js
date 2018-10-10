var MongoClient = require('mongodb').MongoClient;
var connection = null;

var connect = new Promise((resolve, reject) => {
    MongoClient.connect('mongodb://localhost:27017/employee_db', { useNewUrlParser: true }, (err, client) => {
        if (err) {
            reject(err);
            return;
        }
        var clients = client.db('employee_db');
        resolve(clients);
        connection = clients;
    });

    
});
module.exports.get = () => {
    if (!connection){
        connect;
        throw new Error("Call to connect Database first");
    }
    return connection;
}