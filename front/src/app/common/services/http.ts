import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { SimpleDialogComponent } from '../../views/components/simpleDialog/simpleDialog.component';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  constructor(
    private http: HttpClient,
    private router: Router,
    private simpleDialog: SimpleDialogComponent,
  ) { }

  async get(url: string, headers?: any, callback: any = null) {
    const request = new HttpRequest('GET', url, headers);
    return await this.callAPI(request, callback);
  }

  async post(url: string, body: any, headers?: any, callback: any = null) {
    const request = new HttpRequest('POST', url, body, headers);
    return await this.callAPI(request, callback);
  }

  async put(url: string, body: any) {
    const request = new HttpRequest('PUT', url, body);
    return await this.callAPI(request);
  }

  async delete(url: string) {
    const request = new HttpRequest('DELETE', url);
    return await this.callAPI(request);
  }

  // Call API
  async callAPI(request: any, callback: any = null) {
    try {
      // Set access token in header
      // * Set null in the header will occur error, so if it is null, set ''
      const accessToken = localStorage.getItem('accessToken') || '';
      const req = request.clone({ headers: request.headers.set('access-token', accessToken) });

      // send request
      if (callback) {
        // request async. and notice callback.
        return await new Promise((resolve, reject) => {
          try{
            this.http.request(req).subscribe(
              res => {
                if (res.type === HttpEventType.Response) {
                  resolve(res.body);
                } else {
                  callback(res);
                }
              }, error => {
                reject(error);
              }
            );
          } catch (e) {
            reject(e);
          }
        });
      } else {
        // request sync
        const ret: any = await this.http.request(req).toPromise();
        return ret.body;
      }
    } catch (e) {
      // Network errors
      if (e instanceof HttpErrorResponse) {
        // If permission error, try to update token with refresh token
        if (e.status === 401) {
          const retRefresh = await this.refreshToken();
          if (retRefresh) {
            // If the token refresh is successful, call the API again
            return await this.callAPI(request);
          }
        }
      }
      // If other errors, throw as it is
      throw new Error(e.error.message)
    }
  }

  // refresh token
  async refreshToken() {
    try {
      // Set refresh token in header
      // * Set null in the header will occur error, so if it is null, set ''
      const refreshToken = localStorage.getItem('refreshToken') || '';
      let refreshHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
      refreshHeaders = refreshHeaders.set('refresh-token', refreshToken);

      // Request execution. If successful, the response data is returned as is.
      const refresh: any = await this.http.post('api/common/auth/refreshtoken', null, { headers: refreshHeaders }).toPromise();
      localStorage.setItem('accessToken', refresh.accessToken);
      localStorage.setItem('refreshToken', refresh.refreshToken2);

      console.log('token refreshed.')
      
      return true;
    } catch (e) {
      // Network errors
      if (e instanceof HttpErrorResponse) {
        if (e.status === 401) {
          // If permission error, display an error and return to the login screen
          await this.simpleDialog.notify(
            'error',
            'login.sessionExpired',
          );
    
          this.router.navigate(['/login']);
          return false;
        }
      }
      // If other errors, show alert message
      alert(e);
      return false;
    }
  }

  // intercept内でトークンなどの処理をするつもりだったが、煩雑になってしまったので、呼び出し処理をラップして実装するよう変更した。
  // とりあえずここは何もせずに素通り。
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request);
  //   let req: HttpRequest<any>;

  //   if (request.url.match(/^api\/common\/auth\/refreshtoken/)) {   // 'api/common/auth/refresh_token'
  //     // リフレッシュトークンをヘッダーに埋め込む
  //     // ※ ヘッダーに null をセットするとエラーになるので、nullの場合は''をセットする
  //     const token = localStorage.getItem('refreshToken') || '';
  //     req = request.clone({
  //       setHeaders: {
  //         'Content-Type': 'application/json',
  //         'refresh-token': token,
  //       },
  //     });
  //   } else if (request.url.match(/^api\//)) {         // 'api/'から始まるリクエスト
  //     // アクセストークンをヘッダーに埋め込む
  //     // ※ ヘッダーに null をセットするとエラーになるので、nullの場合は''をセットする
  //     const token = localStorage.getItem('accessToken') || '';
  //     req = request.clone({
  //       setHeaders: {
  //         'Content-Type': 'application/json',
  //         'access-token': token,
  //       },
  //     });
  //   } else {
  //     req = request;
  //   }

  //   // リクエストの実行
  //   return next.handle(req).pipe(
  //     // エラー処理
  //     catchError(res => {
  //       alert(res.status + 'error.');
  //       switch (res.status) {
  //         case 401:
  //           // 401エラーの場合、トークンを更新する？
  //           this.router.navigate(['/login']);
  //           return throwError(res);
  //           break;
  //         case 400:
  //         case 403:
  //         case 404:
  //         case 500:
  //           return throwError(res);
  //           break;
  //         default:
  //           break;
  //       }
  //     }
  //   ));
  }
}
