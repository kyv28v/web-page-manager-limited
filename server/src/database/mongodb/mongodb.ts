import { mongoConf } from '../../config/common';
import { Users } from './models/users';
import { Menus } from './models/menus';
import { Pages } from './models/pages';
import { Bytes } from './models/bytes';
import { Database } from '../database';

const mongoose = require('mongoose');

// set class object to create class with action string.
const actionClass: { [name: string]: any } = {
  Users: Users,
  Menus: Menus,
  Pages: Pages,
  Bytes: Bytes,
};

export class MongoDB implements Database {
  async connect() {
    const connectOption = {
        useUnifiedTopology: true,
        useNewUrlParser: true
    }
    console.log('MongoDB.connect(' + mongoConf.connectString + ')');
    await mongoose.connect(mongoConf.connectString, connectOption);
  }

  async release() {
    // Do nothing with Mongo DB
  }

  async query(action: string, values: any) {
    // console.log('MongoDB.query(' + action + ',' + values + ')');
    console.log('MongoDB.query(' + action + ')');

    // call method with action string.
    const actions = action.split('/');
    return await (new actionClass[actions[0]]()).method[actions[1]](values);
  }

  async begin() {
    // Do nothing with Mongo DB
  }

  async commit() {
    // Do nothing with Mongo DB
  }

  async rollback() {
    // Do nothing with Mongo DB
  }
}
