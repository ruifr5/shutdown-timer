import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ChildProcessService } from 'ngx-childprocess';
import { interval } from 'rxjs';

@Component({
  selector: 'st-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css'],
})
export class MainViewComponent implements OnInit, OnDestroy {
  hours = 0;
  minutes = 0;
  seconds = 0;
  disableControls = false;

  private countdownSubscription;
  private timeDifference;
  private dDay: number;
  savedTimer = 0; // for reset purposes

  constructor(private _childProcessService: ChildProcessService) {}

  ngOnInit() {}

  @HostListener('window:keydown', ['$event'])
  keyEvent({ key, ctrlKey, altKey }: KeyboardEvent) {
    if (
      this.runSpecialShortcut(key, ctrlKey || altKey) ||
      this.disableControls
    ) {
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
    if (this.disableControls) {
      if (key.toLowerCase() === 'a') {
        this.abort();
        return true;
      }
      return false;
    }
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
      case 'c':
        this.minutes = this.hours = this.seconds = 0;
        return true;
      case 'escape':
        this.close();
        return true;
      case 'enter':
      case 's':
        this.shutdownFromSelected();
        return true;
      case '+':
        isModified ? this.incHours() : this.incMinutes();
        return true;
      case '-':
        isModified ? this.decHours() : this.decMinutes();
        return true;
      case 'backspace':
        this.shiftRight();
        return true;
    }
    return false;
  }

  leftmostDigit(number: number) {
    return Math.floor(number / 100);
  }

  shiftRight() {
    this.minutes = Math.floor(this.minutes / 10) + (this.hours % 10) * 10;
    this.hours = Math.floor(this.hours / 10);
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

  doCountdown() {
    this.timeDifference = this.dDay - new Date().getTime();
    this.allocateTimeUnits(this.timeDifference);
  }

  private allocateTimeUnits(timeDifference) {
    // (milliSecondsInASecond) % SecondsInAMinute);
    this.seconds = Math.floor((timeDifference / 1000) % 60);
    // (milliSecondsInASecond * minutesInAnHour) % SecondsInAMinute);
    this.minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
    // (milliSecondsInASecond * minutesInAnHour * SecondsInAMinute) % hoursInADay);
    this.hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
  }

  shutdownFromSelected() {
    this.shutdown(this.hours * 60 * 60 + this.minutes * 60);
  }

  shutdown(timerInSeconds: number) {
    if (!timerInSeconds) {
      return;
    }

    this.savedTimer = timerInSeconds * 1000; // save in milliseconds
    this.allocateTimeUnits(this.savedTimer);
    this.disableControls = true;

    this.dDay = new Date().getTime() + timerInSeconds * 1000;
    this.countdownSubscription = interval(500).subscribe(() =>
      this.doCountdown(),
    );

    this.execCmd(['/s', '/t', timerInSeconds]);
  }

  abort() {
    this.execCmd(['/a']);
    this.countdownSubscription.unsubscribe();
    this.allocateTimeUnits(this.savedTimer); // reset timer
    this.savedTimer = 0;
    this.dDay = undefined;
    this.disableControls = false;
  }

  execCmd(cmd: any[]) {
    const finalCmd = ['shutdown'].concat(cmd).join(' ');
    this._childProcessService.childProcess.exec(finalCmd, null, null);
  }

  close() {
    window.close();
  }

  ngOnDestroy() {
    this.countdownSubscription.unsubscribe();
  }
}
