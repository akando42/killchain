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

[X] Simulate US carrier stationary along the Coast of Oman at coordinate 21.888884087895217, 62.8574839512631
[X] Simulate Iranian IRGC Targeting US Carrier with Chinese Satellite Clues for March 1

[X] Toggle Among 3 Carriers On Click to display its Striking and Defensive circle
[X] Toggle Among 5 Missile Options

[X] Simulate Ballistic Missile Range from Different 2 Launch Sites via the Striking circle when select the missile option from right panel
==> Qiam-1 1.935 km/s 800 km No RADAR Homing
==> Kheibar Shekan 3.5 km/s 1450 km No RADAR Homing
==> Fattah 2 4.5 km/s 1500 km No RADAR Homing
==> DF17 2.7 km/s 2100 km RADAR Homing
==> DF21 2.1 km/s 1600 km RADAR Homing

[X] Simulate Satellite Detection Event When Satellite Coverage cover the Carrier coordinate, log the coordinate to messaging panel

[X] Add 3 Critical Airbases 
Prince Sultan Airbase 24.063115307933398, 47.562107925623636
Hatzor Airbase 31.755060806220836, 34.73936932200511
Ben Gurion Airport 32.00373050514364, 34.87273136033934

[X] Update Sun Position matching GMT timestamp with GMT 0 at Mid Night in Greenwich

[X] Add to Detections List for Launching Missile if 
Current Time and Detection time is within 15 mins
Range from Target to Missile City is smaller than Missile Range

[X] Recommend launch Missile after 2 detections of the same target

[X] Convert the KHEIBAR SHEKAN SIMULATION path simulation into dynamic simulation with input launch time, missile speed, missile range, lat, lon

[X] Update Image to Chosen Missiles 

[X] Total Missile Counts updating after Launch

[X] Add Warhead Size for Each Missile 

[X] Update Damage Assessment Percentage Airbase and Carrier Damage After this.fireRecommendedMissile using selected missile warhead specs and targeting Carrier Size

[X] Airbase and Carrier Damage Percentage basing on Interception rate

[ ] Automate Missile Launch at Carriers and Airbases detection coordinate 15 mins after Detection Until Target Fully Neutralized

[ ] Randomize Carrier Position Within 30 mins radius of max speed every 30 mins

[ ] Count Total Missiles Launches of Each Types

[ ] Track On Target Accuracy of Each Types

[ ] Calculate On Target Strike Probability Formula basing on 
Missile Speed, Range, Carrier Distance and Homing Techniques

[ ] Build new satelite constellation to track US Carrier
[ ] Build new missiles to target US Carrier

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

[ ] Seabed Detection Method For Missile Strike Coordination



