const sequelize = require('./config/db')
const passport = require('passport');
const index = require('./routes/index');
const user = require('./routes/user');
const admin = require('./routes/admin');
const helmet = require('helmet');
const dotenv = require('dotenv');
const flash = require('connect-flash')
const session = require('express-session');
const exphbs = require('express-handlebars')
const handlebars = exphbs.create( 
    {defaultLayout: 'main', 
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
});
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const express = require('express');
const app = express();

require('./config/passport')(passport)

dotenv.config({ path:'./config/config.env' });



sequelize.authenticate()
    .then(() => console.log('Connection has been established successfully..'))
    .catch(err => console.log('Error: ' + err));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const myStore = new SequelizeStore({db: sequelize,
    expiration: 24 * 60 * 60 * 1000})
    
app.use(session({ 
    secret: process.env.SECRET,
    store: myStore,
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 86400000, secure: false}
}));
myStore.sync()



app.use(passport.initialize());
app.use(passport.session());

app.use(flash())
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg  = req.flash('error_msg')
    res.locals.error  = req.flash('error')
    next()
})

app.use('/user', user);
app.use('/admin', admin);
app.use('/', index);


process.on('warning', (warning) => {
    console.log(warning.stack);
});



const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port: ${port}`));