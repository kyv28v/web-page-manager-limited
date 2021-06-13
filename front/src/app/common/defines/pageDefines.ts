import { Pipe, PipeTransform } from '@angular/core';

// Define
export const PageDefines = [
  { type: 'text',         name: 'Text',         icon: 'note',           defaultData: { "text": null } },
  { type: 'table',        name: 'Table',        icon: 'grid_on',        defaultData: { "header": ["title1", "title2", "title3"], "datas": [] } },
  { type: 'filer',        name: 'Filer',        icon: 'folder',         defaultData: { "files": [] } },
];

// Pipe
@Pipe({ name: 'pagesIcon' })
export class PagesIconPipe implements PipeTransform {
  constructor(
  ) { }

  transform(type: any): string {
    return PageDefines.find(page => page.type === type).icon;
  }
}
