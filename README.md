### Satelite Constellation Capability Simulation

***Frontend***
WebGL (Three.js or TWGL)
React 

***Physics***
satellite.js (SGP4)

***Data***
TLE feeds (Space-Track / CelesTrak)

***Backend***
NextJS API or NodeJSAPI

### Libraries 

```
$ yarn add three satellite.js
```

### Tasks
[X] Add ThreeJS Sphere
[X] Add Earth Texture
[X] Rotate Earth matching real world rotation
[X] Add 1 ThreeJS Sat
[X] ThreeJS Sat Flying around Earth
[X] 21 ThreeJS Satelites


[X] this.earth.rotation.y += 0.0005 ; // Earth angular velocity 0.0000727 rad/sec

[X] WHY Angular Velocity ?
```
	this.orbitPeriod = 120
	this.angularVelocity = (2 * Math.PI) / this.orbitPeriod
```

[ ] Read the Code, Understand the Maths and Note on Paper

[ ] Toggle to ICEYE satelite constellation
[ ] Toggle to GaoFen Constellation 

[ ] Simulate Flying Path of GaoFen satelite constellation

[ ] Simulate US carrier moving around earth
[ ] Build your satelite constellation to track US Carrier



