import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantEditComponent } from './assistant-edit.component';

describe('AssistantEditComponent', () => {
  let component: AssistantEditComponent;
  let fixture: ComponentFixture<AssistantEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssistantEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
