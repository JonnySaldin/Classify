import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from '@angular/fire/firestore';
import { DynamicHomeData } from '../models/dynamic-home-data';
import { AuthenticationService } from './authentication.service';

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

  private userId: string | null = null;

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
      }
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

    console.log(`Selected Button: ${label}`); // Debugging log

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
}
