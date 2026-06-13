"use client";

import { Component, createRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import styles from "../styles/Indochina.module.css"

export default class Indochina extends Component {
	constructor(props){
		super(props)
		this.simRef = createRef()

		this.state = {
			missileSites:  [
				// {lat: 11.670133253474399 , lon: 108.48093101445289}
				// // {lat: 21.105600053707754, lon: 106.5671037381583}
			], 
			missileRange: 300,
			newSiteLat: 0,
			newSiteLon: 0,


			orbitPeriod: 96, 
			inclination: 97.7,
			altitude: 0.089,

			satellites: [],
			orbitLines: [],

			
			newSatPlanes: 10,
			newSatsPerPlane: 1,
			newTargetingRAAN: 80,
			newSpread: 30,

			satSize: 0.006,
			satColor: "yellow"

		}

		this.startEnvironment = this.startEnvironment.bind(this)

		this.setSiteLat = this.setSiteLat.bind(this)
		this.setSiteLon = this.setSiteLon.bind(this)
		this.setMissileRange = this.setMissileRange.bind(this)
		this.addNewSite = this.addNewSite.bind(this)

		this.setSatPlanes = this.setSatPlanes.bind(this)
		this.setSatsPerPlane = this.setSatsPerPlane.bind(this)
		this.setTargetingRAAN = this.setTargetingRAAN.bind(this)
		this.setSpread = this.setSpread.bind(this)

		this.createConstellation = this.createConstellation.bind(this)
	}

	latLonToVector3(lat, lon, radius){

		const phi = (90 - lat) * (Math.PI / 180);
		const theta = (lon + 180) * (Math.PI / 180);

		const x = - ( radius * Math.sin(phi) * Math.cos(theta));
		const y = radius * Math.cos(phi);
		const z = radius * Math.sin(phi) * Math.sin(theta);
		

		return new THREE.Vector3(x,y,z);
	}

	// =====================================================
	// DMS TO DECIMAL
	// =====================================================

	dmsToDecimal(deg, min, sec, dir){

		let dec =
			deg +
			(min / 60) +
			(sec / 3600);

		if (
			dir === "S" ||
			dir === "W"
		){

			dec *= -1;
		}

		return dec;
	}

	async startEnvironment(){
		console.log("Starting Environment")

		this.setState({
			startTime: new Date()
		})

		const mount = this.simRef.current

		// Setup Scene
		this.scene = new THREE.Scene()

		// Setup Camera
		this.camera = new THREE.PerspectiveCamera(
			60, mount.clientWidth/mount.clientHeight, 0.1, 1000
		)

		this.camera.position.set(0, 1.5, 3)

		// Setup RENDERER
		this.renderer = new THREE.WebGLRenderer({
			antialias: true
		})

		this.renderer.setSize( mount.clientWidth, mount.clientHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		mount.appendChild(this.renderer.domElement);

		// Adding CONTROL
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.enableDamping = true

		// Adding SUN
		this.sun = new THREE.DirectionalLight(
			0xffffff,
			8
		);

		this.scene.add(this.sun);

		const ambient = new THREE.AmbientLight( 0xffffff, 0.3);
		this.scene.add(ambient);

		// Adding EARTH
		const loader = new THREE.TextureLoader();
		const earthTexture = loader.load("/textures/8081_earthlights4k.jpg")

		this.earth = new THREE.Mesh(
			new THREE.SphereGeometry(1, 64, 64),
			new THREE.MeshStandardMaterial({ map: earthTexture})
		)

		this.scene.add(this.earth)

		// ORBIT PARAM
		this.earthRadius = 1;
		this.orbitRadius = this.earthRadius + this.state.altitude
		this.orbitPeriod = this.state.orbitPeriod
		this.inclination = this.state.inclination * Math.PI / 180

		this.earthAngularVelocity = (2 * Math.PI) / (24 * 3600)
		this.angularVelocity = (2 * Math.PI) / (this.orbitPeriod * 60)
		
		// PIG still try to LIGHT propaganda ???
		// FUCK OFF PIG

		// PIGs are still Making NOISEs and COMMENT like a bunch of little VPigs

		// MISSILE CITIES
		this.missileCities = []
		this.missileStrikeRings = [];

		let missileSites = this.state.missileSites

		// CREATE MISSILE SITE MARKER
		missileSites.forEach((site) => {
			console.log("Missile Site ", site)
			const triangleShape = new THREE.Shape();
			
			triangleShape.moveTo(
				0,
				0.010/3
			);

			triangleShape.lineTo(
				-0.008/3,
				-0.008/3
			);

			triangleShape.lineTo(
				0.008/3,
				-0.008/3
			);

			triangleShape.lineTo(
				0,
				0.010/3
			);

			const geometry = new THREE.ShapeGeometry(triangleShape);
			const material = new THREE.MeshBasicMaterial({
				color: "yellow",
				side: THREE.DoubleSide
			});

			const marker = new THREE.Mesh(geometry,material);
			this.scene.add(marker);

			this.missileCities.push({
				mesh: marker,
				lat: site.lat,
				lon: site.lon
			});
		})

		// CREATE MISSILE STRIKE PARAM
		missileSites.forEach((site) => {
			this.createMissileStrikeRing({
				lat: site.lat,
				lon: site.lon,
				rangeKm: this.state.missileRange,
				color: "yellow"
			});
		});

		// CREATE SATELLITES
		this.satellites = this.state.satellites
		this.orbitLines = this.state.orbitLines

		this.createConstellation()

		const animate = () => {
			this.animationId = requestAnimationFrame(animate)
			
			let currentTime = new Date()
			const t = (currentTime - this.state.startTime)

			// Earth Rotation
			this.earth.rotation.y = this.earthAngularVelocity * t
			// console.log("Time T", t, this.earth.rotation.y)
			// this.earth.rotation.y = 10

			// Sun fixed along +X
			this.sun.position.set(10,0,0);

			
			// =================================
			// Animate Missile City Marker 
			// =================================
			this.missileCities.forEach((site) => {

				const pos = this.latLonToVector3(site.lat, site.lon, this.earthRadius + 0.004);
				pos.applyAxisAngle(
					new THREE.Vector3(0,1,0),
					this.earth.rotation.y
				);

				// console.log("Putting marker at position ", pos)

				site.mesh.position.copy(pos);
				site.mesh.lookAt(0,0,0);

				// slow pulse

				const pulse = 1 + (Math.sin(t * 0.003) * 0.15);
				site.mesh.scale.set(
					pulse,
					pulse,
					pulse
				);
			});

			// =================================
			// ANIMATE MISSILE STRIKE RINGS
			// =================================
			this.missileStrikeRings.forEach((ringObj) => {

				const ringPos =
					this.latLonToVector3(

						ringObj.lat,
						ringObj.lon,

						this.earthRadius + 0.002
					);

				ringPos.applyAxisAngle(

					new THREE.Vector3(0,1,0),

					this.earth.rotation.y
				);

				ringObj.mesh.position.copy(
					ringPos
				);

				ringObj.mesh.lookAt(
					0,
					0,
					0
				);

				// pulse effect

				const pulse =
					1 +
					(Math.sin(t * 0.002) * 0.03);

				ringObj.mesh.scale.set(

					pulse,
					pulse,
					pulse
				);
			});

			let baseAngle
			if(this.state.orbitPeriod === 1440){
				baseAngle = - this.angularVelocity * t
			} else {
				baseAngle = this.angularVelocity * t
			}

			// =================================
			// ANIMATE SATELLITE ORBIT
			// =================================
			this.satellites.forEach((sat) => {
				const angle = baseAngle + sat.phase
				let x = this.orbitRadius * Math.cos(angle)
				let y = 0
				let z = this.orbitRadius * Math.sin(angle)

				// INCLINATION
				const cosI = Math.cos(this.inclination)
				const sinI = Math.sin(this.inclination)
				let yInclined = y * cosI - z * sinI
				let zInclined = y * sinI - z * cosI

				// RANN
				const cosR = Math.cos(sat.raan)
				const sinR = Math.sin(sat.raan)

				let xFinal = x * cosR - zInclined * sinR
				let zFinal = x * sinR + zInclined * cosR

				// console.log("Sat ", angle, xFinal, yInclined, zFinal)
				sat.mesh.position.set(xFinal, yInclined, zFinal)
				const direction = new THREE.Vector3(xFinal, yInclined, zFinal).normalize()

				// =================================
				// ANIMATE SATELLITE FOOTPRINT
				// =================================

				if (
					this.state.orbitPeriod ===
					1440
				){

					const geoGroundPos =
						direction.multiplyScalar(

							this.earthRadius +
							0.002
						);

					sat.footprint.position.copy(
						geoGroundPos
					);

					sat.footprint.lookAt(
						0,
						0,
						0
					);

					const geoCoverageKm =
						18000;

					const geoScale =
						(geoCoverageKm / 6371) * 6;

					sat.footprint.scale.set(

						geoScale,

						geoScale,

						geoScale
					);

					sat.footprint.material.color.set(
						"yellow"
					);

					sat.footprint.material.opacity =
						0.10;

				} else {

					// =================================
					// LEO FOOTPRINT
					// =================================

					const groundPos =
						direction.multiplyScalar(

							this.earthRadius +
							0.001
						);

					sat.footprint.position.copy(
						groundPos
					);

					sat.footprint.lookAt(
						0,
						0,
						0
					);

					sat.footprint.scale.set(
						1,
						1,
						1
					);

					sat.footprint.material.color.set(
						this.state.satColor
					);

					sat.footprint.material.opacity =
						0.25;

					// =====================================
					// CARRIER DETECTION
					// =====================================

					// this.carriers.forEach((carrier) => {

					// 	// carrier ground position
					// 	const carrierGroundPos =
					// 		this.latLonToVector3(

					// 			carrier.lat,
					// 			carrier.lon,

					// 			this.earthRadius +
					// 			0.001
					// 		);

					// 	carrierGroundPos.applyAxisAngle(

					// 		new THREE.Vector3(0,1,0),

					// 		this.earth.rotation.y
					// 	);

					// 	// distance between sat footprint and carrier
					// 	const dist =
					// 		groundPos.distanceTo(
					// 			carrierGroundPos
					// 		);

					// 	// detection threshold
					// 	// adjust this value
					// 	const detectionRadius = 0.08;

					// 	if (dist < detectionRadius){
					// 		const gmtTime =
					// 			new Date(simTime)
					// 			.toUTCString();

					// 		let message = `
					// 			[DETECTED] 
					// 			${carrier.name} 
					// 			${gmtTime}
					// 			Lat ${carrier.lat}
					// 			Lon ${carrier.lon}
					// 				`;

					// 		// console.log(message);

					// 		this.updateTargetingData(
					// 			message,
					// 			gmtTime, 
					// 			carrier.name,
					// 			carrier.lat, 
					// 			carrier.lon
					// 		);
					// 	}
					// });
				}

			})

			this.controls.update()
			this.renderer.render(
				this.scene,
				this.camera
			)
		}

		animate()
	}

	// CREATE MISSILE CITY and STRIKE RING 

	async createMissileCity(city){
		console.log("Creating Missile City at ", city.lat, city.lon)

		const triangleShape = new THREE.Shape()

		triangleShape.moveTo(0, 0.010/3)
		triangleShape.lineTo(-0.008/3, -0.008/3)
		triangleShape.lineTo(0.008/3, -0.008/3)
		triangleShape.lineTo(0, 0.010/3)

		const geometry = new THREE.ShapeGeometry(triangleShape);
		const material = new THREE.MeshBasicMaterial({
			color: "yellow",
			side: THREE.DoubleSide
		});

		const marker = new THREE.Mesh(geometry,material);
		this.scene.add(marker);

		console.log("Missile Cities ", this.missileCities)

		this.missileCities.push({
			mesh: marker,
			lat: parseFloat(city.lat),
			lon: parseFloat(city.lon)
		});

		this.createMissileStrikeRing({
			lat: parseFloat(city.lat),
			lon: parseFloat(city.lon),
			rangeKm: this.state.missileRange,
			color: "yellow"
		});
	}

	createMissileStrikeRing({
		lat,
		lon,
		rangeKm = 1450,
		color = "yellow"
	}){
		console.log("Create Missile Strike Range ", lat, lon, rangeKm, color)
		const radius = (rangeKm / 6371);
		const ring = new THREE.Mesh(
			new THREE.RingGeometry(radius, radius + 0.003, 128),
			new THREE.MeshBasicMaterial({
				color,
				side:THREE.DoubleSide,
				transparent: true,
				opacity: 0.25
			})
		);

		this.scene.add(ring);
		this.missileStrikeRings.push({ lat, lon, mesh: ring});
	}

	async setSiteLat(e){
		this.setState({
			newSiteLat: e.target.value
		})
	}

	async setSiteLon(e){
		this.setState({
			newSiteLon: e.target.value
		})
	}

	async setMissileRange(e){
		this.setState({
			missileRange: e.target.value
		})
	}

	async addNewSite(){
		let missileSites = this.state.missileSites

		this.setState({
			missileSites: [...missileSites, {
				lat: this.state.newSiteLat, 
				lon: this.state.newSiteLon
			}]
		}, () => {
			// Remove all missile cities
			console.log("Remove Missile Cities")
			if (this.missileCities){
				this.missileCities.forEach(city => {
					this.scene.remove(city.mesh)
					this.scene.remove(city.footprint)
				})
			}

			// Remove all missile cities animation
			console.log("Remove Missile Strike Rings")
			if (this.missileStrikeRings){
				this.missileStrikeRings.forEach( strikeRing => {
					this.scene.remove(strikeRing.mesh)
					this.scene.remove(strikeRing.mesh)
				})
			}

			// Recreate new set of Missile sites
			this.state.missileSites.map(missileCity => {
				this.createMissileCity(missileCity)
			})
		})
	}

	// CREATE SATELLITE CONSTELLATION

	async setSatPlanes(e){
		this.setState({
			newSatPlanes: e.target.value
		})
	}

	async setSatsPerPlane(e){
		this.setState({
			newSatsPerPlane: e.target.value
		})
	}

	async setTargetingRAAN(e){
		this.setState({
			newTargetingRAAN: e.target.value
		})
	}

	async setSpread(e){
		this.setState({
			newSpread: e.target.value
		})
	}

	addSatellite({sats = 1, raan = 0}){
		for (let i = 0; i < sats; i++){
			
			const phase = (2* Math.PI/sats)*i

			// SATELLITE
			const sat = new THREE.Mesh(
				new THREE.SphereGeometry(this.state.satSize, 12, 12),
				new THREE.MeshBasicMaterial({ color: this.state.satColor})
			)
			this.scene.add(sat)

			console.log("Adding Satellite ", i, phase, raan)

			// ADD SATELLITE FOOTPRINT
			const footprint = new THREE.Mesh(
				new THREE.CircleGeometry(0.035, 64),
				new THREE.MeshBasicMaterial({
					color: this.state.satColor,
					transparent: true,
					opacity: 0.25,
					side: THREE.DoubleSide
				})
			)

			this.scene.add(footprint)

			this.satellites.push({
				mesh: sat,
				phase,
				raan,
				footprint
			})
		}	
	}

	createConstellation(){
		if (this.satellites){
			this.satellites.forEach((sat) => {
				this.scene.remove(sat.mesh)
				this.scene.remove(sat.footprint)
			})
		}

		if (this.orbitLines){
			this.orbitLines.forEach((line) => {
				this.scene.remove(line)
			})
		}

		// this.satellites = this.state.satellites
		// this.orbitLines = this.state.orbitLines

		console.log(
			"CREATING NEW CONSTELLATION", 
			this.state.newSatPlanes,
			this.state.newSatsPerPlane,
			this.state.newTargetingRAAN,
			this.state.newSpread
		)

		const numberOfPlanes = this.state.newSatPlanes
		console.log("Number of PLANE ", numberOfPlanes)

		const satsPerPlane = this.state.newSatsPerPlane
		console.log("SATs per PLANE ", satsPerPlane)

		const targetingRAAN = - this.state.newTargetingRAAN * Math.PI / 180
		console.log("RANN ", targetingRAAN)

		const spread = this.state.newSpread * Math.PI / 180
		console.log("SPREAD ", spread)

		for (let p = 0; p < numberOfPlanes; p++){
			console.log("Plane ",p)
			let raan

			if (numberOfPlanes == 1){
				raan = targetingRAAN
			} else {
				const offset = (p/(numberOfPlanes -1)) - 0.5
				raan = targetingRAAN + offset * spread
			}

			this.addSatellite({
				sats: satsPerPlane,
				raan
			})
		}
	}


	componentDidMount(){
		this.startEnvironment()
	}

	componentWillUnmount(){
		cancelAnimationFrame(
			this.animationId
		);

		window.removeEventListener(

			"resize",

			this.handleResize
		);

		if (this.renderer){

			this.renderer.dispose();
		}
	}

	render(){
		return (
			<div className={styles.container}>
				<div className={styles.infoPanel}>
					Indochina
				</div>

				<div
					ref={this.simRef}
					className={styles.satSim}
				/>

				<div className={styles.controlPanel}>
					<div className={styles.addLocation}>
						<input 
							className={styles.siteLat} 
							onChange={this.setSiteLat}
							value={this.state.newSiteLat}
						/>

						<input 
							className={styles.siteLon} 
							onChange={this.setSiteLon}
							value={this.state.newSiteLon}
						/>

						<input 
							className={styles.siteLon} 
							onChange={this.setMissileRange}
							value={this.state.missileRange}
						/>

						<div 
							className={styles.siteAdd}
							onClick={this.addNewSite}
						>
							Add Missile Battery
						</div>
					</div>

					<div className={styles.addSatellite}>
						<input 
							className={styles.satParam} 
							onChange={this.setSatPlanes}
							value={this.state.newSatPlanes}
							type="Float"
							placeholder="Satellites per Plane"
						/>

						<input 
							className={styles.satParam} 
							onChange={this.setSatsPerPlane}
							value={this.state.newSatsPerPlane}
						/>

						<input 
							className={styles.satParam} 
							onChange={this.setTargetingRAAN}
							value={this.state.newTargetingRAAN}
						/>

						<input 
							className={styles.satParam} 
							onChange={this.setSpread}
							value={this.state.newSpread}
						/>

						<div 
							className={styles.siteAdd}
							onClick={this.createConstellation}
						>
							Add Satellite Constellation
						</div>
					</div>
				</div>
			</div>
		)
	}
}