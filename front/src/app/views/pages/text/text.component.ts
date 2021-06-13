import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { UserService } from '../../../common/services/user.service';
import { MenuService } from '../../../common/services/menu.service';
import { PageService } from '../../../common/services/page.service';
import { SimpleDialogComponent, InputType } from '../../components/simpleDialog/simpleDialog.component';
import { PageBaseComponent } from '../pageBase.component';

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
})
export class TextComponent extends PageBaseComponent {

  constructor(
    public activatedRoute: ActivatedRoute,
    public cdRef: ChangeDetectorRef,
    public menu: MenuService,
    public page: PageService,
    public simpleDialog: SimpleDialogComponent,

    public toastr: ToastrService,
    public user: UserService,
  ) {
    // call pageBase constructor
    super(activatedRoute, cdRef, menu, page, simpleDialog);
  }
}
