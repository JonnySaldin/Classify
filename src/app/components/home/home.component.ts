import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { DataService } from '../../services/data.service';
import { DynamicHomeData } from '../../models/dynamic-home-data';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  user$: Observable<any>;
  selectedData: DynamicHomeData | null = null;
  selectedButtonLabel: string | null = null;
  todosLength = 0;
  projectsLength = 0;

  constructor(
    private authService: AuthenticationService,
    private dataService: DataService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.dataService.selectedData$.subscribe((data) => {
      console.log('Home Component - Selected Data:', data); // Logging the data to see
      this.selectedData = data;
    });

    this.dataService.todos$.subscribe((todos) => {
      this.todosLength = todos.length;
    });

    this.dataService.projects$.subscribe((projects) => {
      this.projectsLength = projects.length;
    });
  }
}
