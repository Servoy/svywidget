import { Widgetlayout } from './widgetlayout/widgetlayout';
import { NgModule } from '@angular/core';
import { ServoyPublicModule } from '@servoy/public';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridstackModule } from 'gridstack/dist/angular';
 
@NgModule({
    declarations: [
		Widgetlayout,
    ],
    providers: [],
    imports: [
      ServoyPublicModule,
      CommonModule,
      FormsModule,
      GridstackModule
    ],
    exports: [
		Widgetlayout, 
      ]
})
export class svywidgetModule {}