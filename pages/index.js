"use client";

import { Component, createRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import styles from "../styles/Main.module.css";

export default class Main extends Component {

	constructor(props) {
		super(props);

		this.mountRef = createRef();
	}

	// ======================================================
	// LAT/LON TO XYZ
	// ======================================================
	latLonToXYZ(lat, lon, radius) {

		const phi = (90 - lat) * (Math.PI / 180);
		const theta = (lon + 180) * (Math.PI / 180);

		return new THREE.Vector3(
			-radius * Math.sin(phi) * Math.cos(theta),
			radius * Math.cos(phi),
			radius * Math.sin(phi) * Math.sin(theta)
		);
	}

	// ======================================================
	// ADD SATELLITE PLANE
	// ======================================================
	addPlane({ sats = 3, raan = 0 }) {

		for (let i = 0; i < sats; i++) {

			const phase =
				(2 * Math.PI / sats) * i;

			const sat = new THREE.Mesh(
				new THREE.SphereGeometry(
					0.001,
					12,
					12
				),
				new THREE.MeshBasicMaterial({
					color: 0xffff00
				})
			);

			this.scene.add(sat);

			this.satellites.push({
				mesh: sat,
				phase,
				raan
			});
		}

		this.addOrbitLine(raan);
	}

	// ======================================================
	// ORBIT VISUALIZATION
	// ======================================================
	addOrbitLine(raan) {

		const points = [];
		const segments = 256;

		const radius =
			this.orbitRadius * 1.001;

		for (let s = 0; s <= segments; s++) {

			const angle =
				(2 * Math.PI * s) / segments;

			let x =
				radius * Math.cos(angle);

			let z =
				radius * Math.sin(angle);

			let y = 0;

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
			const cosR = Math.cos(raan);
			const sinR = Math.sin(raan);

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
				color: 0xff4444,
				transparent: true,
				opacity: 0.5
			});

		const line =
			new THREE.LineLoop(
				geometry,
				material
			);

		this.scene.add(line);

		this.orbitLines.push(line);
	}

	// ======================================================
	// START ENVIRONMENT
	// ======================================================
	async startEnvironment() {

		const mount =
			this.mountRef.current;

		// ======================================================
		// SCENE
		// ======================================================

		this.scene = new THREE.Scene();

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

		this.renderer.setPixelRatio(
			window.devicePixelRatio
		);

		mount.appendChild(
			this.renderer.domElement
		);

		// ======================================================
		// CONTROLS
		// ======================================================

		this.controls =
			new OrbitControls(
				this.camera,
				this.renderer.domElement
			);

		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;

		this.controls.minDistance = 1.5;
		this.controls.maxDistance = 10;

		// ======================================================
		// LIGHTING
		// ======================================================

		const ambient =
			new THREE.AmbientLight(
				0xffffff,
				0.5
			);

		this.scene.add(ambient);

		const sun =
			new THREE.DirectionalLight(
				0xffffff,
				1.5
			);

		sun.position.set(5, 3, 5);

		this.scene.add(sun);

		// ======================================================
		// EARTH TEXTURE
		// ======================================================

		const loader =
			new THREE.TextureLoader();

		const earthTexture =
			loader.load(
				"/textures/8k_earth_daymap.jpg",
				() => {
					console.log(
						"Earth texture loaded"
					);
				},
				undefined,
				(err) => {
					console.error(
						"Texture failed:",
						err
					);
				}
			);

		earthTexture.colorSpace =
			THREE.SRGBColorSpace;

		// ======================================================
		// EARTH
		// ======================================================

		this.earthRadius = 1;

		this.earth = new THREE.Mesh(
			new THREE.SphereGeometry(
				this.earthRadius,
				128,
				128
			),
			new THREE.MeshStandardMaterial({
				map: earthTexture
			})
		);

		this.scene.add(this.earth);

		// ======================================================
		// EARTH ROTATION SPEED
		// ======================================================

		// accelerated simulation speed
		this.earthRotationSpeed =
			0.0005;

		// ======================================================
		// SATELLITE ORBIT PARAMETERS
		// ======================================================

		this.altitude = 0.1;

		this.orbitRadius =
			this.earthRadius +
			this.altitude;

		// ~120 sec simulated orbit
		this.orbitPeriod = 120;

		this.angularVelocity =
			(2 * Math.PI) /
			this.orbitPeriod;

		// Indian Ocean optimized
		this.inclination =
			55 * Math.PI / 180;

		// ======================================================
		// CONSTELLATION
		// ======================================================

		this.satellites = [];
		this.orbitLines = [];

		const numberOfPlanes = 7;
		const satsPerPlane = 24 * 6;

		// Indian Ocean center
		const centerRAAN =
			-80 * Math.PI / 180;

		const spread =
			30 * Math.PI / 180;

		for (let p = 0; p < numberOfPlanes; p++) {

			const offset =
				(p / (numberOfPlanes - 1))
				- 0.5;

			const raan =
				centerRAAN +
				offset * spread;

			this.addPlane({
				sats: satsPerPlane,
				raan
			});
		}

		// ======================================================
		// AIRCRAFT CARRIER
		// ======================================================

		// Real dimensions:
		// Length ~333m

		const carrierLength =
			(0.333 * 100 / 6371)
			* this.earthRadius;

		const carrierWidth =
			carrierLength * 0.25;

		const carrierHeight =
			carrierLength * 0.08;

		const carrierGeometry =
			new THREE.BoxGeometry(
				carrierWidth,
				carrierHeight,
				carrierLength
			);

		const carrierMaterial =
			new THREE.MeshStandardMaterial({
				color: "red"
			});

		this.carrier =
			new THREE.Mesh(
				carrierGeometry,
				carrierMaterial
			);

		this.scene.add(this.carrier);

		// ======================================================
		// CARRIER SPEED
		// ======================================================

		this.realEarthRadiusKm = 6371;

		// 25 knots
		this.carrierSpeedKmh = 46;

		// relative motion to Earth
		this.carrierAngularVelocity =
			(
				this.carrierSpeedKmh /
				(
					2 *
					Math.PI *
					this.realEarthRadiusKm
				)
			)
			*
			(2 * Math.PI)
			/
			3600;

		this.carrierAngle = 0;

		// ======================================================
		// TIME
		// ======================================================

		this.startTime = Date.now();

		// ======================================================
		// ANIMATION LOOP
		// ======================================================

		const animate = () => {

			this.animationId =
				requestAnimationFrame(animate);

			const t =
				(Date.now() - this.startTime)
				/ 1000;

			const baseAngle =
				this.angularVelocity * t;

			// ======================================================
			// SATELLITES
			// ======================================================

			this.satellites.forEach((sat) => {

				const angle =
					baseAngle + sat.phase;

				let x =
					this.orbitRadius *
					Math.cos(angle);

				let z =
					this.orbitRadius *
					Math.sin(angle);

				let y = 0;

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

			// ======================================================
			// EARTH ROTATION
			// ======================================================

			this.earth.rotation.y +=
				this.earthRotationSpeed / 10;

			// ======================================================
			// CARRIER MOVEMENT
			// ======================================================

			// propulsion speed
			this.carrierAngle +=
				this.carrierAngularVelocity;

			// Earth rotation compensation
			const earthRotationOffset =
				this.earth.rotation.y;

			// Indian Ocean patrol route
			const carrierLat = 16;

			const carrierLon =
				75 +
				(this.carrierAngle
					* 180
					/ Math.PI)
				-
				(
					earthRotationOffset
					* 180
					/ Math.PI
				);

			const carrierPos =
				this.latLonToXYZ(
					carrierLat,
					carrierLon,
					this.earthRadius + 0.002
				);

			this.carrier.position.copy(
				carrierPos
			);

			// align to Earth
			this.carrier.lookAt(
				0,
				0,
				0
			);

			this.carrier.rotateX(
				Math.PI / 2
			);

			// ======================================================
			// UPDATE + RENDER
			// ======================================================

			this.controls.update();

			this.renderer.render(
				this.scene,
				this.camera
			);
		};

		animate();

		// ======================================================
		// RESIZE
		// ======================================================

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

	// ======================================================
	// REACT
	// ======================================================

	componentDidMount() {
		this.startEnvironment();
	}

	componentWillUnmount() {

		cancelAnimationFrame(
			this.animationId
		);

		window.removeEventListener(
			"resize",
			this.handleResize
		);

		if (this.renderer) {
			this.renderer.dispose();
		}
	}

	// ======================================================
	// RENDER
	// ======================================================

	render() {

		return (
			<div className={styles.container}>

				<div
					ref={this.mountRef}
					className={styles.satSim}
				/>

				<div className={styles.overlayInfo}>
					<div className={styles.title}>
						Indian Ocean Satellite Simulator
					</div>
				</div>

			</div>
		);
	}
}