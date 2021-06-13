import { Component, Injectable, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

import flatpickr from 'flatpickr';
import { english } from 'flatpickr/dist/l10n/default';
import { Japanese } from 'flatpickr/dist/l10n/ja';

import { TranslateService } from '@ngx-translate/core';

export namespace InputType {
  export const Display = 'display';
  export const DisplayArea = 'displayArea';
  export const Text = 'text';
  export const Number = 'number';
  export const Password = 'password';
  export const TextArea = 'textarea';
  export const Date = 'date';
  export const DateTime = 'datetime';
  export const Time = 'time';
  export const Select = 'select';
  export const Radio = 'radio';
  export const Check = 'check';
  export const Color = 'color';
}

@Injectable({
  providedIn: 'root'
})
@Component({
  selector: 'app-simple-dialog-content',
  templateUrl: './simpleDialog.component.html',
  styleUrls: ['./simpleDialog.component.scss'],
})
export class SimpleDialogComponent {
  private dialogRef: MatDialogRef<SimpleDialogComponent, any>;

  // view items
  public title;
  public message;
  public items;
  public buttons;

  // constructor
  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
  ) {
    // カレンダーの言語設定
    if (localStorage.getItem('language') === 'ja') {
      flatpickr.localize(Japanese);
    } else {
      flatpickr.localize(english);
    }
    // カレンダーを日曜日スタートにする
    flatpickr.l10ns.default.firstDayOfWeek = 0;
  }

  // open simple dialog
  public open(maxWidth = null): SimpleDialogComponent {
    // open dialog
    const dialogConfig = new MatDialogConfig()
    dialogConfig.disableClose = true;   // Does not close when the background is clicked.
    if(maxWidth) { dialogConfig.maxWidth = maxWidth; }
    
    const dialogRef = this.dialog.open(SimpleDialogComponent, dialogConfig);
    const dialogComponent = dialogRef.componentInstance as SimpleDialogComponent;
    dialogComponent.dialogRef = dialogRef;

    return dialogComponent;
  }

  // open confirm dialog
  public async confirm(title, message): Promise<string> {
    // open dialog
    const dialogConfig = new MatDialogConfig()
    dialogConfig.disableClose = true;   // Does not close when the background is clicked.
    const dialogRef = this.dialog.open(SimpleDialogComponent, dialogConfig);
    const dialogComponent = dialogRef.componentInstance as SimpleDialogComponent;
    dialogComponent.dialogRef = dialogRef;
    
    // translate message
    if (Array.isArray(message)) {
      message = this.translate.instant(message[0], message[1]);
    }

    // set dialog parts
    dialogComponent.title = title;
    dialogComponent.message = message;
    dialogComponent.buttons = [
      { class: 'btn-left',  color:'',        name: 'cancel', click: async () => { dialogComponent.close('cancel'); } },
      { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { dialogComponent.close('ok');     } },
    ];

    // wait confirm
    const result = await dialogComponent.wait();
    return result;
  }

  // open notify dialog
  public async notify(title, message: string | any[]): Promise<string> {
    // open dialog
    const dialogConfig = new MatDialogConfig()
    dialogConfig.disableClose = true;   // Does not close when the background is clicked.
    const dialogRef = this.dialog.open(SimpleDialogComponent, dialogConfig);
    const dialogComponent = dialogRef.componentInstance as SimpleDialogComponent;
    dialogComponent.dialogRef = dialogRef;

    // translate message
    if (Array.isArray(message)) {
      message = this.translate.instant(message[0], message[1]);
    }

    // set dialog parts
    dialogComponent.title = title;
    dialogComponent.message = message;
    dialogComponent.buttons = [
      { class: 'btn-right', color:'primary', name: 'ok',     click: async () => { dialogComponent.close('ok');     } },
    ];

    // wait confirm
    const result = await dialogComponent.wait();
    return result;
  }

  // close
  public close(dialogResult?: any) {
    this.dialogRef.close(dialogResult);
  }

  // wait
  public async wait() {
    return await this.dialogRef.afterClosed().toPromise();
  }

  // 入力チェック
  public validation(): boolean {
    let ret = true;

    if (this.items !== undefined) {
      for (let i = 0; i < this.items.length; i++) {
        this.items[i].validateMessage = '';
        if (this.items[i].required === true && (!this.items[i].value)) {
          this.items[i].validateMessage = this.translate.instant('requiredError');
          ret = false;
        }
      }
    }
    return ret;
  }

}
