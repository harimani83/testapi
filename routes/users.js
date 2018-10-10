var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

 mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
var db = mongoose.connection;
var UserSchema = mongoose.Schema({
    _id: Number,
    name: String,
    phone: Number,
    address: String
});

var ProductSchema = mongoose.Schema({
    _id: Number,
    name: String,
    unit_price: Number,
    description: String
});

var TransactionSchema = mongoose.Schema({
    date: Date,
    product_id: Number,
    user_id: Number,
    quantity: Number,
    total_price: Number
});

// compile schema to model
var user_Schema = mongoose.model('user', UserSchema);
var product_Schema = mongoose.model('product', ProductSchema);
var transaction_Schema = mongoose.model('transaction', TransactionSchema);



router.get('/list', function (req, res, next) {
    db.collection('users').aggregate([
        {
            $lookup:
            {
                from: "transactions",
                localField: "_id",
                foreignField: "user_id",
                as: "order_details"
            }
        }, {
            $unwind: "$order_details"
        },
        {
            $project: {
                "_id": 0,
                "name": 1,
                "phone": 1,
                "address": 1,
                "latest_transaction_detail": {
                    product_id: "$order_details.product_id",
                    quantity: "$order_details.quantity",
                    total_price: "$order_details.total_price"
                },
                //"total_transaction": { $sum: '$order_details' },
            }
        }], function (err, data) {
            if (err) return console.error(err);
            console.log(JSON.stringify(data));
            res.send(data);
        })
});
router.post('/user', function (req, res, next) {
    // a document instance
    var user_Schema1 = new user_Schema({
        _id: req.body.user_id,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address
    });
    // save model to database
    user_Schema1.save(function (err, user) {
        if (err) return console.error(err);
        res.sendStatus(200);
    });
});

router.post('/product', function (req, res, next) {
    // a document instance
    var product_Schema1 = new product_Schema({
        _id: req.body.product_id,
        name: req.body.name,
        unit_price: req.body.unit_price,
        description: req.body.description
    });
    // save model to database
    product_Schema1.save(function (err, user) {
        if (err) return console.error(err);
        res.sendStatus(200);
    });
});

router.post('/transaction', function (req, res, next) {
    user_Schema.find({ name: req.body.name }, { _id: 1 }, (err, userdata) => {

        if (err) console.error(err);

        product_Schema.find({ name: req.body.transaction.product.name }, { _id: 1 }, (err, proddata) => {

            var transaction_Schema1 = new transaction_Schema({
                date: new Date(),
                product_id: proddata[0]._doc._id,
                user_id: userdata[0]._doc._id,
                quantity: req.body.transaction.product.quantity,
                total_price: req.body.transaction.product.unit_price * req.body.transaction.product.quantity
            });

            var newtrans = {};
            var transaction_Schema_update = transaction_Schema1.toObject();

            newtrans.user_id = transaction_Schema_update.user_id,
                newtrans.product_id = transaction_Schema_update.product_id,
                newtrans.date = transaction_Schema_update.date,
                newtrans.quantity = transaction_Schema_update.quantity,
                newtrans.total_price = transaction_Schema_update.total_price,

                transaction_Schema.update({ user_id: transaction_Schema_update.user_id }, newtrans, { upsert: true }, function (err, user) {
                    if (err) return console.error(err);
                    res.send(201);
                });
        });
    });

});
module.exports = router