import { Injectable } from '@angular/core';
import { HttpRequestInterceptor } from './http';
import { Router } from '@angular/router';

import * as crypto from 'crypto-js';

import { SimpleDialogComponent, InputType } from '../../views/components/simpleDialog/simpleDialog.component';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public _id = null;
  public code = null;
  public name = null;
  public age = null;
  public sex = null;
  public birthday = null;
  public note = null;
  public menus = [];
  public auth = [];

  constructor(
    private router: Router,
    private http: HttpRequestInterceptor,
    private simpleDialog: SimpleDialogComponent,
    ) { }

  async canActivate() {
    // ユーザ情報を保持していたら認可OK
    if (this._id) return true;

    // ユーザIDを保持していなければ認可NG
    if(!localStorage.getItem('userId')) return false;

    // ログイン情報を保持している場合、サーバにユーザ情報を取得しに行く
    return await this.getUser(localStorage.getItem('userId'));
  }

  // ログイン
  async login(userCode: string, password: string, option: any = null): Promise<void> {
    try {
      // パスワードのハッシュ化
      const hashedPassword = crypto.SHA512(password).toString();

      // トークン生成APIの呼び出し
      const ret: any = await this.http.post('api/common/auth/createtoken', { userCode: userCode, password: hashedPassword });
      if (ret.message) {
          alert(ret.message);
          return;
      }

      console.log('login ok.')

      // ローカルストレージに保存
      localStorage.setItem('userId', ret.userId);
      localStorage.setItem('accessToken', ret.accessToken);
      localStorage.setItem('refreshToken', ret.refreshToken);

      // ユーザ情報取得
      await this.getUser(ret.userId);

      // ホーム画面を表示
      if (option?.dispHome != false) {
        this.router.navigate(['/home']);
      }
    } catch (e) {
      alert(e.message)
    }
  }

  // ユーザ情報取得
  async getUser(userId: string) {
    const values = JSON.stringify([userId]);
    const ret: any = await this.http.get('api/common/db?action=Users/getUser&values=' + values);
    if (ret.message !== null) {
      alert('Get user failed.\n' + ret.message);
      return false;
    }
    if (ret.rowCount < 1) {
      alert('Get user failed.\n' + 'rowCount=' + ret.rowCount);
      return false;
    }
    const user = ret.rows[0];
    this._id = user._id;
    this.code = user.code;
    this.name = user.name;
    this.age = user.age;
    this.sex = user.sex;
    this.birthday = user.birthday;
    this.note = user.note;
    this.menus = user.menus;
    this.auth = user.auth;
    return true;
  }

  // メニュー情報の更新
  async updateUserMenus() {
    const ret: any = await this.http.post('api/common/db', { action: 'Users/updUserMenus', values: [this._id, JSON.stringify(this.menus)] });
    if (ret.message !== null) {
      alert('Update user menus failed.\n' + ret.message);
      return;
    }
  }

  // ログアウト
  async logout(): Promise<void> {
    // 確認ダイアログの表示
    const result = await this.simpleDialog.confirm(
      'login.logout',
      'login.logoutConfirm'
    );
    if (result !== 'ok') { return; }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  authCheck(auth) {
    return (this.auth.indexOf(auth) !== -1);
  }
}