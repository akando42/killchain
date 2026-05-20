"use client";

import { Component, createRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import styles from '../styles/Earth.module.css';


export default class Earth extends Component {
	constructor(props){
		super(props);
		this.simRef = createRef();

		this.state = {
			timeT: 0
		}
	}

	// ADD Orbital Planes
	addPlane({sats = 1 , raan = 0}){
		for (let i = 0; i < sats; i++){
			console.log("Adding SAT ", i);
			const phase = (2 * Math.PI / sats) * i;

			const sat = new THREE.Mesh(
				new THREE.SphereGeometry(0.01, 12, 12),
				new THREE.MeshBasicMaterial({ color: 0xffff00 })
			);

			this.scene.add(sat);
			this.satellites.push({
				mesh: sat,
				phase,
				raan
			});

			this.addOrbitLine(raan);
		}
	}

	// =========================
	// ORBIT LINE PER PLANE
	// =========================
	addOrbitLine(raan) {
		const segments = 128;
		const points = [];

		const radius = this.orbitRadius * 1.01;

		for (let s = 0; s <= segments; s++) {
			const angle = (2 * Math.PI * s) / segments;

			let x = radius * Math.cos(angle);
			let z = radius * Math.sin(angle);
			let y = 0;

			// inclination
			const cosI = Math.cos(this.inclination);
			const sinI = Math.sin(this.inclination);

			let yInclined = y * cosI - z * sinI;
			let zInclined = y * sinI + z * cosI;

			// RAAN rotation
			const cosR = Math.cos(raan);
			const sinR = Math.sin(raan);

			let xFinal = x * cosR - zInclined * sinR;
			let zFinal = x * sinR + zInclined * cosR;

			points.push(new THREE.Vector3(xFinal, yInclined, zFinal));
		}

		const geometry = new THREE.BufferGeometry().setFromPoints(points);

		const material = new THREE.LineBasicMaterial({
			color: 0xff4444,
			transparent: true,
			opacity: 0.6
		});

		const line = new THREE.LineLoop(geometry, material);
		this.scene.add(line);
		this.orbitLines.push(line);
	}

	async startEnvironment(){
		const mount = this.simRef.current

		// === SCENE ===

		// Declaring SCENE, CAMERA, RENDERER
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			60, 
			mount.clientWidth / mount.clientHeight,
			0.1,
			1000
		);

		this.renderer = new THREE.WebGLRenderer({antialias: true})

		// Set CAMERA and RENDERER value
		this.camera.position.set(0, 0, 3);
		this.renderer.setSize(mount.clientWidth, mount.clientHeight)
		mount.appendChild(this.renderer.domElement)

		// === LIGHTING ===
		const sun = new THREE.DirectionalLight(0xffffff, 10.5);
		sun.position.set(5, 3, 5);
		this.scene.add(sun);

		const ambient = new THREE.AmbientLight(0xffffff, 0.3);
		this.scene.add(ambient);

		// === CONTROLS ===
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;

		// ADDING EARTH  
		const loader = new THREE.TextureLoader()
		const earthTexture = loader.load(
			"/textures/8081_earthlights4k.jpg",
			() => console.log("✅ texture loaded"),
			undefined,
			(err) => console.error("❌ texture failed", err)
		);

		this.earth = new THREE.Mesh(
			new THREE.SphereGeometry(1, 64, 64),
			new THREE.MeshStandardMaterial({
				map: earthTexture
			})
		)

		this.scene.add(this.earth)
		console.log("ADDING EARTH TO SCENE ", this.scene)

		this.startTime = Date.now()
		
		// ADDING SATELLITEs

		this.earthRadius = 1 // 6371 km 
		this.altitude = 0.1  // 600 km LEO altitude
		this.iceyeAltitude = 550/6371
		this.gaofenAltitude = 645/6371;

		this.orbitRadius = this.earthRadius + this.altitude

		// Angular Velocity ?
		this.orbitPeriod = 120
		this.angularVelocity = (2 * Math.PI) / this.orbitPeriod

		// ICEYE Orbit Revisit Period ?
		// 95 to 97 minutes per orbit or about 15 orbits per day
		this.iceyeOrbitPeriod = 95 * 60 / 10 

		
		// GaoFen Orbit Revisit Period ?
		// 94–100 minutes per orbit or about 14.8 orbits/day

		this.gaofenOrbitPeriod =  97.5 * 60 / 10 ; // seconds

		// Inclination ?
		this.iceyeInclination = 97.5 * Math.PI / 180;
		this.gaofenInclination = 98 * Math.PI / 180;

		this.inclination = 10 * Math.PI / 180;
		// this.inclination = this.iceyeInclination
		// this.inclination = this.gaofenInclination

		// Building Satellite Constellation
		this.satellites = []
		this.orbitLines = []

		// ========================================
		// PERSISTANT MONITORING AREA
		// ========================================

		const numberOfPlanes = 3;
		const satsPerPlane = 24*6;

		const targetingRAAN = -60 * Math.PI / 180
		const spread = 30 * Math.PI / 180 

		for (let p = 0; p < numberOfPlanes; p++){
			const offset = (p/(numberOfPlanes - 1)) - 0.5
			const raan = targetingRAAN + offset * spread

			this.addPlane({
				sats: satsPerPlane,
				raan
			})
		}

		// ANIMATION LOOP
		const animate = () => {
			this.animationId = requestAnimationFrame(animate);
			
			const t =  (Date.now() - this.startTime) /1000
			this.setState({ timeT: t})

			const baseAngle = this.angularVelocity * t

			this.earth.rotation.y += (2 * Math.PI)/(24*3600)*10; // 10X Earth Rotation Speed 

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

			this.controls.update();
			this.renderer.render(this.scene, this.camera);
		}

		animate();

		// === SCREEN RESIZE HANDLE ===
		this.handleResize = () => {
			this.camera.aspect = mount.clientWidth / mount.clientHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(mount.clientWidth, mount.clientHeight);
		};

		window.addEventListener("resize", this.handleResize);
	}

	componentDidMount(){
		this.startEnvironment()
	}

	componentWillUnmount() {
		cancelAnimationFrame(this.animationId);
		window.removeEventListener("resize", this.handleResize);
		if (this.renderer) this.renderer.dispose();
	}


	render(){
		return (
			<div className={styles.container}>
				<div ref={this.simRef} className={styles.satSim} />

				<div className={styles.overlayInfo}>
					<div className={styles.title}>
						<div> Earth Observation Constellation</div>
						<div> {this.state.timeT} </div>
					</div>
				</div>
			</div>
		)
	}
}