import { Component, HostListener, OnInit } from '@angular/core';
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

  @HostListener('window:keydown', ['$event'])
  keyEvent({ key, ctrlKey, altKey }: KeyboardEvent) {
    if (this.runSpecialShortcut(key, ctrlKey || altKey)) {
      return;
    }

    const keyNumber = key === ' ' ? 0 : +key;

    if (keyNumber >= 0 && keyNumber <= 9) {
      if (ctrlKey || altKey) {
        this.hours = this.hours * 10 + keyNumber;
      } else {
        this.minutes = this.minutes * 10 + keyNumber;
      }

      if (this.minutes > 100) {
        const numberToTransferToHours = this.leftmostDigit(this.minutes);
        this.minutes -= numberToTransferToHours * 100;
        this.hours = this.hours * 10 + numberToTransferToHours;
      }

      if (this.hours > 100) {
        const numberToRemoveFromHours = this.leftmostDigit(this.hours);
        this.hours -= numberToRemoveFromHours * 100;
      }
    }
    this.correctTimeIndicators();
  }

  // returns true if shortcut existed, false if nothing happens
  runSpecialShortcut(key: string, isModified: boolean): boolean {
    switch (key.toLowerCase()) {
      case 'f1':
        // 2h preset
        this.shutdown(60 * 60 * 2);
        return true;
      case 'f2':
        // 3h preset
        this.shutdown(60 * 60 * 3);
        return true;
      case 'delete':
      case 'backspace':
      case 'c':
        this.minutes = this.hours = 0;
        return true;
      case 'escape':
        this.close();
        return true;
      case 'enter':
      case 's':
        this.shutdownFromSelected();
        return true;
      case 'a':
        this.abort();
        return true;
      case '+':
        isModified ? this.incHours() : this.incMinutes();
        return true;
      case '-':
        isModified ? this.decHours() : this.decMinutes();
        return true;
    }
    return false;
  }

  leftmostDigit(number: number) {
    return Math.floor(number / 100);
  }

  correctTimeIndicators() {
    if (this.hours > 23) {
      this.hours = 23;
    }
    if (this.minutes > 59) {
      this.minutes = 59;
    }
  }

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
