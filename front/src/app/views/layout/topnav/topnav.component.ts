import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DatePipe } from '@angular/common';

import { HttpRequestInterceptor } from '../../../common/services/http';
import { SharedService } from '../../../common/services/shared.service';
import { UserService } from '../../../common/services/user.service';
import { SimpleDialogComponent, InputType } from '../../components/simpleDialog/simpleDialog.component';
import { TableDialogComponent } from '../../components/tableDialog/tableDialog.component';
import { Enums, EnumChangePipe } from '../../../common/defines/enums';

import * as crypto from 'crypto-js';

@Component({
    selector: 'app-topnav',
    templateUrl: './topnav.component.html',
    styleUrls: ['./topnav.component.scss'],
    providers: [
        HttpRequestInterceptor,
        DatePipe,
        EnumChangePipe,
    ],
})
export class TopnavComponent implements OnInit {
    // 他コンポーネントのイベント（sidebar.toggle）を実行するため、EventEmitterを使用する
    @Output() toggleSidebar = new EventEmitter();
    @Output() onThemeChangeEvent = new EventEmitter<String>();

    constructor(
        public router: Router,
        private http: HttpRequestInterceptor,
        public shared: SharedService,
        public user: UserService,
        private datePipe: DatePipe,
        private enumChangePipe: EnumChangePipe,
        private simpleDialog: SimpleDialogComponent,
        private tableDialog: TableDialogComponent,
        ) { }

    ngOnInit() {
    }

    // ログアウト
    async onLoggedout() {
        await this.user.logout();
    }

    // // ユーザ情報表示
    // async showUserInfo() {
    //     const selectedName = this.user.auth.map((id) => (this.enumChangePipe.transform(id, Enums.Auth)));

    //     // ユーザ情報用のダイアログ表示
    //     const modalRef = this.modalService.open(SimpleDialogComponent, { backdrop: 'static' });
    //     const dialog = modalRef.componentInstance as SimpleDialogComponent;
    //     dialog.title = 'Profile';
    //     dialog.message = '';
    //     dialog.items = [
    //         { label: 'Name', value: this.user.name, inputtype: InputType.Display },
    //         { label: 'Age', value: this.user.age, inputtype: InputType.Display },
    //         { label: 'Sex', value: this.enumChangePipe.transform(this.user.sex, Enums.Sex), inputtype: InputType.Display },
    //         { label: 'Birthday', value: this.datePipe.transform(this.user.birthday, 'yyyy/MM/dd'), inputtype: InputType.Display },
    //         { label: 'Note', value: this.user.note, inputtype: InputType.DisplayArea },
    //         { label: 'Auth', value: selectedName, inputtype: InputType.DisplayArea },
    //     ];
    //     dialog.buttons = [
    //         { class: 'btn-right', name: 'ok',     click: async () => { dialog.activeModal.close('cancel'); } },
    //     ];

    //     // ダイアログの実行待ち
    //     const result = await modalRef.result;
    // }

    // open user manage dialog
    async openUserMng() {
        // open dialog.
        const dialog = this.tableDialog.open();
        dialog.title = 'topMenu.userManage';
        dialog.getData = async () => await this.getUsers(dialog);
        dialog.addData = async () => await this.addUser(dialog);
        dialog.updateData = async (data) => await this.updateUser(dialog, data);
        dialog.deleteData = async (data) => await this.deleteUser(dialog, data);
        dialog.list_columns = ['code','name','age','sexDisp','birthdayDisp','note'];
        dialog.authType = 30;
        dialog.translateHeader = "user.";

        dialog.getData();
    }
    
    // 検索
    async getUsers(dialog: TableDialogComponent) {
        // 検索のクエリを実行
        // const values = JSON.stringify([dialog.searchText]);
        const values = JSON.stringify(['']);
        const ret: any = await this.http.get('api/common/db?action=Users/getUsers&values=' + values);
        if (ret.message !== null) {
            alert('Get users failed.\n' + ret.message);
            return;
        }

        // transform pipe data
        let datas = ret.rows;
        datas.forEach(data => {
            data['sexDisp'] = this.enumChangePipe.transform(data['sex'], Enums.Sex);
            data['birthdayDisp'] = this.datePipe.transform(data['birthday'], 'yyyy/MM/dd');
        });

        dialog.datas = datas;
    }

    async addUser(dialog: TableDialogComponent) {
        await this.regUser(dialog, null)
    }

    async updateUser(dialog: TableDialogComponent, data) {
        await this.regUser(dialog, data)
    }

    async regUser(dialog: TableDialogComponent, data) {
        const selectedList = Enums.getSelectedList(Enums.Auth, data?.auth);

        // ユーザ登録用のダイアログ表示
        const dialog2 = this.simpleDialog.open('600px');
        dialog2.title = 'user.registerUser';
        dialog2.message = '';
        dialog2.items = [
        	{ label: 'user.code', value: data?.code, inputtype: data ? InputType.Display : InputType.Text, required: true, placeholder: '' },
          { label: 'user.name', value: data?.name, inputtype: InputType.Text, required: true, placeholder: '' },
          { label: 'user.age', value: data?.age, inputtype: InputType.Text, required: true, placeholder: '' },
          { label: 'user.sex', value: data?.sex, inputtype: InputType.Radio, required: false, placeholder: '', selectList : Enums.Sex },
          { label: 'user.birthday', value: data?.birthday, inputtype: InputType.Date, required: false, placeholder: '' },
          { label: 'user.password', value: data ? '●●●●●●' : null, inputtype: data ? InputType.Display : InputType.Password, required: true, placeholder: '' },
          { label: 'user.note', value: data?.note, inputtype: InputType.TextArea, required: false, placeholder: '' },
          { label: 'user.auth', value: selectedList, inputtype: InputType.Check, required: false, placeholder: '', selectList : Enums.Auth },
        ];
        dialog2.buttons = [
          { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog2.close('cancel'); } },
          { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { await this.regUserExec(dialog2, data); } },
        ];

        // ダイアログの実行待ち
        const result = await dialog2.wait();
        if (result !== 'ok') { return; }

        // 再検索
        await dialog.search();
    }
    // 追加/更新（ダイアログ側で実行される処理）
    // async regUserExec(data: any, dialog: Dialog) {
    async regUserExec(dialog: SimpleDialogComponent, data: any) {
        // 入力チェック
        if (dialog.validation() === false) { return; }

        // 確認ダイアログの表示
        const result = await this.simpleDialog.confirm(
            'user.registerUser',
            'user.registerConfirm',
        );
        if (result !== 'ok') { return; }

        // APIの呼び出し
        const code = dialog.items[0].value;
        const name = dialog.items[1].value;
        const age = dialog.items[2].value;
        const sex = dialog.items[3].value;
        const birthday = dialog.items[4].value;
        const password = dialog.items[5].value;
        const note = dialog.items[6].value;
        const auth = JSON.stringify(Enums.getSelectedValue(Enums.Auth, dialog.items[7].value));

        // 追加/更新のクエリを実行
        let body;
        if (data) {
            body = { action: 'Users/updUser', values: [data._id, code, name, age, sex, birthday, note, auth] };
        } else {
            // パスワードのハッシュ化
            const hashedPassword = crypto.SHA512(password).toString();
            body = { action: 'Users/addUser', values: [code, name, age, sex, birthday, hashedPassword, note, auth] };
        }
        const ret: any = await this.http.post('api/common/db', body);
        if (ret.message !== null) {
            alert('Register user failed.\n' + ret.message);
            return;
        }

        dialog.close('ok');
    }

    async deleteUser(dialog: TableDialogComponent, data) {
        // 確認ダイアログの表示
        const result = await this.simpleDialog.confirm(
          'user.deleteUser',
          'user.deleteConfirm',
     );
        if (result !== 'ok') { return; }

        // 削除のクエリを実行
        const body = { action: 'Users/delUser', values: [data._id] };
        const ret: any = await this.http.post('api/common/db', body);
        if (ret.message !== null) {
          alert('Delete user failed.\n' + ret.message);
          return;
        }

        // 再検索
        await dialog.search();
    }

    // change password
    async changePassword() {
        // open dialog
        const dialog = this.simpleDialog.open();
        dialog.title = 'user.changePassword';
        dialog.message = '';
        dialog.items = [
            { label: 'user.oldPassword',   value: null, inputtype: InputType.Password, required: true, placeholder: '' },
            { label: 'user.newPassword',   value: null, inputtype: InputType.Password, required: true, placeholder: '' },
            { label: 'user.newPassword2',  value: null, inputtype: InputType.Password, required: true, placeholder: '' },
        ];
        dialog.buttons = [
          { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
          { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { await this.changePasswordExec(dialog); } },
        ];

        // ダイアログの実行待ち
        const result = await dialog.wait();
        if (result !== 'ok') { return; }
    }
    // change password（ダイアログ側で実行される処理）
    async changePasswordExec(dialog: SimpleDialogComponent) {
        try{
            // 入力チェック
            if (dialog.validation() === false) { return; }

            // check confirm password
            if (dialog.items[1].value !== dialog.items[2].value) {
                alert("wrong confirm password.");
                return;
            }

            // open confirm dialog
            const result = await this.simpleDialog.confirm(
                'user.changePassword',
                'user.changePasswordConfirm',
            );
            if (result !== 'ok') { return; }

            // パスワードのハッシュ化
            const hashedOldPassword = crypto.SHA512(dialog.items[0].value).toString();
            const hashedNewPassword = crypto.SHA512(dialog.items[1].value).toString();

            // APIの呼び出し
            const ret: any = await this.http.post('api/common/changePassword', {
                userId: this.user._id,
                oldPassword: hashedOldPassword,
                newPassword: hashedNewPassword,
            });
            if (ret.message) {
                alert(ret.message);
                return;
            }
    
            dialog.close('ok');
        } catch(e) {
            alert(e.message)
        }
    }

    // 言語変更
    changeLang(language: string) {
        this.shared.setLanguage(language);
    }

    // テーマ変更
    onThemeChange(theme) {
        // 画面全体にテーマを反映させるため、layputのイベントを呼び出す
        this.onThemeChangeEvent.emit(theme);
    }

    // open system info dialog.
    async openSystemInfo() {
        // get system info.
        const systemInfo: any = await this.http.get('api/common/system/systemInfo');
        
        // open dialog
        const dialog = this.simpleDialog.open();
        dialog.title = 'system.systemInfo';
        dialog.message = '';
        dialog.items = [
            { label: 'system.clientBuildDt',    value: systemInfo.clientBuildDt,    inputtype: InputType.Display },
            { label: 'system.serverBuildDt',    value: systemInfo.serverBuildDt,    inputtype: InputType.Display },
            { label: 'system.gitLog',           value: systemInfo.gitLog,           inputtype: InputType.DisplayArea, rows: 20, cols: 100, },
        ];
        dialog.buttons = [
          { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { dialog.close('cancel'); } },
        ];

        // ダイアログの実行待ち
        const result = await dialog.wait();
        if (result !== 'ok') { return; }
    }
}
