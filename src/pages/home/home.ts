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
    render
    world
    gravity
    sceneName = 'mixed'
    sceneWidth = window.innerWidth
    sceneHeight = window.innerHeight
    deviceOrientationEvent

    @ViewChild('canvasContainer') canvasContainer;

    ngOnInit() {
        this.engine = Engine.create({
            enableSleeping: true
        })
        this.render = Matter.Render.create({
            element: this.canvasContainer.nativeElement,
            engine: this.engine,
            options: {
                wireframes: false,
                showAngleIndicator: false,
                showDebug: false
            }
        })
        setTimeout(() => {
            Matter.Render.run(this.render);
            let runner = Matter.Runner.create();
            Matter.Runner.run(runner, this.engine);

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
            renderOptions = this.render.options,
            canvas = this.render.canvas;

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
        } else if (orientation === 180) {
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

        let stack = Composites.stack(20, 20, 2, 2, 0, 0, (x, y, column, row) => {
            return Bodies.rectangle(x, y, 50, 50, { friction: 0.01, restitution: 0.4 });
        });

        for (var i = 0; i < stack.bodies.length; i++) {
            Matter.Events.on(stack.bodies[i], 'sleepStart sleepEnd', function(event) {
                var body = this;
                console.log('body id', body.id, 'sleeping:', body.isSleeping);
            });
        }

        let mesh = Composites.mesh(stack, 2, 2, true)

        let body = mesh.bodies[3]

        console.log(mesh.constraints.length, mesh.constraints)

        mesh.constraints.forEach(constraint => {
            if (constraint.bodyA == body || constraint.bodyB == body) constraint.markForRemoval = true;;
        })
        mesh.constraints.filter(constraint => constraint.markForRemoval).forEach(constraint => Matter.Composite.remove(mesh, constraint))
        Matter.Composite.remove(mesh, body);

        World.add(this.world, mesh);
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
    }

}
