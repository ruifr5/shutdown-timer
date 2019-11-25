import { Component, OnInit } from '@angular/core';
import { ChildProcessService } from 'ngx-childprocess';

@Component({
  selector: 'st-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css'],
})
export class MainViewComponent implements OnInit {
  hours = 0;
  minutes = 0;

  constructor(private _childProcessService: ChildProcessService) {}

  ngOnInit() {}

  incHours() {
    this.hours = this.hours === 23 ? 0 : this.hours + 1;
  }

  decHours() {
    this.hours = this.hours === 0 ? 23 : this.hours - 1;
  }

  incMinutes() {
    this.minutes = this.minutes === 59 ? 0 : this.minutes + 1;
  }

  decMinutes() {
    this.minutes = this.minutes === 0 ? 59 : this.minutes - 1;
  }

  getTimerDate() {
    const date = new Date();
    date.setHours(
      date.getHours() + this.hours,
      date.getMinutes() + this.minutes,
    );
    return date;
  }

  shutdownFromSelected() {
    this.shutdown(this.hours * 60 * 60 + this.minutes * 60);
  }

  shutdown(timer: number /* seconds */) {
    if (!timer) {
      return;
    }
    this.execCmd(['/s', '/t', timer]);
  }

  abort() {
    this.execCmd(['/a']);
  }

  execCmd(cmd: any[]) {
    const finalCmd = ['shutdown'].concat(cmd).join(' ');
    this._childProcessService.childProcess.exec(finalCmd, null, null);
  }

  close() {
    window.close();
  }
}
