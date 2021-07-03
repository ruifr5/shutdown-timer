import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ChildProcessService } from 'ngx-childprocess';
import { Subscription, timer, BehaviorSubject } from 'rxjs';
import { debounceTime, scan, take, tap } from 'rxjs/operators';

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

  private correctTimerValues$: BehaviorSubject<any>;
  private correctTimerValuesSubscription: Subscription;
  private countdownSubscription: Subscription;
  private savedTimer = 0;
  private readonly MAX_MINUTES = 59;
  private readonly MAX_HOURS = 99;

  constructor(private _childProcessService: ChildProcessService) {}

  ngOnInit() {
    this.correctTimerValueInit();
  }

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

      if (this.minutes > 99 || this.hours > 0) {
        const digitToTransferToHours = this.leftmostDigit(this.minutes);
        this.minutes -= digitToTransferToHours * 100;
        this.hours = this.hours * 10 + digitToTransferToHours;
      }

      if (this.hours > 99) {
        const digitToRemoveFromHours = this.leftmostDigit(this.hours);
        this.hours -= digitToRemoveFromHours * 100;
      }
    }
    this.correctTimerValues();
  }

  // returns true if shortcut existed, false if nothing happens
  runSpecialShortcut(key: string, isModified: boolean): boolean {
    if (key.toLowerCase() === 'a') {
      this.abort();
      return true;
    }
    if (this.disableControls) {
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

  correctTimerValueInit() {
    this.correctTimerValues$ = new BehaviorSubject(null);
    this.correctTimerValuesSubscription = this.correctTimerValues$
      .pipe(
        debounceTime(800),
        tap(() => this.correctTimerValuesNow()),
      )
      .subscribe();
  }

  correctTimerValues() {
    this.correctTimerValues$.next(null);
  }

  correctTimerValuesNow() {
    // if (this.hours > this.MAX_HOURS) {
    //   this.hours = this.MAX_HOURS;
    //   this.minutes = 0;
    // } else
    if (this.minutes > this.MAX_MINUTES) {
      this.minutes = this.MAX_MINUTES;
    }
  }

  leftmostDigit(number: number) {
    return Math.floor(number / 100);
  }

  shiftRight() {
    this.minutes = Math.floor(this.minutes / 10) + (this.hours % 10) * 10;
    this.hours = Math.floor(this.hours / 10);
  }

  incHours() {
    this.hours = this.hours >= this.MAX_HOURS ? 0 : this.hours + 1;
  }

  decHours() {
    this.hours = this.hours <= 0 ? this.MAX_HOURS : this.hours - 1;
  }

  incMinutes() {
    this.minutes = this.minutes >= this.MAX_MINUTES ? 0 : this.minutes + 1;
  }

  decMinutes() {
    this.minutes = this.minutes <= 0 ? this.MAX_MINUTES : this.minutes - 1;
  }

  startCountdown(timerInSeconds) {
    this.countdownSubscription = timer(0, 1000)
      .pipe(
        scan((secondsLeft) => --secondsLeft, timerInSeconds + 1),
        take(timerInSeconds + 1),
      )
      .subscribe((secondsLeft) => this.allocateTimeUnits(secondsLeft));
  }

  private allocateTimeUnits(timeDifference) {
    this.seconds = Math.floor(timeDifference % 60);
    this.minutes = Math.floor((timeDifference / 60) % 60);
    this.hours = Math.floor(timeDifference / (60 * 60) /*% 24*/);
  }

  shutdownFromSelected() {
    this.correctTimerValuesNow();
    this.shutdown(this.hours * 60 * 60 + this.minutes * 60);
  }

  shutdown(timerInSeconds: number) {
    if (!timerInSeconds) {
      return;
    }
    this.savedTimer = timerInSeconds;
    this.disableControls = true;

    this.startCountdown(timerInSeconds);
    this.execCmd(['/s', '/t', timerInSeconds]);
  }

  abort() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    this.execCmd(['/a']);
    this.allocateTimeUnits(this.savedTimer); // reset to original timer
    this.savedTimer = 0;
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
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    if (this.correctTimerValuesSubscription) {
      this.correctTimerValuesSubscription.unsubscribe();
    }
  }
}
