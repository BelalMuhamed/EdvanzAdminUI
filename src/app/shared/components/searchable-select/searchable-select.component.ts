import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SearchableSelectOption {
  value: number | string;
  label: string;
}

/**
 * Reusable searchable/filterable dropdown. Not bound to reactive forms
 * deliberately (Input/Output, same shape as EmptyStateComponent) — list-filter
 * use cases like the Teacher dropdown don't need form-group participation.
 *
 * Emits `selectedValueChange` on pick; `null` represents the "All" option.
 */
@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.css',
})
export class SearchableSelectComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Input() options: SearchableSelectOption[] = [];
  @Input() placeholder = 'Select…';
  @Input() searchPlaceholder = 'Search…';
  @Input() allLabel = 'All';
  @Input() selectedValue: number | string | null = null;
  @Output() selectedValueChange = new EventEmitter<number | string | null>();
@Input() disabled = false;
  protected readonly isOpen = signal(false);
  protected readonly searchTerm = signal('');

  protected readonly filteredOptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.options;
    return this.options.filter((o) => o.label.toLowerCase().includes(term));
  });

  protected get selectedLabel(): string {
    if (this.selectedValue == null) return this.allLabel;
    return this.options.find((o) => o.value === this.selectedValue)?.label ?? this.placeholder;
  }

protected toggleOpen(): void {
    if (this.disabled) return;
    this.isOpen.update((v) => !v);
    if (this.isOpen()) this.searchTerm.set('');
  }
  protected select(value: number | string | null): void {
    this.selectedValue = value;
    this.selectedValueChange.emit(value);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event. target'])
  protected onDocumentClick(target: EventTarget | null): void {
    if (!(target instanceof Node)) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen.set(false);
    }
  }
}
