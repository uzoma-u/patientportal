const mongoose = require('mongoose');
const db = require('./../config/db');
const autoIncrement = require('mongoose-auto-increment');

// autoIncrement.initialize(db.connectDB);

const { Sequelize, DataTypes } = require('sequelize');


const ReminderInstance = db.define('reminderinstances', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    reminder_id: {
        type: DataTypes.INTEGER,

        references: {
        // This is a reference to another model
        model: Reminder,

        // This is the column name of the referenced model
        key: 'id'
        }
    },
    created_date:{
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    start_date:{
        type: DataTypes.DATEONLY,
    },
    end_date: {
        type: DataTypes.DATE
    },
    start_time: {
        type: DataTypes.TIME
    },
    is_recurring: {
        type: DataTypes.BOOLEAN
    },
    description: {
        type: DataTypes.STRING
    }

}, {underscored: true});

ReminderInstance.belongsTo(Reminder, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    onDrop: 'CASCADE'
}) 


module.exports = ReminderInstance;