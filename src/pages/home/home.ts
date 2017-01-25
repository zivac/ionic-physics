import { Component, ViewChild } from '@angular/core';

import decomp from 'poly-decomp';
import * as Matter from 'matter-js';

//window['decomp'] = decomp;

// Matter aliases
const Engine = Matter.Engine,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Composites = Matter.Composites,
      Common = Matter.Common,
      MouseConstraint = Matter.MouseConstraint;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  engine
  world
  gravity
  sceneName = 'mixed'
  sceneWidth = window.innerWidth
  sceneHeight = window.innerHeight
  deviceOrientationEvent

  colors = ['#DDDDDD', '#2ECC40', '#0074D9', '#B10DC9', '#FF4136', '#FF851B', '#FFDC00'];
  color = '#0074D9';
  paint = false;
  gravityOn = true;
  mode = 'normal';

  setColor(color) {
    this.color = color;
  }

  setMode(mode) {
    this.mode = mode;
  }

  toggleGravity() {
      this.gravityOn = !this.gravityOn;
      if(!this.gravityOn) {
          this.engine.world.gravity.x = 0;
          this.engine.world.gravity.y = 0;
      } else {
          if(!this.engine.world.gravity.y) this.engine.world.gravity.y = 1;
      }
  }

  isActiveColor(color) {
    return this.color == color;
  }

  isActiveMode(mode) {
    return this.mode == mode;
  }

  getIcon(mode) {
    if(mode=='normal') return 'brush';
    else if(mode=='static') return 'cloud-outline';
    else if(mode=='constraint') return 'resize';
    else if(mode=='move') return 'hand';
  }

  getGravityIcon() {
      return this.gravityOn ? 'cloud-download' : 'cloud'
  }

  @ViewChild('canvasContainer') canvasContainer;

  ngOnInit() {
    this.engine = Engine.create(this.canvasContainer.nativeElement, {
          render: {
              options: {
                  wireframes: false,
                  showAngleIndicator: false,
                  showDebug: false
              }
          }
      });
      setTimeout(() => {
          var runner = Engine.run(this.engine);

          // pass through runner as timing for debug rendering
          this.engine.metrics.timing = runner;

          this.updateScene();
      }, 800)

      /*window.addEventListener('deviceorientation', (event) => {
          this.deviceOrientationEvent = event;
          this.updateGravity(event);
      }, true);*/

      window.addEventListener('orientationchange', () => {
          //this.updateGravity(this.deviceOrientationEvent);
          this.updateScene();
      }, false);

      window.addEventListener("devicemotion", (event) => {
        let x = event.accelerationIncludingGravity.x / 5;
        let y = -event.accelerationIncludingGravity.y / 5;
        this.updateGravity(x, y)
      }, true);
  }

  updateScene() {
    if (!this.engine)
        return;

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    let boundsMax = this.engine.world.bounds.max,
        renderOptions = this.engine.render.options,
        canvas = this.engine.render.canvas;

    boundsMax.x = this.sceneWidth;
    boundsMax.y = this.sceneHeight;

    canvas.width = renderOptions.width = this.sceneWidth;
    canvas.height = renderOptions.height = this.sceneHeight;

    //this[this.sceneName]();

    this.reset();
  }

  updateGravity(x, y) {
    if (!this.engine) return;
    if (!this.gravityOn) return;
    
    let orientation = window.orientation;
    this.gravity = this.engine.world.gravity;

    if (orientation === 0) {
        this.gravity.x = x;
        this.gravity.y = y;
    } else if(orientation === 180) {
        this.gravity.x = -x;
        this.gravity.y = -y;
    } else if (orientation === 90) {
        this.gravity.x = y;
        this.gravity.y = -x;
    } else if (orientation === -90) {
        this.gravity.x = -y;
        this.gravity.y = x;
    }

    /*if (orientation === 0) {
        this.gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
        this.gravity.y = Common.clamp(event.beta, -90, 90) / 90;
    } else if (orientation === 180) {
        this.gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
        this.gravity.y = Common.clamp(-event.beta, -90, 90) / 90;
    } else if (orientation === 90) {
        this.gravity.x = Common.clamp(event.beta, -90, 90) / 90;
        this.gravity.y = Common.clamp(-event.gamma, -90, 90) / 90;
    } else if (orientation === -90) {
        this.gravity.x = Common.clamp(-event.beta, -90, 90) / 90;
        this.gravity.y = Common.clamp(event.gamma, -90, 90) / 90;
    }*/
  }

  mixed() {
      this.world = this.engine.world;
      
      this.reset();
      
      let stack = Composites.stack(20, 20, 10, 5, 0, 0, (x, y, column, row) => {
          switch (Math.round(Common.random(0, 1))) {
              
          case 0:
              if (Common.random() < 0.8) {
                  return Bodies.rectangle(x, y, Common.random(20, 40), Common.random(20, 40), { friction: 0.01, restitution: 0.4 });
              } else {
                  return Bodies.rectangle(x, y, Common.random(80, 120), Common.random(20, 30), { friction: 0.01, restitution: 0.4 });
              }
          case 1:
              return Bodies.polygon(x, y, Math.round(Common.random(4, 6)), Common.random(20, 40), { friction: 0.01, restitution: 0.4 });
          
          }
      });
      
      World.add(this.world, stack);
  }

  drawShape(points) {
      if(points.length < 2) return;
      if(this.mode == 'normal' || this.mode == 'static') {
          let point = Matter.Vertices.centre(points);
          World.add(this.world, Bodies.fromVertices(point.x, point.y, points, {isStatic: this.mode=='static'}));
      } else if(this.mode == 'static') {
          World.addBody(this.world, Matter.Body.create({
            position: Matter.Vertices.centre(points),
            vertices: points,
            isStatic: true
          }));
      } else if(this.mode == 'constraint') {
          let body1 = Matter.Query.point(this.world.bodies, points[0]);
          let body2 = Matter.Query.point(this.world.bodies, points[points.length-1]);
          if(body1.length && body2.length) {
              World.add(this.world, Matter.Constraint.create({
                  bodyA: body1[0],
                  bodyB: body2[0],
                  pointA: {x: points[0].x - body1[0].position.x, y: points[0].y - body1[0].position.y},
                  pointB: {x: points[points.length-1].x - body2[0].position.x, y: points[points.length-1].y - body2[0].position.y},
                  stiffness: 0.2,
                  //length: Math.sqrt(Math.pow(points[0].x - points[points.length-1].x, 2) + Math.pow(points[0].y - points[points.length-1].y, 2))/2
              }))
          }
      }
  }

  deleteShape(event) {
      let body = Matter.Query.point(this.world.bodies, event.center);
      if(body.length) {
          if(this.mode == 'delete') {
              let constraints = this.world.constraints.filter(constraint => {
                    return constraint.label != 'Mouse Constraint' && (constraint.bodyA == body[0] || constraint.bodyB == body[0]);
                })
                constraints.forEach(constraint => {
                    World.remove(this.world, constraint)
                })
                World.remove(this.world, body[0]);
          } else {
              //body[0].isStatic = !this.gravity;
          }
      }
  }

  togglePaint() {
      this.paint = !this.paint;
  }

  reset() {
    this.world = this.engine.world;

    Common._seed = 2;
    
    World.clear(this.world);
    Engine.clear(this.engine);
    
    let offset = 25;
    World.addBody(this.world, Bodies.rectangle(this.sceneWidth * 0.5, -offset, this.sceneWidth + 0.5, 50.5, { isStatic: true }));
    World.addBody(this.world, Bodies.rectangle(this.sceneWidth * 0.5, this.sceneHeight + offset, this.sceneWidth + 0.5, 50.5, { isStatic: true }));
    World.addBody(this.world, Bodies.rectangle(this.sceneWidth + offset, this.sceneHeight * 0.5, 50.5, this.sceneHeight + 0.5, { isStatic: true }));
    World.addBody(this.world, Bodies.rectangle(-offset, this.sceneHeight * 0.5, 50.5, this.sceneHeight + 0.5, { isStatic: true }));

    World.add(this.world, MouseConstraint.create(this.engine));
  }

}
