import { Component, ViewChild } from '@angular/core';

import * as Matter from 'matter-js';

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

    this[this.sceneName]();
  }

  updateGravity(x, y) {
    if (!this.engine)
        return;
    
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

      World.add(this.world, MouseConstraint.create(this.engine));
      
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

  reset() {
    this.world = this.engine.world;

    Common._seed = 2;
    
    World.clear(this.world);
    Engine.clear(this.engine);
    
    let offset = 5;
    World.addBody(this.world, Bodies.rectangle(this.sceneWidth * 0.5, -offset, this.sceneWidth + 0.5, 50.5, { isStatic: true }));
    World.addBody(this.world, Bodies.rectangle(this.sceneWidth * 0.5, this.sceneHeight + offset, this.sceneWidth + 0.5, 50.5, { isStatic: true }));
    World.addBody(this.world, Bodies.rectangle(this.sceneWidth + offset, this.sceneHeight * 0.5, 50.5, this.sceneHeight + 0.5, { isStatic: true }));
    World.addBody(this.world, Bodies.rectangle(-offset, this.sceneHeight * 0.5, 50.5, this.sceneHeight + 0.5, { isStatic: true }));
  }

}
