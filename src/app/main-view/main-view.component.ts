import { Component, OnInit } from '@angular/core';
import { ChildProcessService } from 'ngx-childprocess';

@Component({
  selector: 'st-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css']
})
export class MainViewComponent implements OnInit {
  constructor(private _childProcessService: ChildProcessService) {}

  ngOnInit() {}

  shudown(miliseconds = 0) {
    this.execCmd(['/s', '/t', miliseconds]);
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
