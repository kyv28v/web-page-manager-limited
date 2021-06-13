const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: Number, 
    sex: Number, 
    birthday: Date, 
    password: String, 
    note: String, 
    menus: Array, 
    auth: Array,
  },
  {
    timestamps: true,
  },
);
export const UsersModel = mongoose.model("Users", usersSchema);

export class Users {
  // set method object to call method with action string.
  method: { [name: string]: any } = {
    'getUser' : async function (values: any) {
      const user = await UsersModel.findOne({_id: values[0]}).exec();
      return { rows: [user] }
    },
  
    'getUserCode' : async function (values: any) {
      const user = await UsersModel.findOne({code: values[0]}).exec();
      return { rows: [user] }
    },
  
    'getUsers' : async function (values: any) {
      const users = await UsersModel.find();
      return { rows: users }
    },
  
    'addUser' : async function(values: any) {
      const user = new UsersModel({
        code: values[0],
        name: values[1],
        age: values[2], 
        sex: values[3], 
        birthday: values[4], 
        password: values[5], 
        note: values[6], 
        auth: JSON.parse(values[7]),
      });
      const ret = await user.save();
      return { rows: [user] }
    },
  
   'delUser' : async function(values: any) {
      const ret = await UsersModel.findOne({_id: values[0]}).remove().exec();
      return { rows: [{_id: values[0]}] }
    },
  
    'updUser' : async function(values: any) {
      const user = await UsersModel.findOne({_id: values[0]}).exec();
      user.code = values[1];
      user.name = values[2];
      user.age = values[3];
      user.sex = values[4]; 
      user.birthday = values[5]; 
      user.note = values[6];
      user.auth = JSON.parse(values[7]);
      const ret = await user.save();
      return { rows: [user] }
    },
  
    'updUserMenus' : async function(values: any) {
      const user = await UsersModel.findOne({_id: values[0]}).exec();
      user.menus = JSON.parse(values[1]);
      const ret = await user.save();
      return { rows: [user] }
    },
  
    'updPassword' : async function(values: any) {
      const user = await UsersModel.findOne({_id: values[1]}).exec();
      user.password = values[0];
      const ret = await user.save();
      return { rows: [user] }
    },
  };
}
