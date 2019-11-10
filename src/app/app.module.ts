import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxChildProcessModule } from 'ngx-childprocess';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { MainViewComponent } from './main-view/main-view.component';

@NgModule({
  declarations: [AppComponent, MainViewComponent],
  imports: [BrowserModule, NgxChildProcessModule, NgbModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
