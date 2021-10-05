
const db = require('./../config/db');
// const autoIncrement = require('mongoose-auto-increment');

// autoIncrement.initialize(db.connectDB);

const Sequelize = require('sequelize');


const RecurringReminderType = db.define('recurringremindertypes', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    reminder_type: {
        type: Sequelize.STRING
    }
});


module.exports = RecurringReminderType;


