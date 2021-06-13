import { Users, UsersModel } from './users';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const menusSchema = Schema(
  {
    title: String,
    children: Array,
    scope: Object, 
    note: String, 
    create_user: { type: Schema.Types.ObjectId, ref: 'Users' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);
menusSchema.virtual('create_user_id').get(function (this: any) {
  return this.create_user?._id;
});
menusSchema.virtual('create_user_name').get(function (this: any) {
  return this.create_user?.name;
});
const MenusModel = mongoose.model("Menus", menusSchema);

export class Menus {
  // set method object to call method with action string.
  method: { [name: string]: any } = {
    'addMenu' : async function (values: any) {
      const menu = new MenusModel({
        title: values[0],
        children: JSON.parse(values[1]),
        scope: JSON.parse(values[2]),
        note: values[3], 
        create_user: values[4], 
        create_dt: null, 
      });
      const ret = await menu.save();
      return { rows: [menu] }
    },

    'getMenus' : async function (values: any) {
      // get menu included in users.menus
      const user = await UsersModel.findOne({_id: values[0]}).exec();
      const menus = await MenusModel.find({_id: user.menus}).populate('create_user').exec();
      return { rows: menus }
    },
  
    'getAppendableMenus' : async function (values: any) {
      // exclude already added id.
      const menus = await MenusModel.find({ $and: [
        {_id: {$nin: values[0]}},
        {scope: {scopeType: "Public" } }
      ] }).exec();
      return { rows: menus }
    },
  
    'updMenu' : async function (values: any) {
      const menu = await MenusModel.findOne({_id: values[0]}).exec();
      menu.title = values[1];
      menu.children = JSON.parse(values[2]);
      menu.scope = JSON.parse(values[3]);
      const ret = await menu.save();
      return { rows: [menu] }
    },
  
    'delMenu' : async function(values: any) {
      const ret = await MenusModel.findOne({_id: values[0]}).remove().exec();
      return { rows: [{_id: values[0]}] }
    },
  };
}
