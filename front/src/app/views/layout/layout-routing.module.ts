import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { HomeComponent } from '../pages/home/home.component';
import { TextComponent } from '../pages/text/text.component';
import { TableComponent } from '../pages/table/table.component';
import { FilerComponent } from '../pages/filer/filer.component';

import { BeforeUnloadGuard } from '../../common/guard/beforeUnload.guard';

const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: '',
                component: HomeComponent
            },
            {
                path: 'home',
                component: HomeComponent
            },
            {
                path: 'text/:id',
                component: TextComponent,
                canDeactivate: [BeforeUnloadGuard]
            },
            {
                path: 'table/:id',
                component: TableComponent,
                canDeactivate: [BeforeUnloadGuard]
            },
            {
                path: 'filer/:id',
                component: FilerComponent,
                canDeactivate: [BeforeUnloadGuard]
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LayoutRoutingModule {}
