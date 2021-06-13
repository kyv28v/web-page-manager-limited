import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslateModule } from '@ngx-translate/core';

import { ToastrModule } from 'ngx-toastr';
import { TreeModule } from '@circlon/angular-tree-component';
import { AngularResizedEventModule } from 'angular-resize-event';

import { FlatpickrModule } from 'angularx-flatpickr';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { AgGridModule } from 'ag-grid-angular';
import { QuillModule } from 'ngx-quill'

import { SidebarComponent } from './sidebar/sidebar.component';
import { TopnavComponent } from './topnav/topnav.component';
import { LayoutRoutingModule } from './layout-routing.module';
import { LayoutComponent } from './layout.component';
import { EnumChangePipe } from '../../common/defines/enums';
import { PagesIconPipe } from '../../common/defines/pageDefines';

import { PageHeaderComponent } from './pageHeader/pageHeader.component';

import { HomeComponent } from '../pages/home/home.component';
import { TextComponent } from '../pages/text/text.component';
import { TableComponent } from '../pages/table/table.component';
import { FilerComponent } from '../pages/filer/filer.component';

@NgModule({
    imports: [
        CommonModule,
        LayoutRoutingModule,
        MatToolbarModule,
        MatButtonModule,
        MatSidenavModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatListModule,
        MatDialogModule,
        MatSortModule,
        MatProgressSpinnerModule,
        TreeModule,
        TranslateModule,
        FormsModule,
        ToastrModule.forRoot(),
        AngularResizedEventModule,
        FlatpickrModule.forRoot(),
        CalendarModule.forRoot({
          provide: DateAdapter,
          useFactory: adapterFactory,
        }),
        AgGridModule.withComponents([]),
        QuillModule.forRoot(),
    ],
    declarations: [
        LayoutComponent,
        TopnavComponent,
        SidebarComponent,
        PageHeaderComponent,
        EnumChangePipe,
        PagesIconPipe,
        HomeComponent,
        TextComponent,
        TableComponent,
        FilerComponent,
    ]
})
export class LayoutModule { }
