import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** Reusable full-page status screen (403 / 404). Content comes from route data. */
@Component({
  selector: 'app-status-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './status-page.component.html',
  styleUrl: './status-page.component.css',
})
export class StatusPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly data = this.route.snapshot.data as Record<string, string>;
}
