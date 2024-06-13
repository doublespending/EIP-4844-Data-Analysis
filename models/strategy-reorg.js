const { DataTypes } = require("sequelize");
const { sequelize, Sequelize } = require("./index.js");

/*
{
  hash: '0x5a69e8918d3713262afb4368c28bb9ca2c6570f2ce98c971a5d8b11ef079e6e2',
  blockNumber: 5188793,
  blockHash: '0x3cf27b77fb55c94d5ac9fff8c6ae77956fc40b2ddd6a2c8fdf92b99d0ec95eb8',
  blobCount: 3,
  rollup: null,
  blobGasPrice: '21518435987',
  blobInterval: 1,
  gasRatio: 2.5403645833333335,
  feeRatio: 4.237178367259573
}
*/

module.exports = (sequelize, Sequelize) => {
  const StrategyReorg = sequelize.define("StrategyReorg", {
    hash: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      index: true,
      allowNull: false,
    },
    blockHash: {
      type: DataTypes.STRING,
      index: true,
      allowNull: false,
    },
    blobCount: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    rollup: {
      type: DataTypes.STRING,
      index: true,
      allowNull: false,
    },
    blobGasPrice: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    blobInterval: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gasRatio: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    feeRatio: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  });
  StrategyReorg.getByBlockNumber = (blockNumber) => {
    return this.findOne({ where: { blockNumber } });
  };

  return StrategyReorg;
};
