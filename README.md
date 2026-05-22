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

[X] Toggle to ICEYE satelite constellation
[X] Toggle to GaoFen Constellation 
[X] Simuluate GaoFen 4 GEO satelite
https://www.youtube.com/watch?v=6kR7ifQT-B4

[X] Simuluate YaoGAN SAR LEO constellation

[X] Reduce Simulation Time to 24 hours of March 1
[X] Show Satelite observation area with real world specs

[ ] Simulate US carrier stationary along the Coast of Oman at coordinate 21.888884087895217, 62.8574839512631
[ ] Simulate Iranian IRGC Targeting US Carrier with Chinese Satellite Clues for March 1

[ ] Read the Code, Understand the Maths and Note on Paper
```
// Animating Satellite Orbit

	this.satellites.forEach((sat) => {
		const angle = baseAngle + sat.phase
		

		let x = this.orbitRadius * Math.cos(angle)
		let y = 0
		let z = this.orbitRadius * Math.sin(angle)

		// Inclination Angles
		const cosI = Math.cos(this.inclination)
		const sinI = Math.sin(this.inclination)

		let yInclined = y * cosI - z * sinI;
		let zInclined = y * sinI + z * cosI;

		// RAAN rotation 
		const cosR = Math.cos(sat.raan)
		const sinR = Math.sin(sat.raan)

		let xFinal = x * cosR - zInclined * sinR
		let zFinal = x * sinR + zInclined * cosR

		// Anti Access Area Denial 
		// console.log("Satellite Coordinate ", xFinal, yInclined, zFinal)

		sat.mesh.position.set(xFinal, yInclined, zFinal)
	})
```


[ ] Build your satelite constellation to track US Carrier



