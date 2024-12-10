import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Widgetlayout } from './widgetlayout';

describe('Widgetlayout', () => {
  let component: Widgetlayout;
  let fixture: ComponentFixture<Widgetlayout>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Widgetlayout ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Widgetlayout);
    component = fixture.componentInstance;
    component.servoyApi =  jasmine.createSpyObj('ServoyApi', ['getMarkupId','trustAsHtml','registerComponent','unRegisterComponent']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
