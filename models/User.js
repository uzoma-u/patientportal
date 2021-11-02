const  {Sequelize, DataTypes} = require( 'sequelize');
const jsonwebtoken = require('jsonwebtoken');
const sequelize = require('./../config/db');


const userSchema = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING
    },
    patientid: {
        type: DataTypes.STRING
    },
    email:{
        type: DataTypes.STRING,
        unique: true
    },
    phone: {
        type: DataTypes.STRING
    },
    diagnosis: {
        type: DataTypes.TEXT
    },
    allergies: {
        type: DataTypes.STRING
    }    
}

const User = sequelize.define('users', userSchema, {underscored: true} )




User.prototype.generateJasonWebToken = function() {
    const payload = {
        sub: this.user_id,
        iat: Date.now()
      };
    const signedToken = jsonwebtoken.sign(payload, 
        {key: PRIV_KEY, passphrase: 'top secret'}, 
        { expiresIn: '1d', algorithm: 'RS256' });
      console.log(signedToken)
  
      return signedToken
}
    

// User.prototype.verifyJsonWebToken = () => {
//     const token = req.body.id
//     if (!token) return res.status(401).send('No token provided. Access Denied.')
  
//     try {
//         const payload = jsonwebtoken.verify(token, PRIV_KEY)
//         req.user.user_id = payload;
//         next()
//     }
//     catch(err) {
//         console.log(err)
//         res.status(400).send('Invalid token')
//     }
// }




// (async () => {
//     await sequelize.sync({alter: true});
// })();
  
// User.hasMany(Medication);

sequelize.models.users


module.exports = User;
