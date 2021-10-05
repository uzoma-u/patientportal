const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./../config/db');
const Medication = require('./Medication');
const User = require('./User');



const Reminder = sequelize.define('reminders', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true        
    },
    created_date:{
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    start_date: {
        type: DataTypes.DATEONLY
    },
    reminder_frequency_type: {
        type: DataTypes.STRING
    },
    reminder_frequency: {
        type: DataTypes.INTEGER
    },
    reminder_interval: {
        type: DataTypes.INTEGER
    },
    reminder_times: {
        type: DataTypes.ARRAY(DataTypes.STRING),
    },
    reminder_message: {
        type: DataTypes.STRING
    },
    reminder_dose: {
        type: DataTypes.INTEGER
    },
    recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        
    }
  
},{underscored: true});



sequelize.models.reminders

User.hasMany(Reminder, {
    foreignKey: {name: 'user_id'},
    onDelete: 'cascade',
    onUpdate: 'cascade'
});
Reminder.belongsTo(User, {
    foreignKey: {name: 'user_id'},
    onDelete: 'cascade',
    onUpdate: 'cascade'
});

Medication.hasOne(Reminder, {
    foreignKey: {name: 'medication_id'},
    onDelete: 'cascade',
    onUpdate: 'cascade'
});
Reminder.belongsTo(Medication, {
    foreignKey: {name: 'medication_id'},
    onDelete: 'cascade',
    onUpdate: 'cascade'
});







module.exports = Reminder;