const jsonwebtoken = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const pathToKey = path.join(__dirname, '..', 'rsa_id_priv.pem');
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8');
const db = require('./../config/db');
const sequelize = require('./../config/db');
const User = require('./User');
const { Sequelize, DataTypes } = require('sequelize');



const RegisteredUser = sequelize.define('registered_users', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
        model: User,
        key: 'id',
        deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }

},{underscored: true});



RegisteredUser.prototype.generateJasonWebToken = function() {
    const payload = { sub: this.user_id, iat: Date.now()};

    const signedToken = jsonwebtoken.sign(payload, {key: PRIV_KEY, passphrase: 'top secret'}, 
        { expiresIn: '1d', algorithm: 'RS256' });  
    return signedToken
}
    




module.exports = RegisteredUser