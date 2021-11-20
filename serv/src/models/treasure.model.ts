import mongoose from "mongoose";
const { omit, pick } = require('lodash');

const Schema = mongoose.Schema;

const treasureSchema = new Schema(
  {
    contract: {
      type: String,
      required: true,
      lowercase: true,
    },
    tokenId: {
        type: Number,
        required: false,
      },
    contractStandard: {
        type: String,
        enum: ["ERC721", "ERC1155", "ERC20"],
        required: true,
      },
      geoHash: {
          type: String,
          required: true,
      },
      cid: {
        type: String,
        required: true
      }
    },
  {
    timestamps: false,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

treasureSchema.methods.transform = function() {
  const treasure = this;
  return pick(treasure.toJSON(), ['contract', 'tokenId', 'contractStandard', 'geoHash']);
};

const TreasureModel = mongoose.model('Treasure', treasureSchema);

export default TreasureModel;