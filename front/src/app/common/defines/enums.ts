import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

// Define
export namespace Enums {
  // Converts an array of only selected values ​​to an array of true / false.
  // * Generate checkbox value from DB setting value.
  // Example:[1,2,5] -> [true, true, false, false, true]
  export function getSelectedList(enumList: any, valueList: any) {
    let selectedList: boolean[] = [];
    if (!valueList) return selectedList;
    enumList.forEach((e) => {
      selectedList.push(valueList.indexOf(e.id) !== -1);
    });
    return selectedList;
  }

  // Converts ​​an array of true / false ​​to an array of only selected values.
  // * Generate DB setting value from checkbox value.
  // Example:[true, true, false, false, true] -> [1,2,5]
  export function getSelectedValue(enumList: any, valueList: any) {
    let selectedValue: any[] = [];
    valueList.forEach((v, index) => {
      if (v) {
        selectedValue.push(enumList[index].id);
      }
    });
    return selectedValue;
  }

  // Sex
  export const Sex = [
    { id: 1, name: 'enums.sex.man' },
    { id: 2, name: 'enums.sex.woman' },
  ];
  // Scope Type
  export const ScopeType = [
    // { id: 'Shared', name: 'enums.scopeType.shared' },
    { id: 'Public', name: 'enums.scopeType.public' },
    { id: 'Private', name: 'enums.scopeType.private' },
  ];
  // Week
  export const Week = [
    { id: 0, name: 'enums.week.sunday' },
    { id: 1, name: 'enums.week.monday' },
    { id: 2, name: 'enums.week.tuesday' },
    { id: 3, name: 'enums.week.wednesday' },
    { id: 4, name: 'enums.week.thursday' },
    { id: 5, name: 'enums.week.friday' },
    { id: 6, name: 'enums.week.saturday' },
  ];
  // Authority
  export const Auth = [
    // Menu
    { id: 10, name: 'enums.auth.menu.view' },
    { id: 11, name: 'enums.auth.menu.add' },
    { id: 12, name: 'enums.auth.menu.edit' },
    { id: 13, name: 'enums.auth.menu.delete' },
    { id: 14, name: 'enums.auth.menu.append' },
    // Page
    { id: 20, name: 'enums.auth.page.view' },
    { id: 21, name: 'enums.auth.page.add' },
    { id: 22, name: 'enums.auth.page.edit' },
    { id: 23, name: 'enums.auth.page.delete' },
    // User
    { id: 30, name: 'enums.auth.user.view' },
    { id: 31, name: 'enums.auth.user.add' },
    { id: 32, name: 'enums.auth.user.edit' },
    { id: 33, name: 'enums.auth.user.delete' },
  ];
}

// Pipe
@Pipe({ name: 'enumChange' })
export class EnumChangePipe implements PipeTransform {
  constructor(
    public translate: TranslateService,
  ) { }

  transform(id: any, enums: any): string {
    let dispStr: string;
    for (let i = 0; i < enums.length; i++) {
      if (enums[i].id === id) {
        // Multi lingual
        this.translate.get(enums[i].name).subscribe((res: string) => {
          dispStr = enums[i].id + ':' + res;
        });
        return dispStr;
      }
    }
    return null;
  }
}
