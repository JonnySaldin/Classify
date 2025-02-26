import { Component } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from './services/users.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'classify-app';

  user$;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private toast: ToastrService,
    private usersService: UsersService
  ) {
    this.user$ = this.usersService.currentUserProfile$;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.toast.warning('You are logged out', 'Log out complete', {
          timeOut: 2000,
          positionClass: 'toast-bottom-right',
        });
        this.router.navigate(['']);
      },
      error: (err) => {
        this.toast.error('Log out failed', 'Error', {
          timeOut: 2000,
          positionClass: 'toast-bottom-right',
        });
      },
    });
  }
}
