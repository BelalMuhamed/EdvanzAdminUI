import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

/** Full-screen overlay spinner shown while any HTTP request is in flight. */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css',
})
export class LoadingSpinnerComponent {
  protected readonly loading = inject(LoadingService);
}
