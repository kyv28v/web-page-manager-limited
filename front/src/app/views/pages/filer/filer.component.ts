import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatSpinner } from '@angular/material/progress-spinner';
import { HttpEventType } from '@angular/common/http';
import { Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

import { HttpRequestInterceptor } from '../../../common/services/http';
import { UserService } from '../../../common/services/user.service';
import { MenuService } from '../../../common/services/menu.service';
import { PageService } from '../../../common/services/page.service';
import { PageBaseComponent } from '../pageBase.component';
import { SimpleDialogComponent, InputType } from '../../components/simpleDialog/simpleDialog.component';
import { ProgressSpinnerService } from '../../components/progressSpinner/progressSpinner.service';

export interface IFile {
  name: string;
  lastModifiedDate: Date;
  uploadedDate: Date;
  size: number;
  type: string;
  id: number;
}

@Component({
  selector: 'app-filer',
  templateUrl: './filer.component.html',
  styleUrls: ['./filer.component.scss'],
  providers: [ HttpRequestInterceptor ],
})
export class FilerComponent extends PageBaseComponent {

  // overlay for spinner
  overlayRef = this.overlay.create({
    hasBackdrop: true,
    positionStrategy: this.overlay
      .position().global().centerHorizontally().centerVertically()
  });

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
    public translate: TranslateService,
    private overlay: Overlay,
    private spinner: ProgressSpinnerService,
  ) {
    // call pageBase constructor
    super(activatedRoute, cdRef, menu, page, simpleDialog);
  }
  
  async onDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    await this.upload(files)
  }

  onDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  async onSelectFiles(event) {
    const files = event.target.files;
    await this.upload(files);
  }

  sortData(sort: Sort) {
    const data = this.page.data.files.slice();
    if (!sort.active || sort.direction === '') {
      this.page.data.files = data;
      return;
    }

    const sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'lastModifiedDate': return compare(a.lastModifiedDate, b.lastModifiedDate, isAsc);
        case 'uploadedDate': return compare(a.uploadedDate, b.uploadedDate, isAsc);
        case 'size': return compare(a.size, b.size, isAsc);
        case 'type': return compare(a.type, b.type, isAsc);
        case '_id': return compare(a._id, b._id, isAsc);
        default: return 0;
      }
    });
  
    this.page.data.files = sortedData;
  }

  // upload
  async upload(files) {
    try {
      // show spinner
      this.spinner.show();

      // upload files
      await this.uploadFiles(files)

    } catch (e) {
      alert('upload failed.\n' + e.message);
    } finally {
      // stop spinner
      this.spinner.close();
    }
  }

  async uploadFiles(files) {
    console.log("file upload start. files.length=" + files.length)

    // create FormData
    let fileData = new FormData();
    for (let i = 0; i < files.length; i++) {
      fileData.append('upfile' + i, files[i], files[i].name);
    }

    // send file data to api
    const ret: any = await this.http.post('api/common/db/upload', fileData,
      { reportProgress: true },
      (res) => {
        // disp upload progress.
        if (res.type === HttpEventType.UploadProgress) {
          if (res.loaded === res.total) {
            // console.log('ファイル保存中...');
            this.spinner.setMessage(this.translate.instant('filer.fileSaving'));
          } else {
            const percentDone = Math.round(100 * res.loaded / res.total);
            // console.log('ファイルアップロード中 ' + percentDone + '%');
            this.spinner.setMessage(this.translate.instant('filer.fileUploading', { percentDone }));
          }
        }
      },
    );
    if (ret.message !== null) {
        alert('Add byte data failed\n' + ret.message);
        return false;
    }
    
    // update page data
    for (let i = 0; i < ret.rows.length; i++) {
      this.page.data.files.push({
        name: files[i].name,
        lastModifiedDate: files[i].lastModifiedDate,
        uploadedDate: new Date(),
        size: files[i].size,
        type: files[i].type,
        _id: ret.rows[i]._id,
      })

      console.log("file upload end. " + files[i].name)
    }

    await this.page.savePage({
      hideSpinner: true,
      // successMessage: this.translate.instant('filer.uploadedMessage', { name: file.name }),
    });

    console.log("all file upload end.")
  }

  // download
  async download(file) {
    try {
      console.log("file download start. " + file.name)

      // show spinner
      this.spinner.show();
      this.spinner.setMessage(this.translate.instant('filer.filePreparingToDownload'));

      // download binary string from api
      const values = JSON.stringify([file._id]);
      const ret: any = await this.http.get('api/common/db/download?values=' + values,
        { reportProgress: true },
        (res) => {
          // disp download progress.
          if (res.type === HttpEventType.DownloadProgress) {
            const percentDone = Math.round(100 * res.loaded / res.total);
            // console.log('ファイルダウンロード中 ' + percentDone + '%');
            this.spinner.setMessage(this.translate.instant('filer.fileDownloading', { percentDone }));
          }
        },
      );

      // console.log('ファイル保存中...');
      this.spinner.setMessage(this.translate.instant('filer.fileSaving'));

      // convert binary data to blob
      const buffer = new Uint8Array(ret.byte.data.length);
      for (let i = 0; i < ret.byte.data.length; i++) {
        buffer[i] = ret.byte.data[i];
      }
      const blob = new Blob([buffer], {type: 'application/octet-stream'});

      // create URLObject from binary data
      const url = (window.URL || window.webkitURL).createObjectURL(blob);

      // create href and click
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();

      console.log("file download end. " + file.name)

    } catch (e) {
      alert('download failed.\n' + e.message);
    } finally {
      // stop spinner
      this.spinner.close();
    }
  }

  // delete
  async delete(file) {
    // show confirm dialog
    const result = await this.simpleDialog.confirm(
        'filer.delete',
        ['filer.deleteConfirm', { name: file.name }],
    );
    if (result !== 'ok') { return; }

    try {
      // show spinner
      this.overlayRef.attach(new ComponentPortal(MatSpinner));

      // send delete to api
      const ret: any = await this.http.post('api/common/db', { action: 'Bytes/delByte', values: [file._id] });
      if (ret.message !== null) {
          alert('Delete byte data failed\n' + ret.message);
          return false;
      }
      
      // update page data
      this.page.data.files = this.page.data.files.filter((f) => f !== file);
      this.page.savePage({
        hideSpinner: true,
        successMessage: this.translate.instant('filer.deletedMessage', { name: file.name }),
      });

    } catch (e) {
      alert('delete failed.\n' + e.message);
    } finally {
      // stop spinner
      this.overlayRef.detach();
    }
  }
}

function compare(a: number | string | Date, b: number | string | Date, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
