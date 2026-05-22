"use client";

import { Component, createRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import styles from "../styles/Earth.module.css";

export default class Earth extends Component {

	constructor(props){

		super(props);

		this.simRef = createRef();

		this.state = {

			// =====================================
			// TIME
			// =====================================

			timeT: "",
			simProgress: 0,
			isDraggingTimeline: false,

			// =====================================
			// ORBIT
			// =====================================

			altitude: 0.089,
			orbitPeriod: 96,
			inclination: 97.7,

			// =====================================
			// SATELLITES
			// =====================================

			satSize: 0.006,
			satColor: "blue",

			numberOfPlanes: 3,
			satsPerPlane: 7
		};

		this.startEnvironment =
			this.startEnvironment.bind(this);

		this.addPlane =
			this.addPlane.bind(this);

		this.selectSat =
			this.selectSat.bind(this);

		this.updateTimeline =
			this.updateTimeline.bind(this);

		this.startTimelineDrag =
			this.startTimelineDrag.bind(this);

		this.endTimelineDrag =
			this.endTimelineDrag.bind(this);
	}

	// =====================================================
	// LAT LON TO VECTOR3
	// =====================================================

	latLonToVector3(lat, lon, radius){

		const phi =
			(90 - lat) * (Math.PI / 180);

		const theta =
			(lon + 180) * (Math.PI / 180);

		const x =
			-(radius * Math.sin(phi) * Math.cos(theta));

		const z =
			(radius * Math.sin(phi) * Math.sin(theta));

		const y =
			radius * Math.cos(phi);

		return new THREE.Vector3(x, y, z);
	}

	// =====================================================
	// ADD SATELLITE PLANE
	// =====================================================

	addPlane({ sats = 1, raan = 0 }){

		for (let i = 0; i < sats; i++){

			const phase =
				(2 * Math.PI / sats) * i;

			// =================================
			// SATELLITE
			// =================================

			const sat =
				new THREE.Mesh(

					new THREE.SphereGeometry(
						this.state.satSize,
						12,
						12
					),

					new THREE.MeshBasicMaterial({
						color: this.state.satColor
					})
				);

			this.scene.add(sat);

			// =================================
			// FOOTPRINT
			// =================================

			const footprint =
				new THREE.Mesh(

					new THREE.PlaneGeometry(
						0.05,
						0.05
					),

					new THREE.MeshBasicMaterial({

						color: this.state.satColor,

						transparent: true,

						opacity: 0.3,

						side: THREE.DoubleSide
					})
				);

			footprint.rotation.x =
				-Math.PI / 2;

			this.scene.add(footprint);

			this.satellites.push({

				mesh: sat,

				footprint,

				phase,

				raan
			});
		}

		this.addOrbitLine(raan);
	}

	// =====================================================
	// ORBIT LINE
	// =====================================================

	addOrbitLine(raan){

		const segments = 128;

		const points = [];

		const radius =
			this.orbitRadius * 1.01;

		for (let s = 0; s <= segments; s++){

			const angle =
				(2 * Math.PI * s) / segments;

			let x =
				radius * Math.cos(angle);

			let y = 0;

			let z =
				radius * Math.sin(angle);

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
				Math.cos(raan);

			const sinR =
				Math.sin(raan);

			let xFinal =
				x * cosR -
				zInclined * sinR;

			let zFinal =
				x * sinR +
				zInclined * cosR;

			points.push(
				new THREE.Vector3(
					xFinal,
					yInclined,
					zFinal
				)
			);
		}

		const geometry =
			new THREE.BufferGeometry()
			.setFromPoints(points);

		const material =
			new THREE.LineBasicMaterial({

				color: "white",

				transparent: true,

				opacity: 0.1
			});

		const line =
			new THREE.LineLoop(
				geometry,
				material
			);

		this.scene.add(line);

		this.orbitLines.push(line);
	}

	// =====================================================
	// START ENVIRONMENT
	// =====================================================

	async startEnvironment(){

		const mount =
			this.simRef.current;

		// =====================================
		// SIMULATION WINDOW
		// =====================================

		this.warStart =
			new Date(
				"2026-03-01T00:00:00Z"
			);

		this.warEnd =
			new Date(
				"2026-03-02T00:00:00Z"
			);

		this.totalWarDuration =
			this.warEnd.getTime() -
			this.warStart.getTime();

		// =====================================
		// TIME SCALE
		// =====================================

		// 1 second = 10 simulated minutes

		this.simMinutesPerSecond = 10;

		// =====================================
		// SCENE
		// =====================================

		this.scene =
			new THREE.Scene();

		this.camera =
			new THREE.PerspectiveCamera(

				60,

				mount.clientWidth /
				mount.clientHeight,

				0.1,

				1000
			);

		this.camera.position.set(
			0,
			1.5,
			3
		);

		this.renderer =
			new THREE.WebGLRenderer({

				antialias: true
			});

		this.renderer.setSize(
			mount.clientWidth,
			mount.clientHeight
		);

		mount.appendChild(
			this.renderer.domElement
		);

		// =====================================
		// LIGHTS
		// =====================================

		const sun =
			new THREE.DirectionalLight(
				0xffffff,
				8
			);

		sun.position.set(5, 3, 5);

		this.scene.add(sun);

		const ambient =
			new THREE.AmbientLight(
				0xffffff,
				0.3
			);

		this.scene.add(ambient);

		// =====================================
		// CONTROLS
		// =====================================

		this.controls =
			new OrbitControls(
				this.camera,
				this.renderer.domElement
			);

		this.controls.enableDamping =
			true;

		// =====================================
		// EARTH
		// =====================================

		const loader =
			new THREE.TextureLoader();

		const earthTexture =
			loader.load(
				"/textures/8081_earthlights4k.jpg"
			);

		this.earth =
			new THREE.Mesh(

				new THREE.SphereGeometry(
					1,
					64,
					64
				),

				new THREE.MeshStandardMaterial({

					map: earthTexture
				})
			);

		this.scene.add(this.earth);

		// =====================================
		// US CARRIER
		// =====================================

		this.carrierLat =
			21.888884087895217;

		this.carrierLon =
			62.8574839512631;

		// this.carrierLat =
		// 	11.856907110439073;

		// this.carrierLon =
		// 	60.73605440995559

		this.carrier =
			new THREE.Mesh(

				new THREE.BoxGeometry(
					0.002,
					0.006,
					0.001
				),

				new THREE.MeshBasicMaterial({
					color: "orange"
				})
			);

		this.scene.add(this.carrier);

		// =====================================
		// CARRIER STRIKE RANGE
		// =====================================

		// Approximate F-35 strike radius
		// ~1200 km combat radius

		const strikeRadiusKm = 1200;

		// Earth radius equivalent
		// Earth sphere = 1 unit = 6371 km

		const strikeRadius =
			(strikeRadiusKm / 6371);

		// visual scaling boost
		const visualRadius =
			strikeRadius * 1.4;

		this.carrierRing =
			new THREE.Mesh(

				new THREE.RingGeometry(

					visualRadius,

					visualRadius + 0.01,

					128
				),

				new THREE.MeshBasicMaterial({

					color: "orange",

					side: THREE.DoubleSide,

					transparent: true,

					opacity: 0.25
				})
			);

		this.scene.add(
			this.carrierRing
		);

		// =====================================
		// ORBIT PARAMS
		// =====================================

		this.earthRadius = 1;

		this.orbitRadius =
			this.earthRadius +
			this.state.altitude;

		this.orbitPeriod =
			this.state.orbitPeriod;

		this.angularVelocity =
			(2 * Math.PI) /
			(this.orbitPeriod * 60);

		this.inclination =
			this.state.inclination *
			Math.PI / 180;

		// =====================================
		// STORAGE
		// =====================================

		this.satellites = [];
		this.orbitLines = [];

		// =====================================
		// BUILD CONSTELLATION
		// =====================================

		this.rebuildConstellation();

		// =====================================
		// START TIME
		// =====================================

		this.currentSimBaseTime =
			this.warStart.getTime();

		this.startTime =
			Date.now();

		// =====================================
		// ANIMATION LOOP
		// =====================================

		const animate = () => {

			this.animationId =
				requestAnimationFrame(
					animate
				);

			let simTime;

			// =================================
			// TIMELINE CONTROL
			// =================================

			if (
				this.state.isDraggingTimeline
			){

				simTime =
					this.manualSimTime;

			} else {

				const elapsedRealSeconds =
					(Date.now() -
					this.startTime) / 1000;

				const simulatedMs =
					elapsedRealSeconds *
					this.simMinutesPerSecond *
					60 *
					1000;

				simTime =
					this.currentSimBaseTime +
					simulatedMs;
			}

			if (
				simTime >
				this.warEnd.getTime()
			){
				simTime =
					this.warEnd.getTime();
			}

			// =================================
			// SIM DATE
			// =================================

			const simDate =
				new Date(simTime);

			const progress =
				(
					simTime -
					this.warStart.getTime()
				) /
				this.totalWarDuration;

			this.setState({

				timeT:
					simDate.toUTCString(),

				simProgress:
					progress
			});

			// =================================
			// SAT TIME
			// =================================

			const t =
				(
					simTime -
					this.warStart.getTime()
				) / 1000;

			const baseAngle =
				this.angularVelocity * t;

			// =================================
			// EARTH ROTATION
			// =================================

			const earthRotationRate =
				(2 * Math.PI) /
				(24 * 3600);

			this.earth.rotation.y =
				earthRotationRate * t;

			// =================================
			// CARRIER POSITION (STATIONARY)
			// =================================

			// carrier fixed on Earth surface

			const carrierSurfacePos =
				this.latLonToVector3(

					this.carrierLat,

					this.carrierLon,

					this.earthRadius + 0.003
				);

			// rotate with Earth

			carrierSurfacePos.applyAxisAngle(
				new THREE.Vector3(0, 1, 0),
				this.earth.rotation.y
			);

			this.carrier.position.copy(
				carrierSurfacePos
			);

			this.carrier.lookAt(
				0,
				0,
				0
			);

			// =================================
			// CARRIER RING
			// =================================

			const ringSurfacePos =
				this.latLonToVector3(

					this.carrierLat,

					this.carrierLon,

					this.earthRadius + 0.001
				);

			ringSurfacePos.applyAxisAngle(
				new THREE.Vector3(0, 1, 0),
				this.earth.rotation.y
			);

			this.carrierRing.position.copy(
				ringSurfacePos
			);

			this.carrierRing.lookAt(
				0,
				0,
				0
			);

			const pulse =
				1 +
				(Math.sin(t * 0.002) * 0.15);

			this.carrierRing.scale.set(
				pulse,
				pulse,
				pulse
			);

			// =================================
			// SATELLITES
			// =================================

			this.satellites.forEach((sat) => {

				const angle =
					baseAngle +
					sat.phase;

				let x =
					this.orbitRadius *
					Math.cos(angle);

				let y = 0;

				let z =
					this.orbitRadius *
					Math.sin(angle);

				// inclination

				const cosI =
					Math.cos(
						this.inclination
					);

				const sinI =
					Math.sin(
						this.inclination
					);

				let yInclined =
					y * cosI -
					z * sinI;

				let zInclined =
					y * sinI +
					z * cosI;

				// RAAN

				const cosR =
					Math.cos(
						sat.raan
					);

				const sinR =
					Math.sin(
						sat.raan
					);

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

				// =============================
				// FOOTPRINT
				// =============================

				const direction =
					new THREE.Vector3(

						xFinal,

						yInclined,

						zFinal

					).normalize();

				const groundPos =
					direction.multiplyScalar(
						this.earthRadius +
						0.001
					);

				sat.footprint.position.set(

					groundPos.x,

					groundPos.y,

					groundPos.z
				);

				sat.footprint.lookAt(
					0,
					0,
					0
				);
			});

			this.controls.update();

			this.renderer.render(
				this.scene,
				this.camera
			);
		};

		animate();

		// =====================================
		// RESIZE
		// =====================================

		this.handleResize = () => {

			this.camera.aspect =
				mount.clientWidth /
				mount.clientHeight;

			this.camera.updateProjectionMatrix();

			this.renderer.setSize(

				mount.clientWidth,

				mount.clientHeight
			);
		};

		window.addEventListener(
			"resize",
			this.handleResize
		);
	}

	// =====================================================
	// REBUILD CONSTELLATION
	// =====================================================

	rebuildConstellation(){

		// remove old sats

		if (this.satellites){

			this.satellites.forEach((sat) => {

				this.scene.remove(
					sat.mesh
				);

				this.scene.remove(
					sat.footprint
				);

				sat.mesh.geometry.dispose();

				sat.mesh.material.dispose();

				sat.footprint.geometry.dispose();

				sat.footprint.material.dispose();
			});
		}

		this.satellites = [];

		// remove old lines

		if (this.orbitLines){

			this.orbitLines.forEach((line) => {

				this.scene.remove(line);

				line.geometry.dispose();

				line.material.dispose();
			});
		}

		this.orbitLines = [];

		// build

		const numberOfPlanes =
			this.state.numberOfPlanes;

		const satsPerPlane =
			this.state.satsPerPlane;

		const targetingRAAN =
			-80 * Math.PI / 180;

		const spread =
			40 * Math.PI / 180;

		for (let p = 0; p < numberOfPlanes; p++){

			let raan;

			if (numberOfPlanes === 1){

				raan =
					targetingRAAN;

			} else {

				const offset =
					(
						p /
						(numberOfPlanes - 1)
					) - 0.5;

				raan =
					targetingRAAN +
					offset * spread;
			}

			this.addPlane({

				sats: satsPerPlane,

				raan
			});
		}
	}

	// =====================================================
	// APPLY ORBIT
	// =====================================================

	applyOrbitParameters(){

		this.orbitRadius =
			this.earthRadius +
			this.state.altitude;

		this.inclination =
			this.state.inclination *
			Math.PI / 180;

		this.orbitPeriod =
			this.state.orbitPeriod;

		this.angularVelocity =
			(2 * Math.PI) /
			(this.orbitPeriod * 60);
	}

	// =====================================================
	// SELECT CONSTELLATION
	// =====================================================

	selectSat(event){

		const constellation =
			event.target.dataset.satid;

		// =====================================
		// ICEYE
		// =====================================

		if (constellation === "ICEYE_LEO"){

			this.camera.position.set(
				0,
				1.5,
				3
			);

			this.setState({

				satColor: "blue",

				altitude: 0.089,

				inclination: 97.7,

				orbitPeriod: 96,

				satSize: 0.006,

				numberOfPlanes: 3,

				satsPerPlane: 7

			}, () => {

				this.applyOrbitParameters();

				this.rebuildConstellation();
			});
		}

		// =====================================
		// GEO
		// =====================================

		else if (
			constellation ===
			"GAOFEN4_GEO"
		){

			this.camera.position.set(
				2,
				3,
				10
			);

			this.setState({

				satColor: "yellow",

				altitude: 5.617,

				inclination: 0.1,

				orbitPeriod: 1440,

				satSize: 0.03,

				numberOfPlanes: 1,

				satsPerPlane: 3

			}, () => {

				this.applyOrbitParameters();

				this.rebuildConstellation();
			});
		}

		// =====================================
		// YAOGAN
		// =====================================

		else if (
			constellation ===
			"YAOGAN_LEO"
		){

			this.camera.position.set(
				0,
				1.5,
				3
			);

			this.setState({

				satColor: "lime",

				altitude: 0.11,

				inclination: 98,

				orbitPeriod: 98,

				satSize: 0.008,

				numberOfPlanes: 8,

				satsPerPlane: 5

			}, () => {

				this.applyOrbitParameters();

				this.rebuildConstellation();
			});
		}
	}

	// =====================================================
	// TIMELINE
	// =====================================================

	updateTimeline(event){

		const progress =
			parseFloat(
				event.target.value
			);

		const simTime =
			this.warStart.getTime() +
			(progress *
			this.totalWarDuration);

		this.manualSimTime =
			simTime;

		this.setState({

			simProgress: progress,

			timeT:
				new Date(simTime)
				.toUTCString()
		});
	}

	startTimelineDrag(){

		this.setState({

			isDraggingTimeline: true
		});
	}

	endTimelineDrag(){

		this.currentSimBaseTime =
			this.manualSimTime;

		this.startTime =
			Date.now();

		this.setState({

			isDraggingTimeline: false
		});
	}

	// =====================================================
	// LIFECYCLE
	// =====================================================

	componentDidMount(){

		this.startEnvironment();
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

	// =====================================================
	// RENDER
	// =====================================================

	render(){

		return (

			<div className={styles.container}>

				<div
					ref={this.simRef}
					className={styles.satSim}
				/>

				{/* ================================= */}
				{/* INFO */}
				{/* ================================= */}

				<div className={styles.overlayInfo}>

					<div className={styles.title}>

						<div>
							Iranian War March 2026
						</div>

						<div>
							{this.state.timeT}
						</div>

					</div>

				</div>

				{/* ================================= */}
				{/* TIMELINE */}
				{/* ================================= */}

				<div className={styles.timelineContainer}>

					<input

						type="range"

						min="0"

						max="1"

						step="0.0001"

						value={
							this.state.simProgress
						}

						onChange={
							this.updateTimeline
						}

						onMouseDown={
							this.startTimelineDrag
						}

						onMouseUp={
							this.endTimelineDrag
						}

						onTouchStart={
							this.startTimelineDrag
						}

						onTouchEnd={
							this.endTimelineDrag
						}

						className={
							styles.timelineSlider
						}
					/>

					<div
						className={
							styles.timelineLabels
						}
					>

						<div>
							Mar 1 2026
						</div>

						<div>
							Mar 2 2026
						</div>

					</div>

				</div>

				{/* ================================= */}
				{/* CONTROLS */}
				{/* ================================= */}

				<div className={styles.hoangControl}>

					<div

						className={
							styles.satSelector
						}

						onClick={
							this.selectSat
						}

						data-satID="ICEYE_LEO"
					>

						ICEYE LEO

					</div>

					<div

						className={
							styles.satSelector
						}

						onClick={
							this.selectSat
						}

						data-satID="GAOFEN4_GEO"
					>

						GaoFen 4 GEO

					</div>

					<div

						className={
							styles.satSelector
						}

						onClick={
							this.selectSat
						}

						data-satID="YAOGAN_LEO"
					>

						YaoGan LEO

					</div>

				</div>

			</div>
		);
	}
}