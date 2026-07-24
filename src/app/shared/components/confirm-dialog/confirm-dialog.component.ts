import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

/** Single app-level modal wired to ConfirmDialogService. Mounted once. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  protected readonly dialog = inject(ConfirmDialogService);
}
