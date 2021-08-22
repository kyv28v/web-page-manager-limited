import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import {FlatTreeControl} from '@angular/cdk/tree';
import { v4 as uuidv4 } from 'uuid';
import { TreeNode } from '@circlon/angular-tree-component';
import { TREE_ACTIONS } from '@circlon/angular-tree-component';

import { PageDefines } from '../../../common/defines/pageDefines';
import { HttpRequestInterceptor } from '../../../common/services/http';
import { SharedService } from '../../../common/services/shared.service';
import { UserService } from '../../../common/services/user.service';
import { MenuService, Node } from '../../../common/services/menu.service';
import { PageService } from '../../../common/services/page.service';
import { SimpleDialogComponent, InputType } from '../../components/simpleDialog/simpleDialog.component';
import { Enums, EnumChangePipe } from '../../../common/defines/enums';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    providers: [
        HttpRequestInterceptor,
        DatePipe,
        EnumChangePipe,
    ],
})
export class SidebarComponent implements OnInit {
    // 他コンポーネントのイベント（sidebar.toggle）を実行するため、EventEmitterを使用する
    @Output() toggleSidebar = new EventEmitter();

    public pageDefines = PageDefines;

    // #region menu         ----------------------------------------------------------------------------
    // メニュー関連の実装
    @ViewChild('tree') tree;
    options = {
      allowDrag: (node: TreeNode) => {
        if (node.data.isTitleInput) { return false; }           // 入力中の場合はDrag不可とする
        return this.user.authCheck(12);                         // メニューを編集する権限がある場合、Drag可能とする
      },
      allowDrop: (element, { parent, index }) => {
        return !parent.data.page;                               // ページデータがないものはフォルダなのでDrop可能とする
      },
      getNodeClone: (node: TreeNode) => ({
        ...node.data,
        id: uuidv4(),
        name: `copy of ${node.data.name}`
      }),
      actionMapping: {
        mouse: {
          click: async (tree, node, $event) => {
            try {
                // 子ノードがある場合、フォルダー展開イベントを実行する
                if (node.children) {
                    // ただし、入力中の場合は何もしない
                    if (node.data.isTitleInput) { return true; }

                    this.expandFolder(tree, node, $event)
                    return true;
                }

                // ページのクリックの場合、画面遷移
                if (node.data.page) {
                    // 編集中の場合、確認メッセージを表示する
                    if (this.page.dirtyCheck()){
                        const result = await this.simpleDialog.confirm(
                            'confirm',
                            'leavePage',
                        );
                        if (result !== 'ok') { return; }

                        // ページデータを変更前に戻す。（beforeUnload.guard.ts でもチェック処理があるので、そちらに引っかからないように。）
                        this.page.data = JSON.parse(this.page.data_org);
                    }

                    // ウインドウ幅が狭いときは、自動的にメニューを隠す
                    if (800 >= window.innerWidth) {
                        this.toggleSidebar.emit();
                    }
                
                    // ページ画面へ遷移
                    await this.router.navigate(['/' + node.data.page.type, node.data.page._id]);
                    this.menu.selectedTitle = node?.data?.title;

                    // 通常のクリックイベントを実行
                    TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event);
                }

                return true;
            } catch(e) {
                alert(e);
            }
          },
          expanderClick: (tree, node, $event) => {
            this.expandFolder(tree, node, $event)
            return true;
          },
        }
      }
    };
    // フォルダー展開イベント
    expandFolder(tree, node, $event) {
        // 通常のクリックイベントを実行
        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);

        // 展開されたノードを取得し、localStorageに保持する
        // ※ メニュー直下はidを保持していないので、menu_idを保存する
        var expandedNodeIds = Object.entries(this.tree.treeModel.expandedNodeIds);
        var expandedIds = expandedNodeIds.filter(x => x[1] === true).map(x => x[0]);
        var expandedMenuIds = [];
        this.tree.treeModel.nodes.forEach((node: Node) =>
        {
            if (expandedIds.includes(node.id.toString())) {
                expandedMenuIds.push(node._id);
                expandedIds = expandedIds.filter(x => x !== node.id.toString());
            }
        });
        localStorage.setItem('sidebar.expandedMenuIds', JSON.stringify(expandedMenuIds));
        localStorage.setItem('sidebar.expandedIds', JSON.stringify(expandedIds));
    }

    // マウスでの移動イベント
    async onMoveNode($event) {
        console.log("Moved", $event.node.title, "to", $event.to.parent.title, "at index", $event.to.index);

        // 移動元先がルートかどうか判定する（親ノードが title プロパティを保持していなければルートと判定する）
        const fromIsRoot = $event.from.parent.title ? false : true;
        const toIsRoot = $event.to.parent.title ? false : true;

        // 移動元がルートで、他のルート内へ移動した場合は何もしない
        if (fromIsRoot && !toIsRoot) {
            this.refreshMenu();
            await this.simpleDialog.notify(
                'error',
                'sideMenu.rootMenuMoveError',
            );
            return;
        }

        // 移動元がルートでなく、ルート外へ移動した場合は何もしない
        if (!fromIsRoot && toIsRoot) {
            this.refreshMenu();
            await this.simpleDialog.notify(
                'error',
                'sideMenu.outOfRootMenuError',
            );
            return;
        }

        // 移動元先ともにルートの場合、menusテーブルではなくusersテーブルの順番を変更して保存する
        if (fromIsRoot && toIsRoot) {
            if (!this.user.menus) this.user.menus = [];
            this.user.menus = $event.to.parent.children.map((menu) => menu._id);
            await this.user.updateUserMenus();
            return;
        }

        // 移動元先ともにルートでなければ、menusを保存する
        if (!fromIsRoot && !toIsRoot) {
            // 移動元先のIDから、ルートのノードを取得
            const srcRoot = this.menu.getRootNodeById($event.from.parent.id);
            const dstRoot = this.menu.getRootNodeById($event.to.parent.id);

            // メニューをDBへ保存（メニューをまたいで移動した場合は、両方とも保存する）
            await this.menu.saveMenuByRootNode(srcRoot);
            if (srcRoot.id !== dstRoot.id) {
                await this.menu.saveMenuByRootNode(dstRoot);
            }
        }
    }

    // refresh menu
    async refreshMenu() {
        // メニュー情報を取得
        await this.menu.getMenu();
        var self = this;
        setTimeout(function() {
            // メニューの展開状況を復元
            // self.tree.treeModel.expandAll();
            self.restoreMenuExpanded();
        }, 0);
    }

    // フォルダー名変更関連の実装
    @ViewChild('titleInput')
    set focusFolderNameInput(_input: ElementRef | undefined) {
      if (_input !== undefined) {
        _input.nativeElement.focus();
      }
    }
  
    private beforeTitle: string;
    async changeTitleInput(node: TreeNode) {
        if (!node.data.isTitleInput) {
            // 入力モードでなければ、入力モードへ移行
            node.data.isTitleInput = true;
            // 変更前タイトルを保持
            this.beforeTitle = node.data.title;
        } else {
            // 入力モードなら、入力モードを解除
            delete node.data.isTitleInput;
            
            // 変更されていたらDB保存
            if (node.data.title !== this.beforeTitle) {
                await this.menu.saveMenu(node);

                // 選択中タイトルも更新
                if (node.data.page) {
                    this.menu.selectedTitle = node.data.title;
                }
            }
        }
    }

    // 入力モードになったとき、テキストを全選択状態にする
    select(event) {
        setTimeout(function() {
            event.target.select();
        }, 0);
    }
    // #endregion               ----------------------------------------------------------------------------

    // コンストラクタ
    constructor(
        private router: Router,
        private http: HttpRequestInterceptor,
        public shared: SharedService,
        public user: UserService,
        public menu: MenuService,
        public page: PageService,
        private simpleDialog: SimpleDialogComponent,
        private datePipe: DatePipe,
        private enumChangePipe: EnumChangePipe,
    ) { }

    async ngOnInit() {
        console.log('sidebar.ngOnInit start.')

        // メニュー情報を取得
        await this.menu.getMenu();

        // users.menusを更新
        // ※ 他のユーザーからメニューが削除されている可能性があるため、削除されたメニューを除去して更新する。
        await this.menu.updateUserMenu();

        // メニューの展開状況を復元
        this.restoreMenuExpanded();

        console.log('sidebar.ngOnInit end.')
    }

    // メニューの展開状況を復元
    restoreMenuExpanded() {
        // メニューを展開
        // ※ メニュー直下は、_id が一致するものを展開
        var expandedMenuIds = JSON.parse(localStorage.getItem('sidebar.expandedMenuIds'));
        this.tree.treeModel.nodes.forEach((node: Node) =>{
            if (expandedMenuIds.includes(node._id)) {
                var treeNode = this.tree.treeModel.getNodeById(node.id);
                if (treeNode != null) treeNode.expand();
            }
        })
        // ※ メニュー直下以外は、ツリーのid が一致するものを展開
        var expandedIds = JSON.parse(localStorage.getItem('sidebar.expandedIds'));
        expandedIds.forEach((expandedId) =>
        {
            var treeNode = this.tree.treeModel.getNodeById(parseInt(expandedId));
            if (treeNode != null) treeNode.expand();
        });
        //self.tree.treeModel.update();
    }

    // メニュー作成
    async createMenu() {
        // メニュー作成ダイアログ表示
        const dialog = this.simpleDialog.open();
        dialog.title = 'sideMenu.createNewMenu';
        dialog.message = '';
        dialog.items = [
            { label: 'sideMenu.name', value: 'New Menu', inputtype: InputType.Text, required: true },
            { label: 'sideMenu.scopeType', value: null, inputtype: InputType.Select, required: true, selectList : Enums.ScopeType },
        ];
        dialog.buttons = [
            { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
            { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.createMenuExec(dialog); } },
        ];

        return false;
    }
    async createMenuExec(dialog: SimpleDialogComponent) {
        // validation
        if (dialog.validation() === false) { return; }
        
        await this.menu.createMenu(
            dialog.items[0].value,
            dialog.items[1].value,
        );

        // メニュー情報を取得
        await this.menu.getMenu();
        var self = this;
        setTimeout(function() {
            // メニューの展開状況を復元
            // self.tree.treeModel.expandAll();
            self.restoreMenuExpanded();
        }, 0);

        dialog.close();
    }

    // メニュー追加
    async appendMenu() {
        // 追加可能なメニューを取得
        const menus: any[] = await this.menu.getAppendableMenus();
        const menuList = menus.map(({_id, title}) => ({id: _id, name: title}));

        // メニュー追加用のダイアログ表示
        const dialog = this.simpleDialog.open();
        dialog.title = 'sideMenu.appendExistingMenu';
        dialog.message = '';
        dialog.items = [
            { label: 'sideMenu.menu', value: null, inputtype: InputType.Select, required: true, selectList : menuList },
        ];
        dialog.buttons = [
            { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
            { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.appendMenuExec(dialog); } },
        ];

        // ダイアログの実行待ち
        const result = await dialog.wait();
        if (result !== 'ok') { return; }
    }

    // メニュー追加（ダイアログ側で実行される処理）
    async appendMenuExec(dialog: SimpleDialogComponent) {
        // 入力チェック
        if (dialog.validation() === false) { return; }

        // 追加してユーザ情報を更新
        if (!this.user.menus) this.user.menus = [];
        let menu_id = Number(dialog.items[0].value);
        if (isNaN(menu_id)) { menu_id = dialog.items[0].value; }  // postgres id is integer, mongodb id is string.
        this.user.menus.push(menu_id);
        await this.user.updateUserMenus();
    
        // メニュー情報を再取得
        await this.menu.getMenu();

        // メニューをリフレッシュ
        this.tree.treeModel.update();
        // this.tree.treeModel.expandAll();
        var self = this;
        setTimeout(function() {
            // メニューの展開状況を復元
            // self.tree.treeModel.expandAll();
            self.restoreMenuExpanded();
        }, 0);

        dialog.close('ok');
    }

    // フォルダー追加
    async addFolder(node: TreeNode) {
        // フォルダー追加ダイアログ表示
        const dialog = this.simpleDialog.open();
        dialog.title = 'sideMenu.addFolder';
        dialog.message = '';
        dialog.items = [
            { label: 'sideMenu.name', value: 'New Folder', inputtype: InputType.Text, required: true },
        ];
        dialog.buttons = [
            { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
            { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.addFolderExec(dialog, node); } },
        ];

        return false;
    }
    async addFolderExec(dialog: SimpleDialogComponent, node: TreeNode) {
        // validation
        if (dialog.validation() === false) { return; }

        if(!node.data.children) { node.data.children = []; }
        node.data.children.push({title: dialog.items[0].value, children: []});

        // メニューをDBに保存
        await this.menu.saveMenu(node);

        // メニューをリフレッシュ
        this.tree.treeModel.update();
        // メニューの展開状況を復元
        // this.tree.treeModel.expandAll();
        this.restoreMenuExpanded();

        dialog.close('ok');
    }

    // ページ追加
    async addPage(node: TreeNode, pageDefine) {
        // ページ追加ダイアログ表示
        const dialog = this.simpleDialog.open();
        dialog.title = 'sideMenu.addPage';
        dialog.message = '';
        dialog.items = [
            { label: 'sideMenu.name', value: 'New Page', inputtype: InputType.Text, required: true },
        ];
        dialog.buttons = [
            { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
            { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.addPageExec(dialog, node, pageDefine); } },
        ];

        return false;
    }
    async addPageExec(dialog: SimpleDialogComponent, node: TreeNode, pageDefine) {
        // validation
        if (dialog.validation() === false) { return; }

        const ret: boolean = await this.menu.addPage(
            node,
            pageDefine.type, 
            dialog.items[0].value, 
            pageDefine.defaultData,
            );
        if (ret === false) return;

        // メニューをリフレッシュ
        this.tree.treeModel.update();

        // メニューの展開状況を復元
        // this.tree.treeModel.expandAll();
        this.restoreMenuExpanded();

        dialog.close('ok');
    }

    // ページ削除
    async deletePage(node: TreeNode) {
        // 確認ダイアログ表示
        const result = await this.simpleDialog.confirm(
            'sideMenu.deletePage',
            'sideMenu.deletePageConfirm',
        );
        if (result !== 'ok') { return; }

        // ページ削除
        const ret: boolean = await this.menu.deletePage(node);
        if (ret === false) return;

        // メニューをリフレッシュ
        this.tree.treeModel.update();
    }

    // フォルダー削除
    async deleteFolder(node: TreeNode) {
        // 確認ダイアログ表示
        const result = await this.simpleDialog.confirm(
            'sideMenu.deleteFolder',
            'sideMenu.deleteFolderConfirm',
        );
        if (result !== 'ok') { return; }

        // フォルダー削除
        const ret: boolean = await this.menu.deleteFolder(node);
        if (ret === false) return;

        // メニューをリフレッシュ
        this.tree.treeModel.update();
    }

    // メニュー解除
    async releaseMenu(node: TreeNode) {
        // 確認ダイアログ表示
        const result = await this.simpleDialog.confirm(
            'sideMenu.releaseMenu',
            'sideMenu.releaseMenuConfirm',
        );
        if (result !== 'ok') { return; }

        // メニュー解除してユーザ情報を更新
        this.user.menus = this.user.menus.filter(_id => _id !== node.data._id);
        await this.user.updateUserMenus();

        // メニューをリフレッシュ
        this.refreshMenu();
    }

    // メニュー削除
    async deleteMenu(node: TreeNode) {
        // 確認ダイアログ表示
        const result = await this.simpleDialog.confirm(
            'sideMenu.deleteMenu',
            'sideMenu.deleteMenuConfirm',
        );
        if (result !== 'ok') { return; }

        // メニュー削除
        const ret: boolean = await this.menu.deleteMenu(node);
        if (ret === false) return;

        // メニューをリフレッシュ
        this.tree.treeModel.update();
        // this.tree.treeModel.expandAll();
        var self = this;
        setTimeout(function() {
            // メニューの展開状況を復元
            // self.tree.treeModel.expandAll();
            self.restoreMenuExpanded();
        }, 0);
    }

    // メニュー保存
    async saveMenu(node: TreeNode) {
        await this.menu.saveMenu(node);
    }

    // メニュープロパティ表示
    async menuProperty(node: TreeNode) {
        const dialog = this.simpleDialog.open();
        dialog.title = 'sideMenu.property';
        dialog.message = '';
        dialog.items = [
            { label: 'sideMenu.name', value: node.data.title, inputtype: InputType.Text, required: true },
            { label: 'sideMenu.scopeType', value: node.data.scope.scopeType, inputtype: InputType.Select, required: true, selectList : Enums.ScopeType },
            { label: 'sideMenu.createUserName', value: node.data.create_user_name, inputtype: InputType.Display },
        ];
        dialog.buttons = [
            { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
            { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.updateMenuPropertyExec(dialog, node); } },
        ];

        return false;
    }
    async updateMenuPropertyExec(dialog: SimpleDialogComponent, node: TreeNode) {
        node.data.title = dialog.items[0].value;
        node.data.scope = {"scopeType": dialog.items[1].value};
        await this.menu.saveMenu(node);
        this.tree.treeModel.update();
        dialog.close('ok');
    }

    // フォルダープロパティ表示
    async folderProperty(node: TreeNode) {
        const dialog = this.simpleDialog.open();
        dialog.title = 'sideMenu.property';
        dialog.message = '';
        dialog.items = [
            { label: 'sideMenu.name', value: node.data.title, inputtype: InputType.Text, required: true },
        ];
        dialog.buttons = [
            { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
            { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.updateFolderPropertyExec(dialog, node); } },
        ];

        return false;
    }
    async updateFolderPropertyExec(dialog: SimpleDialogComponent, node: TreeNode) {
        node.data.title = dialog.items[0].value;
        await this.menu.saveMenu(node);
        this.tree.treeModel.update();
        dialog.close('ok');
    }

    // ページプロパティ表示
    async pageProperty(node: TreeNode) {
        // get page create user name.
        let create_user_name = '';
        const values = JSON.stringify([node.data.page._id]);
        const ret: any = await this.http.get('api/common/db?action=Pages/getPage&values=' + values);
        if (ret.message === null) {
            if (ret.rows.length === 1) {
                create_user_name = ret.rows[0].create_user_name;
            }
        }

        // open dialog.
        const dialog = this.simpleDialog.open();
        dialog.title = 'sideMenu.property';
        dialog.message = '';
        dialog.items = [
            { label: 'sideMenu.name', value: node.data.title, inputtype: InputType.Text, required: true },
            { label: 'sideMenu.pageType', value: node.data.page.type, inputtype: InputType.Display },
            { label: 'sideMenu.createUserName', value: create_user_name, inputtype: InputType.Display },
        ];
        dialog.buttons = [
            { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
            { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.updatePagePropertyExec(dialog, node); } },
        ];

        return false;
    }
    async updatePagePropertyExec(dialog: SimpleDialogComponent, node: TreeNode) {
        node.data.title = dialog.items[0].value;
        await this.menu.saveMenu(node);
        this.tree.treeModel.update();
        dialog.close('ok');
    }

    // ユーザ情報表示
    async showUserInfo() {
        const selectedName = this.user.auth.map((id) => (this.enumChangePipe.transform(id, Enums.Auth)));

        // ユーザ情報用のダイアログ表示
        const dialog = this.simpleDialog.open();
        dialog.title = 'sideMenu.profile';
        dialog.message = '';
        dialog.items = [
            { label: 'user.name', value: this.user.name, inputtype: InputType.Display },
            { label: 'user.age', value: this.user.age, inputtype: InputType.Display },
            { label: 'user.sex', value: this.enumChangePipe.transform(this.user.sex, Enums.Sex), inputtype: InputType.Display },
            { label: 'user.birthday', value: this.datePipe.transform(this.user.birthday, 'yyyy/MM/dd'), inputtype: InputType.Display },
            { label: 'user.note', value: this.user.note, inputtype: InputType.DisplayArea },
            { label: 'user.auth', value: selectedName, inputtype: InputType.DisplayArea, rows: 5, cols: 50, },
        ];
        dialog.buttons = [
            { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { dialog.close('cancel'); } },
        ];
    }
}
