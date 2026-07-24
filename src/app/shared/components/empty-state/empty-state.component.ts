import { Component, Input } from '@angular/core';

/** Reusable "nothing here" placeholder for empty lists / no search results. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'Nothing to show';
  @Input() message = 'There is no data to display yet.';
}
