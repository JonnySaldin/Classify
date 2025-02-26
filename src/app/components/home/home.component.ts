import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  user$;

  constructor(private authService: AuthenticationService) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}
}
