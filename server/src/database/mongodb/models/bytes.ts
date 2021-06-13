const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bytesSchema = Schema(
  {
    byte: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);
const BytesModel = mongoose.model("Bytes", bytesSchema);

export class Bytes {
  // set method object to call method with action string.
  method: { [name: string]: any } = {
    'addByte' : async function (values: any) {
      const byte = new BytesModel({
        byte: { data: values[0] },
      });
      const ret = await byte.save();
      return { rows: [byte] }
    },

    'getByte' : async function (values: any) {
      const byte = await BytesModel.findOne({_id: values[0]}).exec();
      return { rows: [{ byte: byte.byte.data.buffer }] }
    },

    'delByte' : async function (values: any) {
      const byte = await BytesModel.findByIdAndRemove(values[0]).exec();
      return { rows: [{_id: values[0]}] }
    },
  };
}
