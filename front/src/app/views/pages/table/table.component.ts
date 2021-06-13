import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { HttpRequestInterceptor } from '../../../common/services/http';
import { UserService } from '../../../common/services/user.service';
import { MenuService } from '../../../common/services/menu.service';
import { PageService } from '../../../common/services/page.service';
import { SimpleDialogComponent, InputType } from '../../components/simpleDialog/simpleDialog.component';
import { PageBaseComponent } from '../pageBase.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [ HttpRequestInterceptor ],
})
export class TableComponent extends PageBaseComponent {

  constructor(
    public activatedRoute: ActivatedRoute,
    public cdRef: ChangeDetectorRef,
    public menu: MenuService,
    public page: PageService,
    public simpleDialog: SimpleDialogComponent,

    public http: HttpRequestInterceptor,
    public toastr: ToastrService,
    public user: UserService,
    public router: Router,
  ) {
    // call pageBase constructor
    super(activatedRoute, cdRef, menu, page, simpleDialog);
  }

  // ----------------------------------------------------------------------------
  // 一覧テーブル処理
  // ----------------------------------------------------------------------------
  // 行追加
  insertRow() {
    const data: string[] = new Array(this.page.data.header.length);
    this.page.data.datas.push(data);
  }

  // 行削除
  async deleteRow(index) {
    // 確認ダイアログの表示
    const result = await this.simpleDialog.confirm(
      'table.delete',
      'table.deleteConfirm',
    );
    if (result !== 'ok') { return; }

    // バインド変数から削除
    this.page.data.datas.splice(index, 1);
  }

  // 列挿入
  insertCol(index) {
    this.page.data.header.splice(index, 0, null) ;
    this.page.data.datas.forEach((data) => {
      data.splice(index, 0, null) ;
    });
  }

  // 列削除
  deleteCol(index) {
    this.page.data.header.splice(index, 1) ;
    this.page.data.datas.forEach((data) => {
      data.splice(index, 1) ;
    });
  }

  // タイトル更新
  async editTitle(index) {
    // ユーザ登録用のダイアログ表示
    const dialog = this.simpleDialog.open();
    dialog.title = 'Edit title';
    dialog.message = '';
    dialog.items = [
      { label: 'Name', value: this.page.data.header[index], inputtype: InputType.Text, required: false },
    ];
    dialog.buttons = [
      { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
      { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.editTitleExec(index, dialog); } },
    ];
  }

  // タイトル更新（ダイアログ側で実行される処理）
  async editTitleExec(index: any, dialog: SimpleDialogComponent) {
    // 入力チェック
    if (dialog.validation() === false) { return; }

    // バインド変数に代入
    this.page.data.header[index] = dialog.items[0].value;

    dialog.close('ok');
  }

  // 更新
  async editData(data) {
    // ユーザ登録用のダイアログ表示
    const dialog = this.simpleDialog.open();
    dialog.title = 'Edit data';
    dialog.message = '';
    dialog.items = [];
    this.page.data.header.forEach((header, index) => {
      dialog.items.push({ label: header, value: data[index], inputtype: InputType.Text, required: false });
    });
    dialog.buttons = [
      { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialog.close('cancel'); } },
      { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { this.editDataExec(data, dialog); } },
    ];
  }

  // 更新（ダイアログ側で実行される処理）
  async editDataExec(data: any, dialog: SimpleDialogComponent) {
    // 入力チェック
    if (dialog.validation() === false) { return; }

    // バインド変数に代入
    dialog.items.forEach((item, index) => {
      data[index] = item.value;
    });

    dialog.close('ok');
  }

  // get csv
  getCsv() {
    // create csv data string
    let csvData = this.page.data.header.map(col =>
      '"' + col + '"'
    ).join(",") + "\n";

    csvData +=
    this.page.data.datas.map(row => 
      row.map(col =>
        '"' + (col ? col : '') + '"'
      ).join(",")
    ).join("\n");

    // create csv and download
    super.getCsv(csvData);
  }
}
