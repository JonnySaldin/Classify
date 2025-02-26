import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { switchMap } from 'rxjs';

export function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return {
        passwordsDontMatch: true,
      };
    }

    return null;
  };
}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent implements OnInit {
  signUpForm = new FormGroup(
    {
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
    },
    { validators: passwordsMatchValidator() }
  );

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private toast: ToastrService,
    private userService: UsersService
  ) {}

  ngOnInit(): void {}

  get name() {
    return this.signUpForm.get('name');
  }

  get email() {
    return this.signUpForm.get('email');
  }

  get password() {
    return this.signUpForm.get('password');
  }

  get confirmPassword() {
    return this.signUpForm.get('confirmPassword');
  }

  submit() {
    if (!this.signUpForm.valid) return;

    const name = this.signUpForm.value.name ?? '';
    const email = this.signUpForm.value.email ?? '';
    const password = this.signUpForm.value.password ?? '';

    this.authService
      .signUp(email, password)
      .pipe(
        switchMap(({ user }) => {
          // Extract uid from the user object and call addUser
          return this.userService.addUser({
            uid: user.uid,
            email,
            displayName: name,
          });
        })
      )
      .subscribe({
        next: () => {
          this.toast.success('You are all signed up', 'Success!', {
            timeOut: 2000,
            positionClass: 'toast-bottom-right',
          });
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.toast.error('Sign Up failed', 'Error', {
            timeOut: 2000,
            positionClass: 'toast-bottom-right',
          });
        },
      });
  }
}
