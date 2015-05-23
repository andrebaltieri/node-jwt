var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./app/config');
var User = require('./app/models/user');

var port = process.env.PORT || 8080;
mongoose.connect(config.database);
app.set('secret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

var routes = express.Router();

routes.post('/users', function(req, res) {
    var user = new User();
    user.name = req.body.name;
    user.password = req.body.password;
    user.admin = req.body.admin;

    user.save(function(error) {
        if (error)
            res.send(error);

        res.json(user);
    });
});

routes.post('/authenticate', function(req, res) {
    User.findOne({ name: req.body.name, password: req.body.password }, function(error, user){
        if(error)
            res.send(error);

        if (!user)
            res.json({ success: false, message: 'Usuário ou senha inválidos.' });

        var token = jwt.sign(user, app.get('secret'), {
            expiresInMinutes: 1440 // expires in 24 hours
        });

        res.json({
            success: true,
            message: 'Seu token expira em 24 horas!',
            token: token
        });
    });
});

routes.use(function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, app.get('secret'), function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Ops, token inválido.' });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'Fornça um token.'
        });
    }
});

routes.get('/users', function(req, res) {
    User.find(function(error, users){
        if(error)
            res.send(error);

        res.json(users);
    });
});

app.use('/api', routes);

app.listen(port);
console.log('Aplicação rodando em http://localhost:' + port);