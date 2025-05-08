import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Observable } from 'rxjs';
import { TodoItem } from '../../models/todo-item-model';

@Component({
  selector: 'app-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
})
export class TodosComponent implements OnInit {
  @Input() selectedButton: string | null = null; // Get the selected button from SidePanel
  todos$: Observable<TodoItem[]>;

  isTodoInputExpanded = false;
  newTodoText: string = '';

  constructor(private dataService: DataService) {
    this.todos$ = this.dataService.todos$;
  }

  ngOnInit(): void {
    if (this.selectedButton) {
      this.dataService.loadTodos(this.selectedButton);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedButton'] && this.selectedButton) {
      this.dataService.loadTodos(this.selectedButton);
    }
  }

  addTodo(newTodoText: string) {
    if (newTodoText.trim() && this.selectedButton) {
      this.dataService.addTodo(this.selectedButton, { text: newTodoText });
      this.newTodoText = '';
    }
  }

  removeTodo(id: string) {
    if (this.selectedButton) {
      this.dataService.removeTodo(this.selectedButton, id);
    }
  }

  toggleInputExpand() {
    this.isTodoInputExpanded = !this.isTodoInputExpanded;
  }
}
