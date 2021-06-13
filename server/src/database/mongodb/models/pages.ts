const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pagesSchema = Schema(
  {
    type: String,
    data: Schema.Types.Mixed,
    create_user: { type: Schema.Types.ObjectId, ref: 'Users' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);
pagesSchema.virtual('create_user_id').get(function (this: any) {
  return this.create_user?._id;
});
pagesSchema.virtual('create_user_name').get(function (this: any) {
  return this.create_user?.name;
});

const PagesModel = mongoose.model("Pages", pagesSchema);

export class Pages {
  // set method object to call method with action string.
  method: { [name: string]: any } = {
    'getPage' : async function (values: any) {
      // const page = await PagesModel.findOne({_id: values[0]}).exec();
      // const page = await PagesModel.aggregate([{
      //   $lookup: {
      //     from: "users",
      //     localField: "create_user_id",
      //     foreignField: "_id",
      //     as: "create_user"
      //   }
      // }]).exec();
      const page = await PagesModel.findOne({_id: values[0]}).populate('create_user').exec();

      return { rows: [page] }
    },
  
    'addPage' : async function (values: any) {
      const page = new PagesModel({
        type: values[1],
        data: JSON.parse(values[2]),
        create_user: values[0],
      });
      const ret = await page.save();
      return { rows: [page] }
    },
  
    'updPage' : async function (values: any) {
      const page = await PagesModel.findOne({_id: values[0]}).exec();
      page.data = JSON.parse(values[1]);
      const ret = await page.save();
      return { rows: [page] }
    },
  
    'delPage' : async function (values: any) {
      const query = await PagesModel.findByIdAndRemove(values[0]).exec();
      return { rows: [{_id: values[0]}] }
    },
  };
}
