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
			timeT: "",
			simProgress: 0,
			isDraggingTimeline: false,

			altitude: 0.1,
			orbitPeriod: 120,
			inclination: 10 * Math.PI / 180,
			satSize: 0.006,
			satColor: "blue",
			numberOfPlanes: 3,
			satsPerPlane: 7
		}
		
		this.startEnvironment = this.startEnvironment.bind(this)
		this.addPlane = this.addPlane.bind(this)
		this.selectSat = this.selectSat.bind(this)

		this.updateTimeline = this.updateTimeline.bind(this)
		this.startTimelineDrag = this.startTimelineDrag.bind(this);
		this.endTimelineDrag = this.endTimelineDrag.bind(this);

	}

	// ADD Orbital Planes
	addPlane({sats = 1 , raan = 0}){
		for (let i = 0; i < sats; i++){
			console.log("Adding SAT ", i);
			const phase = (2 * Math.PI / sats) * i;

			const sat = new THREE.Mesh(
				new THREE.SphereGeometry(0.01, 12, 12),
				new THREE.MeshBasicMaterial({ color: this.state.satColor })
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
			color: "white",
			transparent: true,
			opacity: 0.1
		});

		const line = new THREE.LineLoop(geometry, material);
		this.scene.add(line);
		this.orbitLines.push(line);
	}

	async startEnvironment(){
		const mount = this.simRef.current

		// ORIGINAL SIM TIMESCALE
		// this.simHoursPerSecond = 1/3600 * 60 * 24;

		// ======================================
		// WAR SIMULATION WINDOW
		// ======================================

		this.warStart =
			new Date("2026-03-01T00:00:00Z");

		this.warEnd =
			new Date("2026-04-01T00:00:00Z");

		this.totalWarDuration =
			this.warEnd.getTime() -
			this.warStart.getTime();

		// playback speed
		// 1 real second = 6 simulated hours
		// this.simHoursPerSecond = 1/3600 * 60 * 24;
		this.simHoursPerSecond = 6

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
		this.altitude = this.state.altitude

		this.iceyeAltitude = 550/6371
		this.gaofenAltitude = 645/6371;

		this.orbitRadius = this.earthRadius + this.altitude

		// Angular Velocity ?
		this.orbitPeriod = this.state.orbitPeriod
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

		this.inclination = this.state.inclination
		// this.inclination = this.iceyeInclination
		// this.inclination = this.gaofenInclination

		// Building Satellite Constellation
		this.satellites = []
		this.orbitLines = []

		// ========================================
		// PERSISTANT MONITORING AREA
		// ========================================

		const numberOfPlanes = this.state.numberOfPlanes;
		const satsPerPlane = this.state.satsPerPlane;

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

			// ======================================
			// SIMULATION TIME
			// ======================================

			let simTime;

			if (this.state.isDraggingTimeline) {

				// user-controlled time
				simTime = this.manualSimTime;

			} else {

				// auto simulation

				const elapsedRealSeconds =
					(Date.now() - this.startTime) / 1000;

				const autoProgress =
					(
						elapsedRealSeconds *
						this.simHoursPerSecond *
						60 *
						60 *
						1000
					) / this.totalWarDuration;

				const progress =
					Math.min(autoProgress, 1);

				simTime =
					this.warStart.getTime() +
					(progress * this.totalWarDuration);

				if (
					Math.abs(
						progress - this.state.simProgress
					) > 0.001
				) {

					this.setState({
						simProgress: progress,
						timeT: new Date(simTime).toUTCString()
					});
				}
			}

			const simDate = new Date(simTime);

			// ======================================
			// SATELLITE TIME
			// ======================================

			const t =
				(simTime - this.warStart.getTime()) / 1000;

			const baseAngle =
				this.angularVelocity * t;

			// ======================================
			// EARTH ROTATION
			// ======================================

			const earthRotationRate =
				(2 * Math.PI) / (24 * 3600);

			this.earth.rotation.y =
				earthRotationRate * t;

			// ======================================
			// SATELLITE ANIMATION
			// ======================================

			this.satellites.forEach((sat) => {

				const angle =
					baseAngle + sat.phase;

				let x =
					this.orbitRadius *
					Math.cos(angle);

				let y = 0;

				let z =
					this.orbitRadius *
					Math.sin(angle);

				// inclination
				const cosI =
					Math.cos(this.inclination);

				const sinI =
					Math.sin(this.inclination);

				let yInclined =
					y * cosI - z * sinI;

				let zInclined =
					y * sinI + z * cosI;

				// RAAN
				const cosR =
					Math.cos(sat.raan);

				const sinR =
					Math.sin(sat.raan);

				let xFinal =
					x * cosR -
					zInclined * sinR;

				let zFinal =
					x * sinR +
					zInclined * cosR;

				sat.mesh.position.set(
					xFinal,
					yInclined,
					zFinal
				);
			});

			this.controls.update();

			this.renderer.render(
				this.scene,
				this.camera
			);
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

	updateSatelliteMaterials(){
		this.satellites.forEach((sat) => {
			sat.mesh.material.color.set(this.state.satColor);

			// remove old geometry
			sat.mesh.geometry.dispose();

			// create new geometry
			sat.mesh.geometry = new THREE.SphereGeometry(this.state.satSize, 12, 12);
		});
	}

	updateOrbitLines(){
		// remove old lines
		this.orbitLines.forEach((line) => {
			this.scene.remove(line);
			line.geometry.dispose();
			line.material.dispose();
		});

		this.orbitLines = [];

		// recreate
		const uniqueRAANs = [...new Set(
			this.satellites.map((sat) => sat.raan)
		)];

		uniqueRAANs.forEach((raan) => {

			this.addOrbitLine(raan);

		});
	}

	applyOrbitParameters(){

		// altitude
		this.orbitRadius =
			this.earthRadius + this.state.altitude;

		// inclination
		this.inclination =
			this.state.inclination * Math.PI / 180;

		// orbital period
		this.orbitPeriod =
			this.state.orbitPeriod;

		// angular velocity
		this.angularVelocity =
			(2 * Math.PI) / this.orbitPeriod;

		// update satellite colors
		this.updateSatelliteMaterials();

		// rebuild orbit trails
		this.updateOrbitLines();
	}

	async selectSat(event){

		let constellation = event.target.dataset.satid
		console.log("SELECT SAT", constellation)

		if (constellation === "ICEYE_LEO"){
			this.setState({
				satColor: "blue",

				// ~570 km
				altitude: 0.089,

				// near-polar
				inclination: 97.7,

				// ~96 minutes
				orbitPeriod: 96,


				satSize: 0.006,

				// =====================
				// CONSTELLATION
				// =====================
				numberOfPlanes: 3,
				satsPerPlane: 7

			}, () => {

				this.applyOrbitParameters();
				this.rebuildConstellation();

			});

		} else if (constellation === "GAOFEN_LEO"){
			this.camera.position.set(1, 1, 3);
			this.setState({
			satColor: "red",

				// ~650 km
				altitude: 0.102,

				// sun-synchronous
				inclination: 98.0,

				// ~97 minutes
				orbitPeriod: 97,


				satSize: 0.006,

				numberOfPlanes: 6,
				satsPerPlane: 4

			}, () => {

				this.applyOrbitParameters();

				this.rebuildConstellation();
			});

		} else if (constellation === "GAOFEN4_GEO"){
			this.camera.position.set(2, 3, 10);

			this.setState({
				satColor: "yellow",

				// GEO altitude
				altitude: 5.617,

				// geostationary inclination
				inclination: 0.1,

				// 24h orbit
				orbitPeriod: 8640,

				satSize: 1,

				// GEO usually few satellites
				numberOfPlanes: 1,
				satsPerPlane: 3

				

			}, () => {
				this.applyOrbitParameters();
				this.rebuildConstellation();
			});
		} else if (constellation === "YAOGAN_LEO"){

			this.camera.position.set(0, 1.5, 3);

			this.setState({

				satColor: "lime",

				// =====================
				// YAOGAN LEO
				// =====================

				// ~500–1200 km typical
				// using ~700 km average
				altitude: 0.11,

				// sun-synchronous / reconnaissance
				inclination: 98.0,

				// ~98 minute orbit
				orbitPeriod: 98,

				// visible size
				satSize: 0.008,

				// larger recon constellation
				numberOfPlanes: 8,
				satsPerPlane: 5

			}, () => {

				this.applyOrbitParameters();
				this.rebuildConstellation();

			});
		}
	}

	rebuildConstellation(){
		// =========================
		// REMOVE OLD SATELLITES
		// =========================

		this.satellites.forEach((sat) => {

			this.scene.remove(sat.mesh);

			sat.mesh.geometry.dispose();
			sat.mesh.material.dispose();

		});

		this.satellites = [];

		// =========================
		// REMOVE OLD ORBIT LINES
		// =========================

		this.orbitLines.forEach((line) => {

			this.scene.remove(line);

			line.geometry.dispose();
			line.material.dispose();

		});

		this.orbitLines = [];

		// =========================
		// BUILD NEW CONSTELLATION
		// =========================

		const numberOfPlanes = this.state.numberOfPlanes;
		const satsPerPlane = this.state.satsPerPlane;

		// GEO centered over Indian Ocean
		const targetingRAAN = -80 * Math.PI / 180;

		// spread between orbital planes
		const spread = 30 * Math.PI / 180;

		for (let p = 0; p < numberOfPlanes; p++){

			let raan;

			// =========================
			// SINGLE PLANE SAFE MODE
			// =========================

			if (numberOfPlanes === 1){

				raan = targetingRAAN;

			} else {

				const offset =
					(p / (numberOfPlanes - 1)) - 0.5;

				raan =
					targetingRAAN + offset * spread;
			}

			this.addPlane({
				sats: satsPerPlane,
				raan
			});
		}
	}

	updateTimeline(event){

		const progress =
			parseFloat(event.target.value);

		const simTime =
			this.warStart.getTime() +
			(progress * this.totalWarDuration);

		const simDate =
			new Date(simTime);

		// store manual time offset
		this.manualSimTime = simTime;

		this.setState({
			simProgress: progress,
			timeT: simDate.toUTCString()
		});
	}

	startTimelineDrag(){
		this.setState({
			isDraggingTimeline: true
		});
	}

	endTimelineDrag(){

		this.setState({
			isDraggingTimeline: false
		});

		// sync animation clock
		this.startTime = Date.now();
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
						<div> Iranian War March 2026</div>
						<div> {this.state.timeT} </div>
					</div>
				</div>

				<div className={styles.timelineContainer}>
					<input
						type="range"
						min="0"
						max="1"
						step="0.0001"
						value={this.state.simProgress}

						onMouseDown={this.startTimelineDrag}
						onMouseUp={this.endTimelineDrag}

						onTouchStart={this.startTimelineDrag}
						onTouchEnd={this.endTimelineDrag}

						onChange={this.updateTimeline}

						className={styles.timelineSlider}
					/>

					<div className={styles.timelineLabels}>
						<div>Mar 1 2026</div>
						<div>Apr 1 2026</div>
					</div>

				</div>

				<div className={styles.hoangControl}>
					<div 
						className={styles.satSelector}
						onClick={this.selectSat}
						data-satID="ICEYE_LEO"
					> 
						ICEYE LEO 
					</div>

					<div 
						className={styles.satSelector}
						onClick={this.selectSat}
						data-satID="GAOFEN_LEO"
					> 
						GaoFen LEO 
					</div>

					<div 
						className={styles.satSelector}
						onClick={this.selectSat}
						data-satID="GAOFEN4_GEO"
					> 
						GaoFen 4 GEO 
					</div>

					<div 
						className={styles.satSelector}
						onClick={this.selectSat}
						data-satID="YAOGAN_LEO"
					> 
						YaoGan LEO 
					</div>

				</div>
			</div>
		)
	}
}