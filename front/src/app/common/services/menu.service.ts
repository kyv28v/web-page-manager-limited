import { Injectable } from '@angular/core';

import { TreeNode } from '@circlon/angular-tree-component';

import { HttpRequestInterceptor } from './http';
import { UserService } from './user.service';

export interface Node {
  title: string;
  id?: string;      // angular-tree-component given id
  _id?: string;     // Database unique id(postgres: serial id, mongodb: ObjectId)
  page?: any;
  children?: Node[];
  scope?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  public menus: Node[];
  public selectedTitle: string;

  constructor(
    private http: HttpRequestInterceptor,
    private user: UserService,
    ) { }

  async getMenu(): Promise<void> {
    const datas: any = await this.http.get('api/common/db?action=Menus/getMenus&values=' + JSON.stringify([this.user._id]));
    let data: Node[] = datas.rows as Node[];

    this.menus = data;
  }

  async getAppendableMenus() {
    const appendedMenus = this.menus.map(function(menu) {
      return menu._id;
    });
    const datas: any = await this.http.get('api/common/db?action=Menus/getAppendableMenus&values=' + JSON.stringify([appendedMenus]));
    return datas.rows as any[];
  }

  // create menu
  async createMenu(title: string, scopeType: string) {
    // Save menu in DB
    const ret: any = await this.http.post('api/common/db', { action: 'Menus/addMenu', values: [title, '[]', '{"scopeType": "' + scopeType + '"}', null, this.user._id] });
    if (ret.message !== null) {
        alert('Create menu failed\n' + ret.message);
        return false;
    }

    // Add added menu to user's menu list
    if (!this.user.menus) this.user.menus = [];
    this.user.menus.push(ret.rows[0]._id);
    const ret2: any = await this.http.post('api/common/db', { action: 'Users/updUserMenus', values: [this.user._id, JSON.stringify(this.user.menus)] });
    if (ret2.message !== null) {
      alert('Update user menus failed.\n' + ret2.message);
      return;
    }
  }

  // add page
  async addPage(node: TreeNode, type: string, title: string, defaultData: string): Promise<boolean> {
    // Save page in DB
    const ret: any = await this.http.post('api/common/db', { action: 'Pages/addPage', values: [this.user._id, type, JSON.stringify(defaultData)] });
    if (ret.message !== null) {
        alert('Add page failed\n' + ret.message);
        return false;
    }

    // Added to menu
    node.data.children.push({title, "page": {"_id": ret.rows[0]._id, type}});

    // Save menu to DB
    this.saveMenu(node);

    return true;
  }

  // delete page
  async deletePage(node: TreeNode): Promise<boolean> {
    // Delete page from DB
    const ret: any = await this.http.post('api/common/db', { action: 'Pages/delPage', values: [node.data.page._id] });
    if (ret.message !== null) {
        alert('Delete menu failed\n' + ret.message);
        return false;
    }

    // Also delete from the menu
    node.parent.data.children = node.parent.data.children.filter(function( nodes ) {
      return nodes !== node.data;
    });

    // Save menu to DB
    this.saveMenu(node);

    return true;
  }

  // delete folder
  async deleteFolder(node: TreeNode): Promise<boolean> {
    // Delete all subordinate pages from DB
    await this.deleteFolderPages(node.data);

    // Delete folder from menu
    node.parent.data.children = node.parent.data.children.filter(function( nodes ) {
      return nodes !== node.data;
    });

    // Save menu to DB
    this.saveMenu(node);

    return true;
  }
  async deleteFolderPages(node: Node): Promise<boolean> {
    // If there is a folder under it, delete it first
    if (node.children && node.children.length > 0) {
      // node.data.children.array.forEach(async element => {
      for(var child of node.children) {
        await this.deleteFolderPages(child);
      }
    }

    // For pages, delete the page from the DB
    if (node.page) {
      const ret: any = await this.http.post('api/common/db', { action: 'Pages/delPage', values: [node.page._id] });
      if (ret.message !== null) {
          alert('Delete page failed\n' + ret.message);
          return false;
      }
    }

    return true;
  }

  // delete menu
  async deleteMenu(node: TreeNode): Promise<boolean> {
    // Delete all subordinate pages from DB
    await this.deleteFolderPages(node.data);

    // Delete menu
    const ret: any = await this.http.post('api/common/db', { action: 'Menus/delMenu', values: [node.data._id] });
    if (ret.message !== null) {
        alert('Delete menu failed\n' + ret.message);
        return false;
    }

    // The menus in the users table is not updated here.
    // Since it is necessary to update the menus of other users as well, the menus are updated triggered by the operations of each user.

    // Reload menu
    this.getMenu();

    return true;
  }

  // Update user menu
  // * Overwrite users.menus with current menu data
  async updateUserMenu() {
    // Get the current menu data (excluding deleted menus)
    const menus = this.menus.map(({_id}) => (_id));

    const ret: any = await this.http.post('api/common/db', { action: 'Users/updUserMenus', values: [this.user._id, JSON.stringify(menus)] });
    if (ret.message !== null) {
      alert('Update user menus failed.\n' + ret.message);
      return false;
    }
    return true;
  }  

  // Save menu to DB
  async saveMenu(node: TreeNode): Promise<boolean> {
    const rootNode = this.getRootNode(node);
    return await this.saveMenuByRootNode(rootNode);
  }

  async saveMenuByRootNode(rootNode: Node): Promise<boolean> {
    const ret: any = await this.http.post('api/common/db', { action: 'Menus/updMenu', values: [
      rootNode._id
      , rootNode.title
      , JSON.stringify(rootNode.children)
      , JSON.stringify(rootNode.scope)
    ] });
    if (ret.message !== null) {
        alert('Save menu failed\n' + ret.message);
        return false;
    }
    return true;
  }

  // Get the root node by tracing the parent from the specified node
  getRootNode(node: TreeNode) {
    if (node.data._id){
      return node.data;
    } else {
      return this.getRootNode(node.parent);
    }
  }

  // Search all nodes from the specified node ID and get the root node
  getRootNodeById(nodeId: string) {
    for(const node of this.menus) {
      // Check if there is a node with a node ID under the route
      if (this.getNodeById(node, nodeId) !== null) {
        return node;
      }
    }
  }

  // Get the node with the specified node ID from under the specified node
  getNodeById(node: Node, nodeId: string) {
    if(node.id === nodeId) {
      return node;
    } else {
      if(node.children) {
        for(var child of node.children) {
          const target = this.getNodeById(child, nodeId);
          if(target !== null) {
            return target;
          }
        }
      }
    }
    return null;
  }

  // Search for the title with the specified page ID from the menu data
  // * To redisplay when the browser is reloaded
  refreshSelectedTitle(pageId) {
    for(const node of this.menus) {
      // Check if there is a node with a page ID under the route
      var pageNode = this.getNodeByPageId(node, pageId);
      if (pageNode !== null) {
        this.selectedTitle = pageNode.title;
        return;
      }
    }
  }
  getNodeByPageId(node: Node, pageId): Node {
    if(node?.page?._id == pageId) {
      return node;
    } else {
      if(node.children) {
        for(var child of node.children) {
          const target = this.getNodeByPageId(child, pageId);
          if(target !== null) {
            return target;
          }
        }
      }
    }
    return null;
  }
}