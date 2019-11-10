import { Component, OnInit } from '@angular/core';
import { ChildProcessService } from 'ngx-childprocess';

@Component({
  selector: 'st-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css'],
})
export class MainViewComponent implements OnInit {
  constructor(private _childProcessService: ChildProcessService) {}

  ngOnInit() {}

  shudown(timer = 0 /* milliseconds */) {
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
