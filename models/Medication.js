const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');



const medicationSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    medication_name: {
        type: DataTypes.STRING
    },
    dosage_form: {
        type: DataTypes.STRING
    },
    strength: {
        type: DataTypes.STRING
    },
    frequency_type: {
        type: DataTypes.STRING
    },
    frequency:{
        type: DataTypes.INTEGER
    },
    dose: {
        type: DataTypes.INTEGER
    },
    quantity: {
        type: DataTypes.INTEGER
    },
    refill_date: {
        type: DataTypes.DATEONLY,
        allowNull:true
    },
    prescribed_by: {
        type: DataTypes.STRING
    }
}

const Medication = sequelize.define('medications', medicationSchema, {underscored: true} );



sequelize.models.medications

User.hasMany(Medication, {
        foreignKey: {name: 'user_id'},
    onDelete: 'cascade',
    onUpdate: 'cascade'
});
Medication.belongsTo(User,  {
    foreignKey: {name: 'user_id'},
    onDelete: 'cascade',
    onUpdate: 'cascade'
 });




module.exports = Medication