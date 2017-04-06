import { Component, ViewChild } from '@angular/core';

import * as Matter from 'matter-js';

// Matter aliases
const Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Common = Matter.Common,
    Events = Matter.Events,
    MouseConstraint = Matter.MouseConstraint;

Composite.removeBodyAndConstraints = (composite, body) => {
    composite.constraints.forEach(constraint => {
        if (constraint.bodyA == body || constraint.bodyB == body) constraint.markForRemoval = true;;
    })
    composite.constraints.filter(constraint => constraint.markForRemoval).forEach(constraint => Composite.remove(composite, constraint))
    Composite.remove(composite, body);
}

const pieces = ['11;11', '1;1;1;1', '011;110', '110;011', '10;10;11', '01;01;11', '111;010'];
const colors = ['#FFDC00', '#7FDBFF', '#FF4136', '#2ECC40', '#FF851B', '#F012BE', '#B10DC9'];

Composites.tetrisPiece = (width, height, x = 20, y = 20) => {

    let choice = Common.choose(pieces);
    let piece = choice.split(';');
    let rows = piece.length;
    let cols = piece[0].length;

    let stack = Composites.stack(x, y, cols, rows, 0, 0, (x, y, column, row) => {
        let body = Bodies.rectangle(x, y, width, height, { friction: 0.01, restitution: 0.4, render: {strokeStyle: '#333', fillStyle: colors[pieces.indexOf(choice)]} });
        if(piece[row][column] != '1') body.markForRemoval = true;
        return body;
    });

    let mesh = Composites.mesh(stack, cols, rows, true)
    mesh.bodies.filter(body => body.markForRemoval).forEach(body => Composite.removeBodyAndConstraints(mesh, body));

    mesh.constraints.forEach(constraint => constraint.render.visible = false);
    mesh.bodies.forEach(body => body.piece = mesh);

    return mesh;

}

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
    stack = []

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

    addTetrisPiece() {
        let piece = Composites.tetrisPiece(this.sceneWidth / 10, this.sceneWidth / 10, this.sceneWidth / 2 - this.sceneWidth / 10);
        World.add(this.world, piece);
        setTimeout(() => {
            this.addTetrisPiece();
        }, 3000)
    }

    mixed() {
        this.world = this.engine.world;

        this.reset();

        World.add(this.world, MouseConstraint.create(this.engine));

        let offset = this.sceneWidth / 20;
        let colliderIndex = 1;
        while(offset < this.sceneHeight) {

            let collider = Bodies.rectangle(this.sceneWidth * 0.5, this.sceneHeight - offset, this.sceneWidth, 5, {
                isSensor: true,
                isStatic: true,
                collider: colliderIndex,
                render: {
                    strokeStyle: 'red',
                    fillStyle: 'transparent',
                    lineWidth: 1
                }
            });

            World.add(this.world, collider);
            this.stack[colliderIndex] = [];
            offset += this.sceneWidth/10;
            colliderIndex++;
        }

        this.addTetrisPiece();

        Events.on(this.engine, 'collisionStart', event => {
            var pairs = event.pairs;
            
            for (var i = 0, j = pairs.length; i != j; ++i) {
                var pair = pairs[i];

                if (pair.bodyA.collider) {
                    if(pair.bodyB.stack) this.stack[pair.bodyB.stack].splice(this.stack[pair.bodyB.stack].indexOf(pair.bodyB), 1)
                    pair.bodyB.stack = pair.bodyA.collider;
                    pair.bodyB.render.fillStyle = colors[pair.bodyB.stack % colors.length];
                    this.stack[pair.bodyB.stack].push(pair.bodyB)
                    if(this.stack[pair.bodyB.stack].length >= 10) this.clearStack(pair.bodyB.stack)
                } else if (pair.bodyB.collider) {
                    if(pair.bodyA.stack) this.stack[pair.bodyA.stack].splice(this.stack[pair.bodyA.stack].indexOf(pair.bodyA), 1)
                    pair.bodyA.stack = pair.bodyB.collider;
                    pair.bodyA.render.fillStyle = colors[pair.bodyA.stack % colors.length];
                    this.stack[pair.bodyA.stack].push(pair.bodyA)
                    if(this.stack[pair.bodyA.stack].length >= 10) this.clearStack(pair.bodyA.stack)
                }
            }
        });

    }

    clearStack(i) {
        this.stack[i].forEach(body => Composite.removeBodyAndConstraints(body.piece, body));
        this.stack[i] = [];
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
