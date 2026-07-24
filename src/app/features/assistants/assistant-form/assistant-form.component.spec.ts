import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantFormComponent } from './assistant-form.component';

describe('AssistantFormComponent', () => {
  let component: AssistantFormComponent;
  let fixture: ComponentFixture<AssistantFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssistantFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
