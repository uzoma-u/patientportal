// const mongoose = require('mongoose');
const db = require('../config/db');
// const autoIncrement = require('mongoose-auto-increment');
const { Sequelize, DataTypes } = require('sequelize');
const Reminder = require('./Reminder');
const ReminderType = require('./ReminderType');


const RecurringReminderPattern = db.define('recurringreminderpatterns', {
   
    reminder_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,

        references: {
        model: Reminder,
        key: 'id'
        }
    },
    reminder_type_id: {
        type: DataTypes.INTEGER,

        references: {
        model: ReminderType,
        key: 'id'
        }
    },
    reminder_interval: {
        type: DataTypes.INTEGER
    },
    reminder_count: {
        type: DataTypes.INTEGER
    },
    hour_of_day: {
        type: DataTypes.INTEGER
    },
    day_of_week: {
        type: DataTypes.INTEGER
    },
    week_of_month: {
        type: DataTypes.INTEGER
    },
    day_of_month: {
        type: DataTypes.INTEGER
    },
    month_of_year: {
        type: DataTypes.INTEGER
    }

}, {underscored: true});

// RecurringReminderPattern.belongsTo(Reminder, {
//     onDelete: 'CASCADE',
//     onUpdate: 'CASCADE',
//     onDrop: 'CASCADE'
// }) 


module.exports = RecurringReminderPattern;