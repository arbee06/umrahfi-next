'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('packages', 'country', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Saudi Arabia'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('packages', 'country');
  }
};
