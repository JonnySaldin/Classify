import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { User } from '@angular/fire/auth';
import { ToastrService } from 'ngx-toastr';
import { concatMap } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProfileUser } from '../../models/user-profile';

@UntilDestroy()
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  profileForm = new FormGroup({
    uid: new FormControl(''),
    displayName: new FormControl(''),
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    phone: new FormControl(''),
    address: new FormControl(''),
  });

  user$;

  constructor(
    private authService: AuthenticationService,
    private imageUploadService: ImageUploadService,
    private toast: ToastrService,
    private usersService: UsersService
  ) {
    this.user$ = this.usersService.currentUserProfile$;
  }

  ngOnInit(): void {
    this.usersService.currentUserProfile$
      .pipe(untilDestroyed(this))
      .subscribe((user) => {
        this.profileForm.patchValue({ ...user });
      });
  }

  uploadImage(event: any, user: ProfileUser) {
    const file = event.target.files[0];

    if (!file) {
      this.toast.warning('No file selected', 'Warning!', { timeOut: 1500 });
      return;
    }

    this.imageUploadService
      .uploadImage(file, `images/profile/${user.uid}`)
      .pipe(
        concatMap((photoURL) =>
          // Update photoURL in Firebase Authentication
          this.usersService.updateUser({ uid: user.uid, photoURL }).pipe(
            // Also update Firestore user profile
            concatMap(() =>
              this.usersService.updateUser({ uid: user.uid, photoURL })
            )
          )
        )
      )
      .subscribe({
        next: () => {
          this.toast.success(
            'Image uploaded and profile updated!',
            'Success!',
            { timeOut: 1500 }
          );
        },
        error: (err) => {
          console.error(err);
          this.toast.error('Something went wrong during the upload.', 'Error', {
            timeOut: 2000,
          });
        },
      });
  }

  saveProfile() {
    console.log('Save Profile button clicked'); // Debugging log
    if (this.profileForm.valid) {
      console.log('Form is valid, updating profile...'); // Debugging log

      const updatedProfile: ProfileUser = {
        uid: this.profileForm.value.uid ?? '',
        displayName: this.profileForm.value.displayName ?? '',
        firstName: this.profileForm.value.firstName ?? '',
        lastName: this.profileForm.value.lastName ?? '',
        phone: this.profileForm.value.phone ?? '',
        address: this.profileForm.value.address ?? '',
      };

      this.usersService.updateUser(updatedProfile).subscribe({
        next: () => {
          console.log('Profile updated in Firestore:', updatedProfile); // Debugging log
          this.toast.success('Profile updated successfully!', 'Success', {
            timeOut: 1500,
          });

          // Check if displayName has changed, update Firebase Authentication
          if (updatedProfile.displayName) {
            this.authService
              .updateProfileData({ displayName: updatedProfile.displayName })
              .subscribe({
                next: () => {
                  console.log('Display name updated in Firebase Auth'); // Debugging log
                  this.toast.success('Display name updated!', 'Success', {
                    timeOut: 1500,
                  });
                },
                error: (err) => {
                  console.error('Error updating display name:', err);
                  this.toast.error('Failed to update display name.', 'Error', {
                    timeOut: 2000,
                  });
                },
              });
          }
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          this.toast.error('Something went wrong while updating.', 'Error', {
            timeOut: 2000,
          });
        },
      });
    } else {
      console.log('Form is invalid, not updating profile'); // Debugging log
    }
  }
}
