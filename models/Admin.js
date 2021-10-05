const jsonwebtoken = require('jsonwebtoken');
const  {DataTypes} = require( 'sequelize');
const sequelize = require('./../config/db');



const adminSchema = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}


const Admin = sequelize.define('admins', adminSchema, {underscored: true} )

Admin.prototype.generateJasonWebToken = function() {
    const payload = {
        sub: this.id, isAdmin: this.isAdmin,
        iat: Date.now()
      };
    const signedToken = jsonwebtoken.sign(payload, 
        {key: PRIV_KEY, passphrase: 'top secret'}, 
        { expiresIn: '1d', algorithm: 'RS256' });
      console.log(signedToken)
  
      return signedToken
}


module.exports = Admin