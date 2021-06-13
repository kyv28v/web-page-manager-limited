import { Component, Input, Output, EventEmitter } from '@angular/core';

import { UserService } from '../../../common/services/user.service';
import { MenuService } from '../../../common/services/menu.service';
import { PageService } from '../../../common/services/page.service';

@Component({
  selector: 'app-page-header',
  templateUrl: './pageHeader.component.html',
  styleUrls: ['./pageHeader.component.scss'],
})
export class PageHeaderComponent {
  @Output() refreshEvent: EventEmitter<any> = new EventEmitter();
  @Output() saveEvent: EventEmitter<any> = new EventEmitter();
  @Output() getCsvEvent: EventEmitter<any> = new EventEmitter();

  constructor(
    public user: UserService,
    public menu: MenuService,
    public page: PageService,
  ) {}

  // リフレッシュ
  refresh() {
    this.refreshEvent.emit();
  }

  // 保存
  save() {
    this.saveEvent.emit();
  }

  // get csv
  getCsv() {
    this.getCsvEvent.emit();
  }
}
