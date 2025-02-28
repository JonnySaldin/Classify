import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AuthenticationService } from '../../services/authentication.service';

interface SidePanelButton {
  type: string;
  label: string;
}

@Component({
  selector: 'app-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.css'],
})
export class SidePanelComponent implements OnInit {
  buttons: SidePanelButton[] = [];
  newButtonLabel: string = '';
  userId: string | null = null;
  showAddClassModal = false;

  constructor(
    private dataService: DataService,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    // Subscribe to the buttons observable to get the buttons list
    this.dataService.buttons$.subscribe((buttons) => {
      this.buttons = buttons;
    });

    // Subscribe to the current user observable to get the userId
    this.authService.currentUser$.subscribe((user) => {
      this.userId = user ? user.uid : null;
    });
  }

  selectData(type: string) {
    if (this.userId) {
      // Store the selected button name in Firestore
      this.dataService.selectButton(type);
      // Optionally, you can also trigger some visual changes, etc.
    }
  }

  addNewButton() {
    if (this.newButtonLabel.trim() && this.userId) {
      const newButton = {
        type: this.newButtonLabel,
        label: this.newButtonLabel,
      };
      // Add the new button to the current user's side panel
      this.dataService.addButton(newButton);
      this.newButtonLabel = ''; // Clear input field
    }
  }

  removeButton(type: string) {
    if (this.userId) {
      // Remove the button based on type
      this.dataService.removeButton(type);
    }
  }

  displayAddClassModal() {
    this.showAddClassModal = true;
  }

  closeAddClassModal() {
    this.showAddClassModal = false;
  }
}
