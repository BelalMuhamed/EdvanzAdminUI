import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

/** Renders active toasts (bottom-right). Purely reactive to ToastService. */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
