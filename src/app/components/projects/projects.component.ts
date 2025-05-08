import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Observable } from 'rxjs';
import { ProjectItem } from '../../models/project-model';
import { ProjectItemItem } from '../../models/project-item-model';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent implements OnInit {
  @Input() selectedButton: string | null = null;
  projects$: Observable<ProjectItem[]>;
  projectItemsByProject: {
    [projectId: string]: Observable<ProjectItemItem[]>;
  } = {};

  isProjectInputExpanded = false;
  newProjectText: string = '';

  isProjectItemInputExpanded = false;
  newProjectItemText: string = '';

  constructor(private dataService: DataService) {
    this.projects$ = this.dataService.projects$;
    // this.projectItems$ = this.dataService.projectItems$;
  }

  ngOnInit(): void {
    if (this.selectedButton) {
      this.dataService.loadProjects(this.selectedButton);
    }
    if (this.selectedButton) {
      this.dataService.loadProjects(this.selectedButton);
      this.projects$.subscribe((projects) => {
        for (let project of projects) {
          this.projectItemsByProject[project.id!] =
            this.dataService.loadProjectItems(
              this.selectedButton!,
              project.id!
            );
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedButton'] && this.selectedButton) {
      this.dataService.loadProjects(this.selectedButton);
    }
    if (this.selectedButton) {
      this.dataService.loadProjects(this.selectedButton);
      this.projects$.subscribe((projects) => {
        for (let project of projects) {
          this.projectItemsByProject[project.id!] =
            this.dataService.loadProjectItems(
              this.selectedButton!,
              project.id!
            );
        }
      });
    }
  }

  addProject(newProjectText: string) {
    if (newProjectText.trim() && this.selectedButton) {
      this.dataService.addProject(this.selectedButton, {
        text: newProjectText,
      });
      this.newProjectText = '';
    }
  }

  removeProject(id: string) {
    if (this.selectedButton) {
      this.dataService.removeProject(this.selectedButton, id);
    }
  }

  addProjectItem(projectId: string, newProjectItemText: string) {
    if (newProjectItemText.trim() && this.selectedButton) {
      console.log('Adding project item:', newProjectItemText);
      this.dataService.addProjectItem(this.selectedButton, projectId, {
        text: newProjectItemText,
      });
      this.newProjectItemText = '';
    }
  }

  removeProjectItem(projectId: string, id: string) {
    if (this.selectedButton) {
      this.dataService.removeProjectItem(this.selectedButton, projectId, id);
    }
  }

  toggleInputExpand() {
    this.isProjectInputExpanded = !this.isProjectInputExpanded;
  }

  toggleProjectItemInputExpand() {
    this.isProjectItemInputExpanded = !this.isProjectItemInputExpanded;
  }
}
