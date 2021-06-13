import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatSpinner } from '@angular/material/progress-spinner';

import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

import { HttpRequestInterceptor } from './http';
import { SimpleDialogComponent } from '../../views/components/simpleDialog/simpleDialog.component';

@Injectable({
  providedIn: 'root'
})
export class PageService {

  public _id;
  public create_user_id;
  public create_user_name;
  public type;
  public data;
  
  public data_org;

  // overlay for spinner
  overlayRef = this.overlay.create({
    hasBackdrop: true,
    positionStrategy: this.overlay
      .position().global().centerHorizontally().centerVertically()
  });

  constructor(
    private http: HttpRequestInterceptor,
    private router: Router,
    private toastr: ToastrService,
    private translate: TranslateService,
    private overlay: Overlay,
    private simpleDialog: SimpleDialogComponent,
  ) { }

  // Check if the data is being edited.
  dirtyCheck(): boolean {
    return (this.data_org !== JSON.stringify(this.data));
  }

  // get page data.
  async getPage(option = null): Promise<void> {
    try {
      // show spinner
      if(option?.hideSpinner != true) { this.overlayRef.attach(new ComponentPortal(MatSpinner)); }

      // Execute search query
      const values = JSON.stringify([this._id]);
      const ret: any = await this.http.get('api/common/db?action=Pages/getPage&values=' + values);
      if (ret.message !== null) {
        throw new Error(ret.message)
      }
      if (ret.rows.length === 0) {
        throw new Error(ret.message)
        // alert('Get page data failed.');
        // this.router.navigate(['/home']);
        // return;
      }

      this._id = ret.rows[0]._id;
      this.create_user_id = ret.rows[0].create_user_id;
      this.create_user_name = ret.rows[0].create_user_name;
      this.type = ret.rows[0].type;
      this.data = ret.rows[0].data;
      this.data_org = JSON.stringify(this.data);
    } catch (e) {
      await this.simpleDialog.notify(
        'error',
        ['page.getException', { message: e.message }],
      );
    } finally {
      // stop spinner
      if(option?.hideSpinner != true) { this.overlayRef.detach(); }
    }
  }

  // save page
  async savePage(option = null): Promise<void> {
    try {
      // show spinner
      if(option?.hideSpinner != true) { this.overlayRef.attach(new ComponentPortal(MatSpinner)); }

      const ret: any = await this.http.post('api/common/db', { action: 'Pages/updPage', values: [this._id, JSON.stringify(this.data)] });
      if (ret.message !== null) {
        throw new Error(ret.message)
      }

      // Store unedited data
      this.data_org = JSON.stringify(this.data);

      let message = this.translate.instant('page.saved');
      if (option?.successMessage) { message = option?.successMessage; }
      this.toastr.success(message, null, { timeOut: 5000, toastClass: "ngx-toastr" });
    } catch (e) {
      await this.simpleDialog.notify(
        'error',
        ['page.saveException', { message: e.message }],
      );
    } finally {
      // stop spinner
      if(option?.hideSpinner != true) { this.overlayRef.detach(); }
    }
  }
}