import { HostListener, OnInit, Directive, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../../common/services/menu.service';
import { PageService } from '../../common/services/page.service';
import { SimpleDialogComponent, InputType } from '../components/simpleDialog/simpleDialog.component';

@Directive()
export abstract class PageBaseComponent implements OnInit {

  constructor(
    public activatedRoute: ActivatedRoute,
    public cdRef: ChangeDetectorRef,
    public menu: MenuService,
    public page: PageService,
    public simpleDialog: SimpleDialogComponent,
  ) {}

  // ngOnInit
  async ngOnInit() {
    // Subscribe to parameter changes
    this.activatedRoute.paramMap.subscribe(async paramMap => {
      // Save key
      this.page._id = paramMap.get('id');
      // get page
      await this.getPage();
    });
  }

  // Check if there is data being edited
  dirtyCheck(): boolean {
    return this.page.dirtyCheck();
  }
  // Return page data to before change
  clearDirty(): boolean {
    this.page.data = JSON.parse(this.page.data_org);
    return true;
  }

  // beforeunload event
  // * Check if there is data being edited
  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(e: Event) {
    if (this.page.dirtyCheck()) {
      e.returnValue = true;
    }
  }

  // get page
  async getPage(): Promise<void> {
    await this.page.getPage();

    // If the browser reloads, get the title again from the menu
    const self = this;
    setTimeout(function() {
      if(!self.menu.selectedTitle) {
        self.menu.refreshSelectedTitle(self.page._id);
        self.cdRef.detectChanges();
      }
    }, 500);
  }

  // refresh page
  async refreshPage(): Promise<void> {
    if (this.page.dirtyCheck()) {
      const result = await this.simpleDialog.confirm(
        'confirm',
        'refreshPage',
      );
      if (result !== 'ok') { return; }
    }
    await this.page.getPage();
  }

  // save page
  async savePage(): Promise<void> {
    this.page.savePage();
  }

  // get csv
  getCsv(csvData: string) {
    // convert csv data to blob, and add bom
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvData], { type: 'text/csv' });

    // create URLObject from csv data
    const url = (window.URL || window.webkitURL).createObjectURL(blob);

    // create href and click
    const link = document.createElement('a');
    link.href = url;
    link.download = this.menu.selectedTitle + ".csv";
    link.click();
  }

  // // #region abstract         ----------------------------------------------------------------------------
  // // 取得した Page データを画面へのバインド変数に変換する
  // abstract convPageToBind(): void;

  // // バインド変数のデータを Page データへ変換する
  // abstract convBindToPage(): void;
  // // #endregion               ----------------------------------------------------------------------------
}
