import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  collectionData,
} from '@angular/fire/firestore';
import { DynamicHomeData } from '../models/dynamic-home-data';
import { AuthenticationService } from './authentication.service';
import { TodoItem } from '../models/todo-item-model';
import { ProjectItem } from '../models/project-model';
import { ProjectItemItem } from '../models/project-item-model';
import { Observable } from 'rxjs';

interface SidePanelButton {
  type: string;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private selectedDataSubject = new BehaviorSubject<DynamicHomeData | null>(
    null
  );
  selectedData$ = this.selectedDataSubject.asObservable();

  private selectedButtonSubject = new BehaviorSubject<string | null>(null);
  selectedButton$ = this.selectedButtonSubject.asObservable();

  private buttonsSubject = new BehaviorSubject<SidePanelButton[]>([]);
  buttons$ = this.buttonsSubject.asObservable();

  private todosSubject = new BehaviorSubject<TodoItem[]>([]);
  todos$ = this.todosSubject.asObservable();

  private projectsSubject = new BehaviorSubject<ProjectItem[]>([]);
  projects$ = this.projectsSubject.asObservable();

  private projectItemsSubject = new BehaviorSubject<ProjectItemItem[]>([]);
  projectItems$ = this.projectItemsSubject.asObservable();

  private userId: string | null = null;
  private selectedButton: string | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthenticationService
  ) {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.loadButtons(user.uid); // Fetch user-specific buttons
        this.loadSelectedData(user.uid); // Fetch user-specific selected content
      } else {
        this.userId = null;
        this.buttonsSubject.next([]); // Clear buttons when user logs out
        this.selectedDataSubject.next(null); // Clear selected data
        this.todosSubject.next([]);
        this.projectsSubject.next([]);
      }
    });
    this.authService.currentUser$.subscribe((user) => {
      this.userId = user ? user.uid : null;
    });
  }

  // Load buttons specific to the user
  private loadButtons(userId: string) {
    const buttonsCollection = collection(
      this.firestore,
      `users/${userId}/sidePanelButtons`
    );
    onSnapshot(buttonsCollection, (snapshot) => {
      const buttons = snapshot.docs.map((doc) => doc.data() as SidePanelButton);
      this.buttonsSubject.next(buttons);
    });
  }

  // Load selected data specific to the user
  private loadSelectedData(userId: string) {
    console.log('Loading selected data for user:', userId);
    const selectedDataRef = doc(
      this.firestore,
      `users/${userId}/homeData/selectedButton`
    );

    onSnapshot(selectedDataRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Fetched Data:', data); // Logging to check the structure

        // Ensure the data matches the expected structure
        const formattedData: DynamicHomeData = {
          type: data['label'] || 'No button selected',
          message: data['label'] || 'No data available',
        };

        this.selectedDataSubject.next(formattedData);
      } else {
        console.log('No data available for selected data.');
        this.selectedDataSubject.next({
          type: 'No button selected',
          message: 'No data available',
        });
      }
    });
  }

  // When a button is selected, set the selectedButton's value
  async selectButton(label: string) {
    if (!this.userId) return;

    // Store the selected button in Firestore
    const selectedButtonDocRef = doc(
      this.firestore,
      `users/${this.userId}/homeData/selectedButton`
    );

    await setDoc(selectedButtonDocRef, { label });

    // Fetch the corresponding data for this button type
    this.fetchData(label); // Make sure this is actually fetching data
  }

  async addButton(newButton: SidePanelButton) {
    if (!this.userId) return;
    await setDoc(
      doc(
        this.firestore,
        `users/${this.userId}/sidePanelButtons`,
        newButton.type
      ),
      newButton
    );
  }

  async removeButton(type: string) {
    if (!this.userId) return;
    await deleteDoc(
      doc(this.firestore, `users/${this.userId}/sidePanelButtons`, type)
    );
  }

  fetchData(type: string) {
    if (!this.userId) return;

    const docRef = doc(
      this.firestore,
      `users/${this.userId}/homeData/selectedButton`
    );

    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Fetched Data:', data);

        // Access the 'label' property using bracket notation
        this.selectedDataSubject.next({
          type: type,
          message: data?.['label'] || 'No data available',
        });
      } else {
        console.log(
          'No data found for selectedButton, creating default data...'
        );

        // If no data exists, create default data
        const defaultData = { type, message: 'No data available' };
        setDoc(docRef, defaultData); // Optionally save it to Firestore

        // Update the observable with default data
        this.selectedDataSubject.next(defaultData);
      }
    });
  }

  // ------- added for todos component. -----

  loadTodos(buttonType: string) {
    if (!this.userId) return;

    const todosCollection = collection(
      this.firestore,
      `users/${this.userId}/todos/${buttonType}/items`
    );

    onSnapshot(todosCollection, (snapshot) => {
      const todos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TodoItem[];

      console.log('Updated Todos:', todos); // Debugging
      this.todosSubject.next(todos);
    });
  }

  async addTodo(buttonType: string, todo: TodoItem) {
    if (!this.userId) return;

    const todosCollection = collection(
      this.firestore,
      `users/${this.userId}/todos/${buttonType}/items`
    );
    await addDoc(todosCollection, todo);
  }

  async removeTodo(buttonType: string, todoId: string) {
    if (!this.userId) return;

    const todoDoc = doc(
      this.firestore,
      `users/${this.userId}/todos/${buttonType}/items/${todoId}`
    );
    await deleteDoc(todoDoc);
  }

  // ---------- added for projects -------------

  loadProjects(buttonType: string) {
    if (!this.userId) return;

    const projectsCollection = collection(
      this.firestore,
      `users/${this.userId}/projects/${buttonType}/items`
    );

    onSnapshot(projectsCollection, (snapshot) => {
      const projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ProjectItem[];

      console.log('Updated Projects:', projects); // Debugging
      this.projectsSubject.next(projects);
    });
  }

  async addProject(buttonType: string, todo: ProjectItem) {
    if (!this.userId) return;

    const projectsCollection = collection(
      this.firestore,
      `users/${this.userId}/projects/${buttonType}/items`
    );
    await addDoc(projectsCollection, todo);
  }

  async removeProject(buttonType: string, projectid: string) {
    if (!this.userId) return;

    const todoDoc = doc(
      this.firestore,
      `users/${this.userId}/projects/${buttonType}/items/${projectid}`
    );
    await deleteDoc(todoDoc);
  }

  // ---------- added for project items -------------

  loadProjectItems(
    selectedButton: string,
    projectId: string
  ): Observable<ProjectItemItem[]> {
    const itemsRef = collection(
      this.firestore,
      `users/${this.userId}/projects/${selectedButton}/items/${projectId}/subitems`
    );
    return collectionData(itemsRef, { idField: 'id' }) as Observable<
      ProjectItemItem[]
    >;
  }

  async addProjectItem(
    buttonType: string,
    projectId: string,
    subitem: ProjectItemItem
  ) {
    if (!this.userId) return;

    const projectItemsCollection = collection(
      this.firestore,
      `users/${this.userId}/projects/${buttonType}/items/${projectId}/subitems`
    );
    await addDoc(projectItemsCollection, subitem);
  }

  async removeProjectItem(
    buttonType: string,
    projectId: string,
    subitemId: string
  ) {
    if (!this.userId) return;

    const subitemDoc = doc(
      this.firestore,
      `users/${this.userId}/projects/${buttonType}/items/${projectId}/subitems/${subitemId}`
    );
    await deleteDoc(subitemDoc);
  }

  async updateTodo(
    buttonType: string,
    todoId: string,
    updatedFields: Partial<TodoItem>
  ) {
    if (!this.userId) return;

    const todoDoc = doc(
      this.firestore,
      `users/${this.userId}/todos/${buttonType}/items/${todoId}`
    );
    await setDoc(todoDoc, updatedFields, { merge: true });
  }
}
