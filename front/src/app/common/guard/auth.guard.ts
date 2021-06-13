import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';

import { UserService } from '../services/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private user: UserService,
    ) {}

    canActivate() {
        if (this.user.canActivate()) {
            return true;
        }

        this.router.navigate(['/login']);
        return false;
    }
}
