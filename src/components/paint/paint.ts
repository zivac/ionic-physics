import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'paint',
  templateUrl: 'paint.html'
})
export class PaintComponent {

  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  draw = false;
  ppts = [];

  @Input() lineWidth = 10;
  @Input() color = '#111111';

  @Output() onDraw = new EventEmitter();

  colors = ['#111111', '#DDDDDD', '#2ECC40', '#0074D9', '#B10DC9', '#FF4136', '#FF851B', '#FFDC00'];

  @ViewChild('canvas') canvas;
  @ViewChild('tmpCanvas') tmpCanvas;
  ctx;

  constructor() {
    
  }

  ngOnInit() {
    let canvas = this.tmpCanvas.nativeElement;
    this.ctx = canvas.getContext('2d');
  }

  setColor(color) {
    this.color = color;
  }

  isActiveColor(color) {
    return this.color == color;
  }

  setSize(size) {
    this.lineWidth = size;
  }

  isActiveSize(size) {
    return this.lineWidth == size;
  }

  startDraw(e) {
    this.draw = true;
  }

  endDraw(e) {
    this.draw = false;
    let ctx =  this.canvas.nativeElement.getContext('2d');
    //ctx.drawImage(this.tmpCanvas.nativeElement, 0, 0);
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.onDraw.emit(this.ppts);
    this.ppts = [];
  }

  clear() {
    let ctx = this.canvas.nativeElement.getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  paint(e) {

    if(!this.draw) return;

    let x = e.touches[0].pageX;
    let y = e.touches[0].pageY;

    this.ppts.push({x: x, y: y})

    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.color;

    if(this.ppts.length < 3) {
      let b = this.ppts[0]
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, this.ctx.lineWidth / 2, 0, Math.PI * 2, !0);
      this.ctx.fill();
      this.ctx.closePath();
      return;
    }

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctx.beginPath();
    this.ctx.moveTo(this.ppts[0].x, this.ppts[0].y)

    for(var i = 1; i < this.ppts.length - 2; i++) {
      let c = (this.ppts[i].x + this.ppts[i + 1].x) / 2;
      let d = (this.ppts[i].y + this.ppts[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(this.ppts[i].x, this.ppts[i].y, c, d)
    }

    this.ctx.quadraticCurveTo(this.ppts[i].x, this.ppts[i].y, this.ppts[i+1].x, this.ppts[i+1].y);
    this.ctx.stroke();

  }

}
